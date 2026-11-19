import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  CONCERNS_ACTIVE_MAX,
  optionalName,
  specialtyCode,
  type CatalogIcon,
  type ConcernTone,
} from './catalog-rules';

type Tx = Prisma.TransactionClient;

export interface SpecialtyInput {
  readonly nameEn?: string;
  readonly nameAr?: string | null;
  readonly nameKu?: string | null;
  readonly icon?: CatalogIcon;
  readonly showOnHome?: boolean;
  readonly status?: 'active' | 'inactive';
}

export interface ConcernInput {
  readonly labelEn?: string;
  readonly labelAr?: string;
  readonly labelKu?: string;
  readonly icon?: CatalogIcon;
  readonly tone?: ConcernTone;
  readonly status?: 'active' | 'inactive';
  readonly specialtyIds?: readonly string[];
}

const specialtyOrder: Prisma.SpecialtyOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { displayName: 'asc' },
];
const concernOrder: Prisma.HomeConcernOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { createdAt: 'asc' },
];

/**
 * Specialties and Home's "What's bothering you?" tiles, managed from the
 * Owner Portal. Doctors connect through their specialties: a tile lists the
 * doctors of every specialty linked to it.
 */
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /** What the app needs: active specialties and tiles, in order. */
  async appCatalog() {
    const [specialties, concerns] = await Promise.all([
      this.prisma.db.specialty.findMany({
        where: { status: 'active' },
        orderBy: specialtyOrder,
      }),
      this.prisma.db.homeConcern.findMany({
        where: { status: 'active' },
        orderBy: concernOrder,
        include: {
          specialties: {
            where: { specialty: { status: 'active' } },
            include: { specialty: { select: { code: true } } },
          },
        },
      }),
    ]);
    return {
      specialties: specialties.map((s) => ({
        code: s.code,
        names: {
          en: s.displayName,
          ar: s.nameAr ?? s.displayName,
          ku: s.nameKu ?? s.displayName,
        },
        icon: s.icon,
        showOnHome: s.showOnHome,
      })),
      concerns: concerns
        .filter((c) => c.specialties.length > 0)
        .map((c) => ({
          id: c.id,
          labels: { en: c.labelEn, ar: c.labelAr, ku: c.labelKu },
          icon: c.icon,
          tone: c.tone,
          specialtyCodes: c.specialties
            .map((link) => link.specialty.code)
            .sort(),
        })),
    };
  }

  // ---- Specialties ----

  async platformSpecialties() {
    const [rows, counts] = await Promise.all([
      this.prisma.db.specialty.findMany({
        orderBy: specialtyOrder,
        include: {
          concerns: {
            include: { concern: { select: { id: true, labelEn: true } } },
          },
        },
      }),
      this.doctorCounts(),
    ]);
    return rows.map((s) => ({
      id: s.id,
      code: s.code,
      nameEn: s.displayName,
      nameAr: s.nameAr,
      nameKu: s.nameKu,
      icon: s.icon,
      showOnHome: s.showOnHome,
      status: s.status,
      sortOrder: s.sortOrder,
      activeDoctors: counts.get(s.id) ?? 0,
      tiles: s.concerns.map((link) => ({
        id: link.concern.id,
        labelEn: link.concern.labelEn,
      })),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  async createSpecialty(
    actorId: string,
    input: SpecialtyInput & { nameEn: string },
    requestId: string,
  ) {
    const nameEn = input.nameEn.trim();
    const code = specialtyCode(nameEn);
    if (!code)
      throw new BadRequestException(
        'Write the English name with Latin letters, e.g. "Cardiology".',
      );
    return this.prisma.db.$transaction(async (tx) => {
      if (await tx.specialty.findUnique({ where: { code } }))
        throw new ConflictException(
          'A specialty with this English name already exists.',
        );
      const last = await tx.specialty.aggregate({ _max: { sortOrder: true } });
      const created = await tx.specialty.create({
        data: {
          code,
          displayName: nameEn,
          nameAr: optionalName(input.nameAr),
          nameKu: optionalName(input.nameKu),
          icon: input.icon ?? 'hospital',
          showOnHome: input.showOnHome ?? true,
          sortOrder: Math.min((last._max.sortOrder ?? 0) + 10, 10_000),
        },
      });
      await this.audit(
        tx,
        actorId,
        'platform.specialty.created',
        'Specialty',
        created.id,
        requestId,
        {
          code,
          nameEn,
        },
      );
      return { id: created.id, code };
    });
  }

  async updateSpecialty(
    actorId: string,
    id: string,
    input: SpecialtyInput,
    requestId: string,
  ) {
    await this.prisma.db.$transaction(async (tx) => {
      const current = await tx.specialty.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Specialty was not found.');
      const data: Prisma.SpecialtyUpdateInput = {};
      if (input.nameEn !== undefined) {
        const nameEn = input.nameEn.trim();
        if (!nameEn) throw new BadRequestException('Write the English name.');
        data.displayName = nameEn;
      }
      if (input.nameAr !== undefined) data.nameAr = optionalName(input.nameAr);
      if (input.nameKu !== undefined) data.nameKu = optionalName(input.nameKu);
      if (input.icon !== undefined) data.icon = input.icon;
      if (input.showOnHome !== undefined) data.showOnHome = input.showOnHome;
      if (input.status !== undefined) data.status = input.status;
      await tx.specialty.update({ where: { id }, data });
      await this.audit(
        tx,
        actorId,
        'platform.specialty.updated',
        'Specialty',
        id,
        requestId,
        {
          changed: Object.keys(data),
        },
      );
    });
  }

  async reorderSpecialties(
    actorId: string,
    ids: readonly string[],
    requestId: string,
  ) {
    await this.prisma.db.$transaction(async (tx) => {
      const all = await tx.specialty.findMany({ select: { id: true } });
      this.checkOrder(ids, all);
      for (const [index, id] of ids.entries())
        await tx.specialty.update({
          where: { id },
          data: { sortOrder: (index + 1) * 10 },
        });
      await this.audit(
        tx,
        actorId,
        'platform.specialty.reordered',
        'Specialty',
        null,
        requestId,
        {
          count: ids.length,
        },
      );
    });
  }

  // ---- "What's bothering you?" tiles ----

  async platformConcerns() {
    const [rows, counts] = await Promise.all([
      this.prisma.db.homeConcern.findMany({
        orderBy: concernOrder,
        include: {
          specialties: {
            include: {
              specialty: {
                select: {
                  id: true,
                  code: true,
                  displayName: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      this.doctorsPerConcern(),
    ]);
    return rows.map((c) => ({
      id: c.id,
      labelEn: c.labelEn,
      labelAr: c.labelAr,
      labelKu: c.labelKu,
      icon: c.icon,
      tone: c.tone,
      status: c.status,
      sortOrder: c.sortOrder,
      activeDoctors: counts.get(c.id) ?? 0,
      specialties: c.specialties
        .map((link) => ({
          id: link.specialty.id,
          code: link.specialty.code,
          nameEn: link.specialty.displayName,
          status: link.specialty.status,
        }))
        .sort((a, b) => a.nameEn.localeCompare(b.nameEn)),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async createConcern(
    actorId: string,
    input: Required<Omit<ConcernInput, 'status'>>,
    requestId: string,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      await this.checkSpecialties(tx, input.specialtyIds);
      await this.checkActiveLimit(tx, 1);
      const last = await tx.homeConcern.aggregate({
        _max: { sortOrder: true },
      });
      const created = await tx.homeConcern.create({
        data: {
          labelEn: input.labelEn.trim(),
          labelAr: input.labelAr.trim(),
          labelKu: input.labelKu.trim(),
          icon: input.icon,
          tone: input.tone,
          sortOrder: Math.min((last._max.sortOrder ?? 0) + 10, 10_000),
          specialties: {
            create: [...new Set(input.specialtyIds)].map((specialtyId) => ({
              specialtyId,
            })),
          },
        },
      });
      await this.audit(
        tx,
        actorId,
        'platform.concern.created',
        'HomeConcern',
        created.id,
        requestId,
        {
          labelEn: created.labelEn,
          specialties: input.specialtyIds.length,
        },
      );
      return { id: created.id };
    });
  }

  async updateConcern(
    actorId: string,
    id: string,
    input: ConcernInput,
    requestId: string,
  ) {
    await this.prisma.db.$transaction(async (tx) => {
      const current = await tx.homeConcern.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Tile was not found.');
      const data: Prisma.HomeConcernUpdateInput = {};
      for (const field of ['labelEn', 'labelAr', 'labelKu'] as const) {
        const value = input[field];
        if (value === undefined) continue;
        if (!value.trim())
          throw new BadRequestException(
            'Write the tile text in every language.',
          );
        data[field] = value.trim();
      }
      if (input.icon !== undefined) data.icon = input.icon;
      if (input.tone !== undefined) data.tone = input.tone;
      if (input.status !== undefined) {
        if (input.status === 'active' && current.status !== 'active')
          await this.checkActiveLimit(tx, 1);
        data.status = input.status;
      }
      if (input.specialtyIds !== undefined) {
        await this.checkSpecialties(tx, input.specialtyIds);
        await tx.homeConcernSpecialty.deleteMany({ where: { concernId: id } });
        await tx.homeConcernSpecialty.createMany({
          data: [...new Set(input.specialtyIds)].map((specialtyId) => ({
            concernId: id,
            specialtyId,
          })),
        });
        data.updatedAt = new Date();
      }
      await tx.homeConcern.update({ where: { id }, data });
      await this.audit(
        tx,
        actorId,
        'platform.concern.updated',
        'HomeConcern',
        id,
        requestId,
        {
          changed: [
            ...Object.keys(data).filter((key) => key !== 'updatedAt'),
            ...(input.specialtyIds !== undefined ? ['specialties'] : []),
          ],
        },
      );
    });
  }

  async deleteConcern(actorId: string, id: string, requestId: string) {
    await this.prisma.db.$transaction(async (tx) => {
      const current = await tx.homeConcern.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Tile was not found.');
      await tx.homeConcern.delete({ where: { id } });
      await this.audit(
        tx,
        actorId,
        'platform.concern.deleted',
        'HomeConcern',
        id,
        requestId,
        {
          labelEn: current.labelEn,
        },
      );
    });
  }

  async reorderConcerns(
    actorId: string,
    ids: readonly string[],
    requestId: string,
  ) {
    await this.prisma.db.$transaction(async (tx) => {
      const all = await tx.homeConcern.findMany({ select: { id: true } });
      this.checkOrder(ids, all);
      for (const [index, id] of ids.entries())
        await tx.homeConcern.update({
          where: { id },
          data: { sortOrder: (index + 1) * 10 },
        });
      await this.audit(
        tx,
        actorId,
        'platform.concern.reordered',
        'HomeConcern',
        null,
        requestId,
        {
          count: ids.length,
        },
      );
    });
  }

  // ---- Doctors ----

  /** Replaces a doctor's specialties; one of them is the main one. */
  async setDoctorSpecialties(
    actorId: string,
    doctorId: string,
    specialtyIds: readonly string[],
    primaryId: string,
    requestId: string,
  ) {
    const unique = [...new Set(specialtyIds)];
    if (!unique.length || unique.length > 5)
      throw new BadRequestException('Choose 1 to 5 specialties.');
    if (!unique.includes(primaryId))
      throw new BadRequestException('The main specialty must be one of them.');
    await this.prisma.db.$transaction(async (tx) => {
      const doctor = await tx.doctor.findUnique({
        where: { id: doctorId },
        select: { id: true, organizationId: true },
      });
      if (!doctor) throw new NotFoundException('Doctor was not found.');
      const found = await tx.specialty.count({
        where: { id: { in: unique }, status: 'active' },
      });
      if (found !== unique.length)
        throw new BadRequestException('Choose active specialties only.');
      await tx.doctorSpecialtyAssignment.deleteMany({ where: { doctorId } });
      await tx.doctorSpecialtyAssignment.createMany({
        data: unique.map((specialtyId) => ({
          doctorId,
          specialtyId,
          isPrimary: specialtyId === primaryId,
        })),
      });
      await tx.doctor.update({
        where: { id: doctorId },
        data: { version: { increment: 1 } },
      });
      await tx.auditEvent.create({
        data: {
          organizationId: doctor.organizationId,
          actorUserId: actorId,
          action: 'platform.doctor.specialties.updated',
          targetType: 'Doctor',
          targetId: doctorId,
          outcome: 'succeeded',
          requestId,
          metadata: { specialties: unique.length },
          occurredAt: new Date(),
        },
      });
    });
  }

  // ---- Helpers ----

  /** Active doctors per specialty. */
  private async doctorCounts(): Promise<Map<string, number>> {
    const rows = await this.prisma.db.doctorSpecialtyAssignment.groupBy({
      by: ['specialtyId'],
      where: { doctor: { status: 'active' } },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.specialtyId, row._count._all]));
  }

  /** Distinct active doctors reachable from each tile. */
  private async doctorsPerConcern(): Promise<Map<string, number>> {
    const rows = await this.prisma.db.$queryRaw<
      { concern_id: string; doctors: bigint }[]
    >`SELECT l."concern_id", COUNT(DISTINCT a."doctor_id") AS "doctors"
      FROM "home_concern_specialties" l
      JOIN "specialties" s ON s."id" = l."specialty_id" AND s."status" = 'active'
      JOIN "doctor_specialties" a ON a."specialty_id" = l."specialty_id"
      JOIN "doctors" d ON d."id" = a."doctor_id" AND d."status" = 'active'
      GROUP BY l."concern_id"`;
    return new Map(rows.map((row) => [row.concern_id, Number(row.doctors)]));
  }

  private async checkSpecialties(tx: Tx, ids: readonly string[]) {
    const unique = [...new Set(ids)];
    if (!unique.length)
      throw new BadRequestException('Link the tile to at least one specialty.');
    if (unique.length > 20)
      throw new BadRequestException('Link at most 20 specialties.');
    const found = await tx.specialty.count({ where: { id: { in: unique } } });
    if (found !== unique.length)
      throw new BadRequestException('A chosen specialty no longer exists.');
  }

  private async checkActiveLimit(tx: Tx, adding: number) {
    const active = await tx.homeConcern.count({ where: { status: 'active' } });
    if (active + adding > CONCERNS_ACTIVE_MAX)
      throw new BadRequestException(
        `At most ${CONCERNS_ACTIVE_MAX} tiles can be shown. Hide one first.`,
      );
  }

  private checkOrder(ids: readonly string[], all: { id: string }[]) {
    const known = new Set(all.map((row) => row.id));
    if (
      ids.length !== known.size ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !known.has(id))
    )
      throw new BadRequestException('Send every item exactly once.');
  }

  private audit(
    tx: Tx,
    actorId: string,
    action: string,
    targetType: string,
    targetId: string | null,
    requestId: string,
    metadata: Prisma.InputJsonObject,
  ) {
    return tx.auditEvent.create({
      data: {
        actorUserId: actorId,
        action,
        targetType,
        targetId,
        outcome: 'succeeded',
        requestId,
        metadata,
        occurredAt: new Date(),
      },
    });
  }
}

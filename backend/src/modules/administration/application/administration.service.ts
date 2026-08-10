import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { keyedHash, safeEqualHex } from '../../identity/domain/security';
import type {
  AdministrationAccess,
  AdministrationCursor,
  ClinicRecord,
  OrganizationRecord,
} from '../domain/administration';
import {
  ADMINISTRATION_REPOSITORY,
  type AdministrationRepository,
} from '../domain/administration.repository';

export interface AdministrationListInput {
  readonly pageSize: number;
  readonly cursor?: string;
  readonly organizationId?: string;
}

@Injectable()
export class AdministrationService {
  constructor(
    @Inject(ADMINISTRATION_REPOSITORY)
    private readonly repository: AdministrationRepository,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  createOrganization(
    access: AdministrationAccess,
    name: string,
    requestId: string,
    idempotencyKey: string,
  ) {
    const normalized = name.trim();
    return this.repository.createOrganization(access, normalized, requestId, {
      key: this.key(idempotencyKey),
      scope: 'administration.organization.create',
      hash: this.hash({ name: normalized }),
    });
  }

  async organizations(
    access: AdministrationAccess,
    input: AdministrationListInput,
  ) {
    const cursor = input.cursor
      ? this.decodeCursor(input.cursor, access, 'organizations', input.pageSize)
      : undefined;
    const page = await this.repository.listOrganizations(
      input.pageSize,
      cursor,
    );
    return Object.freeze({
      items: page.items,
      nextCursor: page.next
        ? this.encodeCursor(page.next, access, 'organizations', input.pageSize)
        : null,
    });
  }

  async organization(id: string): Promise<OrganizationRecord> {
    const value = await this.repository.organization(id);
    if (!value) throw new NotFoundException('Organization was not found.');
    return value;
  }

  createClinic(
    access: AdministrationAccess,
    input: {
      organizationId: string;
      name: string;
      code: string;
      timezone: string;
    },
    requestId: string,
    idempotencyKey: string,
  ) {
    this.timezone(input.timezone.trim());
    const normalized = {
      organizationId: input.organizationId,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      timezone: input.timezone.trim(),
    };
    return this.repository.createClinic(access, normalized, requestId, {
      key: this.key(idempotencyKey),
      scope: 'administration.clinic.create',
      hash: this.hash(normalized),
    });
  }

  async clinics(access: AdministrationAccess, input: AdministrationListInput) {
    const binding = `clinics:${input.organizationId ?? '*'}`;
    const cursor = input.cursor
      ? this.decodeCursor(input.cursor, access, binding, input.pageSize)
      : undefined;
    const page = await this.repository.listClinics(
      input.pageSize,
      input.organizationId,
      cursor,
    );
    return Object.freeze({
      items: page.items,
      nextCursor: page.next
        ? this.encodeCursor(page.next, access, binding, input.pageSize)
        : null,
    });
  }

  async clinic(id: string): Promise<ClinicRecord> {
    const value = await this.repository.clinic(id);
    if (!value) throw new NotFoundException('Clinic was not found.');
    return value;
  }

  private key(value: string): string {
    if (!/^[\x21-\x7e]{8,128}$/.test(value))
      throw new BadRequestException(
        'A valid Idempotency-Key header is required.',
      );
    return value;
  }

  private timezone(value: string): void {
    try {
      new Intl.DateTimeFormat('en', { timeZone: value }).format(new Date(0));
    } catch {
      throw new BadRequestException('Clinic timezone is invalid.');
    }
  }

  private hash(value: object): string {
    return keyedHash(
      'administration-command',
      JSON.stringify(value),
      this.configuration.auditHashSecret,
    );
  }

  private encodeCursor(
    cursor: AdministrationCursor,
    access: AdministrationAccess,
    binding: string,
    pageSize: number,
  ): string {
    const payload = Buffer.from(
      JSON.stringify({
        actorId: access.actorId,
        binding,
        pageSize,
        createdAt: cursor.createdAt.toISOString(),
        id: cursor.id,
      }),
    ).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }

  private decodeCursor(
    cursor: string,
    access: AdministrationAccess,
    binding: string,
    pageSize: number,
  ): AdministrationCursor {
    try {
      if (cursor.length > 2048) throw new Error('invalid');
      const [payload, signature, extra] = cursor.split('.');
      if (
        !payload ||
        !signature ||
        extra ||
        !/^[0-9a-f]{64}$/u.test(signature) ||
        !safeEqualHex(signature, this.sign(payload))
      )
        throw new Error('invalid');
      const value = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as Record<string, unknown>;
      if (
        value.actorId !== access.actorId ||
        value.binding !== binding ||
        value.pageSize !== pageSize ||
        typeof value.createdAt !== 'string' ||
        typeof value.id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
          value.id,
        )
      )
        throw new Error('invalid');
      const createdAt = new Date(value.createdAt);
      if (!Number.isFinite(createdAt.getTime())) throw new Error('invalid');
      return { createdAt, id: value.id };
    } catch {
      throw new BadRequestException('Administration cursor is invalid.');
    }
  }

  private sign(payload: string): string {
    return keyedHash(
      'administration-cursor',
      payload,
      this.configuration.auditHashSecret,
    );
  }
}

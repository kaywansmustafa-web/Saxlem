/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createApplication } from '../../src/main';
import {
  apiConfiguration,
  apiPrisma,
  createRolePrincipal,
  createSeededQueue,
} from './live-queue-api-fixture';

jest.setTimeout(40_000);

/** Latin-only, so each run makes fresh specialty codes. */
const word = () =>
  Array.from({ length: 6 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join('');

describe('app catalog and settings (Owner Portal)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication(apiConfiguration);
    await app.init();
  });
  afterAll(async () => {
    await apiPrisma.platformSetting.deleteMany({});
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('the owner adds specialties and tiles; the app and doctor search follow', async () => {
    const seeded = await createSeededQueue(0);
    const owner = await createRolePrincipal(
      'platformAdministrator',
      seeded.tenant,
    );
    const server = app.getHttpServer();
    const as = (token: string) => ({ authorization: `Bearer ${token}` });
    const suffix = word();

    // Only the owner manages the catalog.
    await request(server)
      .get('/api/v1/platform/catalog/specialties')
      .set(as(seeded.manager.token))
      .expect(403);
    await request(server)
      .post('/api/v1/platform/catalog/specialties')
      .set(as(seeded.patient.token))
      .send({ nameEn: 'Allergy' })
      .expect(403);

    const allergy = await request(server)
      .post('/api/v1/platform/catalog/specialties')
      .set(as(owner.token))
      .send({ nameEn: `Allergy ${suffix}`, icon: 'allergy' })
      .expect(201);
    expect(allergy.body.code).toBe(`allergy-${suffix}`);
    const chest = await request(server)
      .post('/api/v1/platform/catalog/specialties')
      .set(as(owner.token))
      .send({
        nameEn: `Chest ${suffix}`,
        nameAr: 'الصدر',
        nameKu: 'سنگ',
        icon: 'lungs',
        showOnHome: false,
      })
      .expect(201);
    await request(server)
      .post('/api/v1/platform/catalog/specialties')
      .set(as(owner.token))
      .send({ nameEn: `allergy ${suffix}` })
      .expect(409);
    await request(server)
      .post('/api/v1/platform/catalog/specialties')
      .set(as(owner.token))
      .send({ nameEn: 'ددان' })
      .expect(400);
    await request(server)
      .post('/api/v1/platform/catalog/specialties')
      .set(as(owner.token))
      .send({ nameEn: 'Allergy', icon: 'rocket' })
      .expect(400);

    await request(server)
      .patch(`/api/v1/platform/catalog/specialties/${allergy.body.id}`)
      .set(as(owner.token))
      .send({ nameKu: 'هەستیاری', nameAr: 'الحساسية' })
      .expect(204);

    // A tile linked to both.
    const tile = await request(server)
      .post('/api/v1/platform/catalog/concerns')
      .set(as(owner.token))
      .send({
        labelEn: 'Breathing and allergies',
        labelAr: 'التنفس والحساسية',
        labelKu: 'هەناسە و هەستیاری',
        icon: 'lungs',
        tone: 'aqua',
        specialtyIds: [allergy.body.id, chest.body.id],
      })
      .expect(201);
    await request(server)
      .post('/api/v1/platform/catalog/concerns')
      .set(as(owner.token))
      .send({
        labelEn: 'Nothing',
        labelAr: 'لا',
        labelKu: 'نا',
        icon: 'lungs',
        tone: 'aqua',
        specialtyIds: [],
      })
      .expect(400);

    // The app reads it all without signing in.
    const config = await request(server).get('/api/v1/app/config').expect(200);
    expect(config.headers['cache-control']).toContain('max-age=60');
    const appTile = config.body.concerns.find(
      (c: { id: string }) => c.id === tile.body.id,
    );
    expect(appTile).toEqual({
      id: tile.body.id,
      labels: {
        en: 'Breathing and allergies',
        ar: 'التنفس والحساسية',
        ku: 'هەناسە و هەستیاری',
      },
      icon: 'lungs',
      tone: 'aqua',
      specialtyCodes: [`allergy-${suffix}`, `chest-${suffix}`],
    });
    // Built-in tiles not linked to any specialty stay hidden.
    expect(
      config.body.concerns.every(
        (c: { specialtyCodes: string[] }) => c.specialtyCodes.length > 0,
      ),
    ).toBe(true);
    expect(
      config.body.specialties.find(
        (s: { code: string }) => s.code === `allergy-${suffix}`,
      ),
    ).toEqual({
      code: `allergy-${suffix}`,
      names: { en: `Allergy ${suffix}`, ar: 'الحساسية', ku: 'هەستیاری' },
      icon: 'allergy',
      showOnHome: true,
    });
    expect(config.body.settings['contact.emergencyNumber']).toBe('122');
    expect(config.body.settings).not.toHaveProperty('booking.defaultFeeIqd');

    // Doctors connect through their specialties.
    const doctorId = seeded.doctor.doctorId!;
    await request(server)
      .put(`/api/v1/platform/doctors/${doctorId}/specialties`)
      .set(as(owner.token))
      .send({
        specialtyIds: [chest.body.id],
        primarySpecialtyId: allergy.body.id,
      })
      .expect(400);
    await request(server)
      .put(`/api/v1/platform/doctors/${doctorId}/specialties`)
      .set(as(owner.token))
      .send({
        specialtyIds: [chest.body.id],
        primarySpecialtyId: chest.body.id,
      })
      .expect(204);
    const found = await request(server)
      .get(
        `/api/v1/doctors?specialties=allergy-${suffix},chest-${suffix}&pageSize=50`,
      )
      .set(as(seeded.patient.token))
      .expect(200);
    expect(found.body.items.map((d: { id: string }) => d.id)).toContain(
      doctorId,
    );
    const none = await request(server)
      .get(`/api/v1/doctors?specialties=allergy-${suffix}`)
      .set(as(seeded.patient.token))
      .expect(200);
    expect(none.body.items).toEqual([]);

    const tiles = await request(server)
      .get('/api/v1/platform/catalog/concerns')
      .set(as(owner.token))
      .expect(200);
    const listed = tiles.body.find(
      (c: { id: string }) => c.id === tile.body.id,
    );
    expect(listed.activeDoctors).toBe(1);
    expect(listed.specialties).toHaveLength(2);
    const specialties = await request(server)
      .get('/api/v1/platform/catalog/specialties')
      .set(as(owner.token))
      .expect(200);
    expect(
      specialties.body.find((s: { id: string }) => s.id === chest.body.id),
    ).toMatchObject({ activeDoctors: 1, tiles: [{ id: tile.body.id }] });

    // Order, hide, delete.
    const ids = tiles.body.map((c: { id: string }) => c.id);
    await request(server)
      .put('/api/v1/platform/catalog/concerns/order')
      .set(as(owner.token))
      .send({ ids: ids.slice(1) })
      .expect(400);
    await request(server)
      .put('/api/v1/platform/catalog/concerns/order')
      .set(as(owner.token))
      .send({
        ids: [tile.body.id, ...ids.filter((id: string) => id !== tile.body.id)],
      })
      .expect(204);
    const reordered = await request(server)
      .get('/api/v1/platform/catalog/concerns')
      .set(as(owner.token))
      .expect(200);
    expect(reordered.body[0].id).toBe(tile.body.id);
    await request(server)
      .patch(`/api/v1/platform/catalog/concerns/${tile.body.id}`)
      .set(as(owner.token))
      .send({ status: 'inactive' })
      .expect(204);
    const hidden = await request(server).get('/api/v1/app/config').expect(200);
    expect(
      hidden.body.concerns.some((c: { id: string }) => c.id === tile.body.id),
    ).toBe(false);
    await request(server)
      .delete(`/api/v1/platform/catalog/concerns/${tile.body.id}`)
      .set(as(owner.token))
      .expect(204);
    expect(
      await apiPrisma.homeConcern.findUnique({ where: { id: tile.body.id } }),
    ).toBeNull();

    const audits = await apiPrisma.auditEvent.findMany({
      where: { actorUserId: owner.userId, action: { startsWith: 'platform.' } },
      select: { action: true },
    });
    expect(audits.map((a) => a.action)).toEqual(
      expect.arrayContaining([
        'platform.specialty.created',
        'platform.specialty.updated',
        'platform.concern.created',
        'platform.concern.reordered',
        'platform.concern.deleted',
        'platform.doctor.specialties.updated',
      ]),
    );
  });

  it('the owner changes app settings within their limits', async () => {
    const seeded = await createSeededQueue(0);
    const owner = await createRolePrincipal(
      'platformAdministrator',
      seeded.tenant,
    );
    const server = app.getHttpServer();
    const as = { authorization: `Bearer ${owner.token}` };

    await request(server)
      .get('/api/v1/platform/app-settings')
      .set({ authorization: `Bearer ${seeded.manager.token}` })
      .expect(403);
    const listed = await request(server)
      .get('/api/v1/platform/app-settings')
      .set(as)
      .expect(200);
    const days = listed.body.settings.find(
      (s: { key: string }) => s.key === 'booking.daysAhead',
    );
    expect(days).toMatchObject({
      value: 14,
      defaultValue: 14,
      min: 1,
      max: 60,
      unit: 'days',
    });

    await request(server)
      .put('/api/v1/platform/app-settings')
      .set(as)
      .send({ changes: { 'booking.daysAhead': 90, 'nope.key': 1 } })
      .expect(400);
    // Nothing is saved when any value is refused.
    expect(await apiPrisma.platformSetting.count()).toBe(0);
    await request(server)
      .put('/api/v1/platform/app-settings')
      .set(as)
      .send({
        changes: {
          'booking.daysAhead': 21,
          'contact.emergencyNumber': '115',
          'contact.supportWhatsApp': '+964 750 123 4567',
          'home.freeToday': false,
        },
      })
      .expect(204);
    const config = await request(server).get('/api/v1/app/config').expect(200);
    expect(config.body.settings).toMatchObject({
      'booking.daysAhead': 21,
      'contact.emergencyNumber': '115',
      'contact.supportWhatsApp': '9647501234567',
      'home.freeToday': false,
    });
    const audit = await apiPrisma.auditEvent.findFirst({
      where: { actorUserId: owner.userId, action: 'platform.settings.updated' },
    });
    expect(audit?.metadata).toMatchObject({
      changes: expect.arrayContaining([
        { key: 'booking.daysAhead', from: 14, to: 21 },
      ]),
    });

    // Back to the default removes the stored value.
    await request(server)
      .put('/api/v1/platform/app-settings')
      .set(as)
      .send({ changes: { 'booking.daysAhead': 14 } })
      .expect(204);
    expect(
      await apiPrisma.platformSetting.findUnique({
        where: { key: 'booking.daysAhead' },
      }),
    ).toBeNull();
  });
});

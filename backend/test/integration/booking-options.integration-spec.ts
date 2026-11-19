import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaArrivalRepository } from '../../src/modules/arrivals/infrastructure/prisma-arrival.repository';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { BackendConfiguration } from '../../src/config/environment';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { AppointmentService } from '../../src/modules/appointments/application/appointment.service';
import { PrismaAppointmentRepository } from '../../src/modules/appointments/infrastructure/prisma-appointment.repository';
import { DoctorScheduleService } from '../../src/modules/doctors/application/doctor-schedule.service';
import { TimezoneService } from '../../src/modules/doctors/application/timezone.service';
import { PrismaDoctorScheduleRepository } from '../../src/modules/doctors/infrastructure/prisma-doctor-schedule.repository';
import { ReceptionDoctorsService } from '../../src/modules/doctors/application/reception-doctors.service';
import { PrismaPatientRepository } from '../../src/modules/patients/infrastructure/prisma-patient.repository';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }),
});

describe('patient booking options database integration', () => {
  afterAll(() => prisma.$disconnect());

  it('derives safe Iraq-local slots and keeps create authoritative during a race', async () => {
    const fixture = await setup();
    const service = appointmentService();
    const access = {
      actorId: fixture.patientUserId,
      patient: true,
      doctor: false,
      platformAdministrator: false,
    };
    const options = await service.bookingOptions(
      access,
      fixture.doctorId,
      fixture.clinicId,
      fixture.profileId,
      'initial',
      '2030-07-22',
      '2030-07-22',
      'booking-options-request',
    );
    expect(options).toMatchObject({
      organizationId: fixture.organizationId,
      clinicId: fixture.clinicId,
      clinicTimezone: 'Asia/Baghdad',
      durationMinutes: 30,
      feeIqd: 25000,
      currency: 'IQD',
    });
    expect(options.days[0]!.slots.map((slot) => slot.startsAt)).toEqual([
      '2030-07-22T05:00:00.000Z',
      '2030-07-22T06:00:00.000Z',
      '2030-07-22T06:30:00.000Z',
      '2030-07-22T07:00:00.000Z',
      '2030-07-22T07:30:00.000Z',
    ]);

    const selected = options.days[0]!.slots[0]!;
    await service.create(
      access,
      {
        organizationId: fixture.organizationId,
        clinicId: fixture.clinicId,
        doctorId: fixture.doctorId,
        patientProfileId: fixture.profileId,
        type: 'initial',
        reason: 'First booking',
        startsAt: new Date(selected.startsAt),
        startsAtSource: selected.startsAt,
        durationMinutes: selected.durationMinutes,
      },
      'booking-race-first',
      'booking-create-first',
    );
    await expect(
      service.create(
        access,
        {
          organizationId: fixture.organizationId,
          clinicId: fixture.clinicId,
          doctorId: fixture.doctorId,
          patientProfileId: fixture.profileId,
          type: 'initial',
          reason: 'Racing booking',
          startsAt: new Date(selected.startsAt),
          startsAtSource: selected.startsAt,
          durationMinutes: selected.durationMinutes,
        },
        'booking-race-second',
        'booking-create-second',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  }, 30_000);

  it('rejects a profile owned by another patient account', async () => {
    const fixture = await setup();
    const other = await createPatient(
      fixture.organizationId,
      Date.now().toString(),
    );
    await expect(
      appointmentService().bookingOptions(
        {
          actorId: fixture.patientUserId,
          patient: true,
          doctor: false,
          platformAdministrator: false,
        },
        fixture.doctorId,
        fixture.clinicId,
        other.profileId,
        'followUp',
        '2030-07-22',
        '2030-07-22',
        'cross-account-request',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  }, 30_000);

  it('excludes inactive profiles and organization registrations', async () => {
    const fixture = await setup();
    const service = appointmentService();
    const access = {
      actorId: fixture.patientUserId,
      patient: true,
      doctor: false,
      platformAdministrator: false,
    };
    const request = () =>
      service.bookingOptions(
        access,
        fixture.doctorId,
        fixture.clinicId,
        fixture.profileId,
        'initial',
        '2030-07-22',
        '2030-07-22',
        'inactive-context-request',
      );
    await prisma.patientProfile.update({
      where: { id: fixture.profileId },
      data: { status: 'inactive', version: { increment: 1 } },
    });
    await expect(request()).rejects.toBeInstanceOf(ForbiddenException);
    await prisma.patientProfile.update({
      where: { id: fixture.profileId },
      data: { status: 'active', version: { increment: 1 } },
    });
    await prisma.organizationPatientProfile.update({
      where: {
        organizationId_patientProfileId: {
          organizationId: fixture.organizationId,
          patientProfileId: fixture.profileId,
        },
      },
      data: { status: 'inactive' },
    });
    await expect(request()).rejects.toBeInstanceOf(ForbiddenException);
  }, 30_000);

  it('keeps app, phone and walk-in bookings on one calendar', async () => {
    const fixture = await setup();
    const service = appointmentService();
    const patientAccess = {
      actorId: fixture.patientUserId,
      patient: true,
      doctor: false,
      platformAdministrator: false,
    };
    const staffAccess = {
      actorId: fixture.patientUserId,
      patient: false,
      doctor: false,
      platformAdministrator: false,
      organizationId: fixture.organizationId,
      clinicId: fixture.clinicId,
    };
    const patients = new PrismaPatientRepository({
      db: prisma,
    } as unknown as PrismaService);
    const directory = {
      actorId: fixture.patientUserId,
      organizationId: fixture.organizationId,
      clinicId: fixture.clinicId,
    };
    const phone = `+9647${Date.now().toString().slice(-9)}`;
    const caller = await patients.registerClinicPatient(
      directory,
      {
        firstName: 'Phone',
        lastName: 'Caller',
        phoneNumber: phone,
        gender: 'unspecified',
      },
      'register-caller',
    );
    expect(caller.created).toBe(true);
    // Saving the same person twice returns the first record.
    await expect(
      patients.registerClinicPatient(
        directory,
        {
          firstName: 'phone',
          lastName: 'CALLER',
          phoneNumber: phone,
          gender: 'unspecified',
        },
        'register-caller-again',
      ),
    ).resolves.toMatchObject({
      patientProfileId: caller.patientProfileId,
      created: false,
    });
    const found = await patients.searchDirectory(
      directory,
      { q: phone.slice(-6), pageSize: 10 },
      undefined,
      'search-caller',
    );
    expect(found.items.map((item) => item.patientProfileId)).toContain(
      caller.patientProfileId,
    );

    const window = (
      access: typeof staffAccess | typeof patientAccess,
      id: string,
    ) =>
      service.bookingOptions(
        access,
        fixture.doctorId,
        fixture.clinicId,
        id,
        'initial',
        '2030-07-22',
        '2030-07-22',
        'calendar-request',
      );
    const slot = (index: number) =>
      [
        '2030-07-22T05:00:00.000Z',
        '2030-07-22T06:00:00.000Z',
        '2030-07-22T06:30:00.000Z',
      ][index]!;
    const book = (
      access: typeof staffAccess | typeof patientAccess,
      patientProfileId: string,
      startsAt: string,
      key: string,
    ) =>
      service.create(
        access,
        {
          organizationId: fixture.organizationId,
          clinicId: fixture.clinicId,
          doctorId: fixture.doctorId,
          patientProfileId,
          type: 'initial',
          reason: 'Calendar check',
          startsAt: new Date(startsAt),
          startsAtSource: startsAt,
          durationMinutes: 30,
        },
        key,
        key,
      );

    // The app books 08:00; reception no longer sees it.
    const appBooking = await book(
      patientAccess,
      fixture.profileId,
      slot(0),
      'calendar-app-0001',
    );
    expect(appBooking.origin).toBe('patientBooked');
    const staffView = await window(staffAccess, caller.patientProfileId);
    expect(staffView.days[0]!.slots.map((item) => item.startsAt)).not.toContain(
      slot(0),
    );
    // Reception books 09:00 for the caller; the app no longer sees it.
    const phoneBooking = await book(
      staffAccess,
      caller.patientProfileId,
      slot(1),
      'calendar-phone-01',
    );
    expect(phoneBooking).toMatchObject({
      origin: 'clinicCreated',
      patientName: 'Phone Caller',
    });
    const appView = await window(patientAccess, fixture.profileId);
    expect(appView.days[0]!.slots.map((item) => item.startsAt)).not.toContain(
      slot(1),
    );
    // Reception cannot double-book the app's slot either.
    await expect(
      book(staffAccess, caller.patientProfileId, slot(0), 'calendar-clash-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    // The day board colours each slot by how it was booked.
    const board = await service.dayBoard(staffAccess, '2030-07-22', 'board');
    const cells = new Map(
      board.doctors[0]!.slots.map((cell) => [cell.startsAt, cell]),
    );
    expect(cells.get(slot(0))).toMatchObject({
      state: 'booked',
      appointment: { origin: 'patientBooked' },
    });
    expect(cells.get(slot(1))).toMatchObject({
      state: 'booked',
      appointment: { origin: 'clinicCreated', patientName: 'Phone Caller' },
    });
    expect(cells.get(slot(2))).toMatchObject({ state: 'free' });
    expect(cells.get('2030-07-22T05:30:00.000Z')).toMatchObject({
      state: 'unavailable',
    });
    // Staff of another clinic cannot read this calendar.
    await expect(
      window(
        { ...staffAccess, clinicId: fixture.organizationId },
        caller.patientProfileId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  }, 30_000);

  it('scopes a receptionist to their own doctors', async () => {
    const fixture = await setup();
    const service = appointmentService();
    const reception = new ReceptionDoctorsService({
      db: prisma,
    } as unknown as PrismaService);
    const receptionist = await prisma.user.create({ data: {} });
    const who = {
      actorId: receptionist.id,
      organizationId: fixture.organizationId,
      clinicId: fixture.clinicId,
      receptionist: true,
    };
    const staffAccess = () => ({
      actorId: receptionist.id,
      patient: false,
      doctor: false,
      platformAdministrator: false,
      organizationId: fixture.organizationId,
      clinicId: fixture.clinicId,
    });
    // Before choosing, nothing is hidden and the view asks for a choice.
    await expect(reception.scope(who)).resolves.toBeNull();
    await expect(reception.view(who)).resolves.toMatchObject({
      configured: false,
      doctors: [{ id: fixture.doctorId, assigned: false }],
    });
    await expect(
      reception.update(who, [fixture.organizationId], 'pick-wrong'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(reception.update(who, [], 'pick-none')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      reception.update(who, [fixture.doctorId], 'pick-mine'),
    ).resolves.toMatchObject({
      configured: true,
      doctors: [{ id: fixture.doctorId, assigned: true }],
    });
    const doctorIds = await reception.scope(who);
    expect(doctorIds).toEqual([fixture.doctorId]);
    const scoped = { ...staffAccess(), doctorIds: doctorIds ?? undefined };
    const board = await service.dayBoard(scoped, '2030-07-22', 'board');
    expect(board.doctors.map((doctor) => doctor.doctorId)).toEqual([
      fixture.doctorId,
    ]);
    // A doctor outside the list cannot be booked or browsed by this desk.
    await expect(
      service.bookingOptions(
        scoped,
        fixture.organizationId,
        fixture.clinicId,
        fixture.profileId,
        'initial',
        '2030-07-22',
        '2030-07-22',
        'other-doctor',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    const audit = await prisma.auditEvent.findFirst({
      where: {
        actorUserId: receptionist.id,
        action: 'reception.doctors_updated',
      },
    });
    expect(audit?.metadata).toMatchObject({ added: [fixture.doctorId] });
  }, 30_000);

  it("hides other doctors' appointments, check-ins, queues and patients from a receptionist", async () => {
    const fixture = await setup();
    const service = appointmentService();
    const database = { db: prisma } as unknown as PrismaService;
    const appointment = await service.create(
      {
        actorId: fixture.patientUserId,
        patient: true,
        doctor: false,
        platformAdministrator: false,
      },
      {
        organizationId: fixture.organizationId,
        clinicId: fixture.clinicId,
        doctorId: fixture.doctorId,
        patientProfileId: fixture.profileId,
        type: 'initial',
        reason: 'Scope check',
        startsAt: new Date('2030-07-22T05:00:00.000Z'),
        startsAtSource: '2030-07-22T05:00:00.000Z',
        durationMinutes: 30,
      },
      'scope-booking-0001',
      'scope-booking',
    );
    const staff = {
      actorId: fixture.patientUserId,
      patient: false,
      doctor: false,
      platformAdministrator: false,
      organizationId: fixture.organizationId,
      clinicId: fixture.clinicId,
    };
    const mine = { ...staff, doctorIds: [fixture.doctorId] };
    const other = { ...staff, doctorIds: [randomUUID()] };

    // Appointments: detail, list and changes.
    await expect(
      service.get(other, appointment.id, 'scope'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.get(mine, appointment.id, 'scope'),
    ).resolves.toMatchObject({ id: appointment.id });
    const window = {
      from: new Date('2030-07-21T00:00:00.000Z'),
      to: new Date('2030-07-23T00:00:00.000Z'),
      pageSize: 50,
    };
    expect((await service.list(other, window, 'scope')).items).toEqual([]);
    expect(
      (await service.list(mine, window, 'scope')).items.map((item) => item.id),
    ).toContain(appointment.id);

    // Check-ins.
    const arrivals = new PrismaArrivalRepository(database);
    await expect(arrivals.get(other, appointment.id)).resolves.toBeNull();
    await expect(arrivals.get(mine, appointment.id)).resolves.not.toBeNull();

    // Patient search.
    const patients = new PrismaPatientRepository(database);
    const search = (doctorIds: string[]) =>
      patients.searchDirectory(
        {
          actorId: fixture.patientUserId,
          organizationId: fixture.organizationId,
          clinicId: fixture.clinicId,
          doctorIds,
        },
        { q: 'Booking', pageSize: 50 },
        undefined,
        'scope-search',
      );
    expect(
      (await search([randomUUID()])).items.map((item) => item.patientProfileId),
    ).not.toContain(fixture.profileId);
    expect(
      (await search([fixture.doctorId])).items.map(
        (item) => item.patientProfileId,
      ),
    ).toContain(fixture.profileId);
  }, 30_000);

  it('enforces the clinic-registered patient shape in the database', async () => {
    const fixture = await setup();
    await expect(
      prisma.patientProfile.create({
        data: {
          firstName: 'Bad',
          lastName: 'Phone',
          registeredByOrganizationId: fixture.organizationId,
          contactPhoneNumber: '0750123',
        },
      }),
    ).rejects.toThrow(/patient_profiles_app_profile_check/);
    await expect(
      prisma.patientProfile.create({
        data: { firstName: 'No', lastName: 'Owner' },
      }),
    ).rejects.toThrow(/patient_profiles_app_profile_check/);
  }, 30_000);
});

function appointmentService() {
  const database = { db: prisma } as unknown as PrismaService;
  const timezones = new TimezoneService();
  const schedules = new DoctorScheduleService(
    new PrismaDoctorScheduleRepository(database),
    timezones,
  );
  return new AppointmentService(
    new PrismaAppointmentRepository(database),
    schedules,
    timezones,
    {
      appointmentPastToleranceMinutes: 2,
      appointmentFoundationFeeIqd: 25000,
      appointmentFoundationDurationMinutes: 30,
    } as BackendConfiguration,
  );
}

async function setup() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const organization = await prisma.organization.create({
    data: { name: `Booking ${suffix}` },
  });
  const clinic = await prisma.clinic.create({
    data: {
      organizationId: organization.id,
      name: 'Booking Clinic',
      code: `booking-${suffix}`,
      timezone: 'Asia/Baghdad',
    },
  });
  const patient = await createPatient(organization.id, suffix);
  const staffUser = await prisma.user.create({
    data: {
      staffAccount: { create: { email: `doctor-${suffix}@example.invalid` } },
    },
    include: { staffAccount: true },
  });
  const specialty = await prisma.specialty.create({
    data: { code: `booking-${suffix}`, displayName: 'Booking Specialty' },
  });
  const doctor = await prisma.$transaction(async (tx) => {
    const created = await tx.doctor.create({
      data: {
        organizationId: organization.id,
        staffAccountId: staffUser.staffAccount!.id,
        firstName: 'Booking',
        lastName: 'Doctor',
        displayName: 'Dr Booking',
        gender: 'unspecified',
        licenseNumber: `BOOK-${suffix}`,
        yearsOfExperience: 10,
        languages: ['english'],
      },
    });
    await tx.doctorClinicAssignment.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        doctorId: created.id,
      },
    });
    await tx.doctorSpecialtyAssignment.create({
      data: {
        doctorId: created.id,
        specialtyId: specialty.id,
        isPrimary: true,
      },
    });
    return created;
  });
  await prisma.clinicWorkingHours.create({
    data: {
      organizationId: organization.id,
      clinicId: clinic.id,
      weekday: 1,
      opensMinute: 480,
      closesMinute: 660,
    },
  });
  await prisma.doctorWeeklySchedule.create({
    data: {
      organizationId: organization.id,
      clinicId: clinic.id,
      doctorId: doctor.id,
      weekday: 1,
      startsMinute: 480,
      endsMinute: 660,
    },
  });
  await prisma.doctorBreak.create({
    data: {
      organizationId: organization.id,
      clinicId: clinic.id,
      doctorId: doctor.id,
      weekday: 1,
      startsMinute: 510,
      endsMinute: 540,
    },
  });
  return {
    organizationId: organization.id,
    clinicId: clinic.id,
    doctorId: doctor.id,
    patientUserId: patient.userId,
    profileId: patient.profileId,
  };
}

async function createPatient(organizationId: string, suffix: string) {
  const user = await prisma.user.create({
    data: {
      patientAccount: {
        create: {
          normalizedPhoneNumber: `+9647${suffix.replace(/\D/g, '').slice(-9).padStart(9, '0')}`,
        },
      },
    },
    include: { patientAccount: true },
  });
  const profile = await prisma.patientProfile.create({
    data: {
      patientAccountId: user.patientAccount!.id,
      firstName: 'Booking',
      lastName: 'Patient',
      dateOfBirth: new Date('1990-01-01'),
    },
  });
  await prisma.organizationPatientProfile.create({
    data: { organizationId, patientProfileId: profile.id },
  });
  return { userId: user.id, profileId: profile.id };
}

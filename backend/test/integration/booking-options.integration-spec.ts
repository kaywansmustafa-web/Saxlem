import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { BackendConfiguration } from '../../src/config/environment';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { AppointmentService } from '../../src/modules/appointments/application/appointment.service';
import { PrismaAppointmentRepository } from '../../src/modules/appointments/infrastructure/prisma-appointment.repository';
import { DoctorScheduleService } from '../../src/modules/doctors/application/doctor-schedule.service';
import { TimezoneService } from '../../src/modules/doctors/application/timezone.service';
import { PrismaDoctorScheduleRepository } from '../../src/modules/doctors/infrastructure/prisma-doctor-schedule.repository';

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

export type AppointmentStatus =
  'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'noShow';
export type AppointmentType = 'initial' | 'followUp';
export type AppointmentOrigin = 'patientBooked' | 'clinicCreated' | 'walkIn';
export interface AppointmentProjection {
  readonly id: string;
  readonly reference: string;
  readonly organizationId: string;
  readonly clinicId: string;
  readonly clinicName: string;
  readonly doctorId: string;
  readonly doctorName: string;
  readonly patientProfileId: string;
  readonly patientName: string;
  readonly type: AppointmentType;
  /** How the booking reached the clinic: the app, a phone call, or the desk. */
  readonly origin: AppointmentOrigin;
  readonly reason: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly durationMinutes: number;
  readonly feeIqd: number;
  readonly status: AppointmentStatus;
  readonly cancellationReason: string | null;
  readonly version: number;
}
export interface AppointmentAccess {
  readonly actorId: string;
  readonly patient: boolean;
  readonly doctor: boolean;
  readonly platformAdministrator: boolean;
  readonly organizationId?: string | undefined;
  readonly clinicId?: string | undefined;
}
export interface AppointmentWrite {
  readonly organizationId: string;
  readonly clinicId: string;
  readonly doctorId: string;
  readonly patientProfileId: string;
  readonly type: AppointmentType;
  readonly origin: AppointmentOrigin;
  readonly reason: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly durationMinutes: number;
  readonly feeIqd: number;
}

export interface BookingSlotProjection {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly durationMinutes: number;
}
export interface BookingDayProjection {
  readonly date: string;
  readonly slots: readonly BookingSlotProjection[];
}
export interface BookingOptionsProjection {
  readonly doctorId: string;
  readonly doctorName: string;
  readonly organizationId: string;
  readonly clinicId: string;
  readonly clinicName: string;
  readonly clinicTimezone: string;
  readonly appointmentType: AppointmentType;
  readonly durationMinutes: number;
  readonly feeIqd: number;
  readonly currency: 'IQD';
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly days: readonly BookingDayProjection[];
  readonly generatedAt: string;
}

/** One cell of reception's day board. */
export type DayBoardSlotState = 'free' | 'booked' | 'unavailable' | 'past';
export interface DayBoardAppointment {
  readonly id: string;
  readonly reference: string;
  readonly origin: AppointmentOrigin;
  readonly status: AppointmentStatus;
  readonly patientName: string;
}
export interface DayBoardSlot {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly state: DayBoardSlotState;
  /** Free and starting within the next hour, so a walk-in can take it. */
  readonly walkIn: boolean;
  readonly appointment: DayBoardAppointment | null;
}
export interface DayBoardDoctor {
  readonly doctorId: string;
  readonly doctorName: string;
  readonly slots: readonly DayBoardSlot[];
}
export interface DayBoardProjection {
  readonly date: string;
  readonly clinicId: string;
  readonly clinicTimezone: string;
  readonly durationMinutes: number;
  readonly generatedAt: string;
  readonly doctors: readonly DayBoardDoctor[];
}

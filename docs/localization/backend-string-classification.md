# Backend String Classification

Sprint 13U classifies all 229 candidate strings without adding locale branching to domain logic. `MACHINE_CONTRACT` errors are localized by stable frontend state/code mappings and their raw English is not approved presentation copy. `INTERNAL_ONLY` diagnostics must never be rendered. `USER_VISIBLE` persisted/delivered copy is treated as data at the current boundary and requires presentation-side localization before rendering.

## Totals

- INTERNAL_ONLY: 0
- MACHINE_CONTRACT: 157
- USER_VISIBLE: 72

- Total: 229

## Classification

| Classification | Source | String |
|---|---|---|
| USER_VISIBLE | `backend/src/modules/arrivals/presentation/arrivals.controller.ts:86` | 8-128 non-whitespace printable ASCII characters. Identical completed requests replay; reuse for different input conflicts. |
| USER_VISIBLE | `backend/src/modules/notifications/presentation/notifications.controller.ts:95; backend/src/modules/queue/presentation/queue.controller.ts:63` | 8–128 printable ASCII characters. Conflicting reuse returns 409. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:267` | A patient account is required. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:693` | A patient is already current. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctors.controller.ts:117; backend/src/modules/doctors/presentation/doctors.controller.ts:138; backend/src/modules/doctors/presentation/doctors.controller.ts:98` | A required security audit could not be recorded. Retry later. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/clinic-hours.controller.ts:30; backend/src/modules/patients/presentation/patients.controller.ts:68; backend/src/modules/patients/presentation/patients.controller.ts:93` | A required staff-read audit could not be recorded. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctors.controller.ts:193` | A required staff-read audit could not be recorded. Retry later. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:167; backend/src/modules/patients/infrastructure/prisma-patient.repository.ts:106` | A Self profile already exists. |
| MACHINE_CONTRACT | `backend/src/modules/administration/application/administration.service.ts:126; backend/src/modules/appointments/application/appointment.service.ts:431; backend/src/modules/arrivals/application/arrival.service.ts:106; backend/src/modules/billing/application/billing.service.ts:164; backend/src/modules/notifications/application/notification.service.ts:57; backend/src/modules/queue/application/queue.service.ts:227` | A valid Idempotency-Key header is required. |
| MACHINE_CONTRACT | `backend/src/modules/identity/presentation/jwt-auth.guard.ts:60; backend/src/modules/identity/presentation/jwt-auth.guard.ts:69` | Access token is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/identity/presentation/jwt-auth.guard.ts:97` | Access token is no longer valid. |
| USER_VISIBLE | `backend/src/modules/administration/presentation/administration.controller.ts:144` | Active organization was not found. |
| MACHINE_CONTRACT | `backend/src/modules/administration/application/administration.service.ts:201` | Administration cursor is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:352` | An appointment in an active queue cannot be cancelled. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:448` | Appointment cannot be booked in the past. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/infrastructure/prisma-appointment-queue-completion.port.ts:30; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:801` | Appointment cannot be completed. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor-schedule.service.ts:127` | Appointment cannot cross a clinic-local day. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:460` | Appointment conflicts with an existing appointment. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:70` | Appointment cursor is invalid for this query. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:212` | Appointment date window must be positive and no longer than 366 days. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:395` | Appointment duration does not match booking configuration. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:387` | Appointment duration must be between 5 and 480 minutes. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:562` | Appointment is already enqueued. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:548; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:553` | Appointment is not eligible for this queue. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:897` | Appointment is not ready for the queue. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor-schedule.service.ts:139; backend/src/modules/doctors/application/doctor-schedule.service.ts:161` | Appointment is outside effective working time. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:220` | Appointment page size must be between 1 and 50. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:137` | Appointment participants are unavailable or outside scope. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:526` | Appointment reason must contain 1 to 500 characters. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:340; backend/src/modules/doctors/application/doctor-schedule.service.ts:174` | Appointment start time is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:405` | Appointment tenant does not match authenticated clinic. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor-schedule.service.ts:178` | Appointment time does not exist at the clinic or uses an incorrect offset. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:375; backend/src/modules/appointments/infrastructure/prisma-appointment-queue-completion.port.ts:43; backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:365` | Appointment version is stale. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:324` | Appointment was not found or is no longer cancellable. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:288` | Appointment was not found or is no longer editable. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:340` | Appointment was not found or is no longer mutable. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:229; backend/src/modules/appointments/application/appointment.service.ts:352; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:510; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:537` | Appointment was not found. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:251; backend/src/modules/patients/infrastructure/prisma-patient.repository.ts:206` | Archived patient profiles cannot be activated. |
| USER_VISIBLE | `backend/src/modules/patients/presentation/patients.controller.ts:182` | Archived profiles cannot become active. |
| USER_VISIBLE | `backend/src/modules/arrivals/presentation/arrival.dto.ts:61` | Arrival eligibility only. queueReady does not create or order a queue entry. |
| MACHINE_CONTRACT | `backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:114` | Arrival has already been recorded. |
| MACHINE_CONTRACT | `backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:112` | Arrival version is stale. |
| MACHINE_CONTRACT | `backend/src/modules/arrivals/application/arrival.service.ts:79` | Arrival version must be a positive integer. |
| MACHINE_CONTRACT | `backend/src/modules/arrivals/application/arrival.service.ts:47; backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:108; backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:96` | Arrival was not found. |
| USER_VISIBLE | `backend/src/modules/arrivals/presentation/arrival.dto.ts:77` | Authoritative advisory eligibility returned for authenticated patient access. Mutations always revalidate. |
| MACHINE_CONTRACT | `backend/src/modules/identity/presentation/jwt-auth.guard.ts:174` | Bearer access token is required. |
| USER_VISIBLE | `backend/src/modules/notifications/presentation/notifications.controller.ts:120` | Bearer access token. Query-string tokens are unsupported. |
| USER_VISIBLE | `backend/src/modules/administration/presentation/administration.controller.ts:59; backend/src/modules/doctors/presentation/doctors.controller.ts:45; backend/src/modules/patients/presentation/patients.controller.ts:51` | Bearer token is missing, invalid, or expired. |
| MACHINE_CONTRACT | `backend/src/modules/billing/application/billing.service.ts:150` | Billing access requires an organization. |
| MACHINE_CONTRACT | `backend/src/modules/billing/application/billing.service.ts:220` | Billing cursor is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/billing/application/billing.service.ts:158` | Billing organization scope does not match the session. |
| MACHINE_CONTRACT | `backend/src/modules/billing/application/billing.service.ts:90` | Billing page size must be between 1 and 100. |
| MACHINE_CONTRACT | `backend/src/modules/billing/infrastructure/prisma-billing.repository.ts:90; backend/src/modules/billing/infrastructure/prisma-billing.repository.ts:92` | Billing plan assignment is stale. |
| MACHINE_CONTRACT | `backend/src/modules/billing/infrastructure/prisma-billing.repository.ts:78` | Billing plan assignment version or effective date is stale. |
| MACHINE_CONTRACT | `backend/src/modules/billing/application/billing.service.ts:61` | Billing plan management requires platform administration. |
| MACHINE_CONTRACT | `backend/src/modules/billing/application/billing.service.ts:36` | Billing plan was not found. |
| MACHINE_CONTRACT | `backend/src/modules/billing/infrastructure/prisma-billing.repository.ts:211` | Billing statement is already finalized. |
| MACHINE_CONTRACT | `backend/src/modules/billing/infrastructure/prisma-billing.repository.ts:213; backend/src/modules/billing/infrastructure/prisma-billing.repository.ts:258` | Billing statement version is stale. |
| MACHINE_CONTRACT | `backend/src/modules/billing/application/billing.service.ts:113; backend/src/modules/billing/infrastructure/prisma-billing.repository.ts:209` | Billing statement was not found. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:480; backend/src/modules/appointments/application/appointment.service.ts:89` | Booking date window is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:487` | Booking date window must not exceed 31 days. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:63; backend/src/modules/appointments/presentation/booking-options.controller.ts:64` | Booking options are patient-only. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:75` | Booking options were not found. |
| MACHINE_CONTRACT | `backend/src/modules/arrivals/application/arrival.service.ts:75; backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:180` | Cancelled, completed, or no-show appointments cannot arrive. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:223` | Choose another active patient before archiving this profile. |
| USER_VISIBLE | `backend/src/modules/administration/presentation/administration.controller.ts:146` | Clinic code already exists in the organization or the idempotency key conflicts. |
| MACHINE_CONTRACT | `backend/src/modules/administration/infrastructure/prisma-administration.repository.ts:204; backend/src/modules/administration/infrastructure/prisma-administration.repository.ts:98` | Clinic code already exists in this organization. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor-schedule.service.ts:192` | Clinic does not match the authenticated tenant. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor.service.ts:172` | Clinic filter does not match the authenticated tenant. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/clinic-hours.controller.ts:50` | Clinic is absent, inactive, or outside the tenant. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:145` | Clinic is inactive or unavailable. |
| MACHINE_CONTRACT | `backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:186` | Clinic is inactive. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:830` | Clinic tenant context is required. |
| MACHINE_CONTRACT | `backend/src/infrastructure/health/health.controller.ts:39` | Clinic timezone configuration is incompatible with this runtime. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:365` | Clinic timezone configuration is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/administration/application/administration.service.ts:136` | Clinic timezone is invalid. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctor-schedule.dto.ts:8` | Clinic to evaluate. Staff are restricted to their authenticated clinic. |
| USER_VISIBLE | `backend/src/modules/administration/application/administration.service.ts:120; backend/src/modules/administration/presentation/administration.controller.ts:167; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:74` | Clinic was not found. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor-schedule.service.ts:86` | Clinic working hours were not found. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:768` | Consultation cannot start while the queue is paused. |
| MACHINE_CONTRACT | `backend/src/infrastructure/health/health.controller.ts:33` | Database is not ready. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:376` | Date of birth must be a valid date in the past. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:883` | Doctor assignment was not found. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor-schedule.service.ts:67` | Doctor availability was not found. |
| MACHINE_CONTRACT | `backend/src/modules/identity/presentation/jwt-auth.guard.ts:107` | Doctor eligibility is no longer active. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctors.controller.ts:105` | Doctor is absent, archived, inactive for a patient, or outside the tenant. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctors.controller.ts:204` | Doctor is absent, inactive, archived, has no active clinic, or is outside the tenant. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:141` | Doctor is inactive or unavailable at this clinic. |
| MACHINE_CONTRACT | `backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:188` | Doctor is inactive. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor-schedule.service.ts:114` | Doctor is not available at this clinic. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctors.controller.ts:124; backend/src/modules/doctors/presentation/doctors.controller.ts:145; backend/src/modules/doctors/presentation/doctors.controller.ts:171` | Doctor is not visible. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor-schedule.service.ts:145` | Doctor is unavailable during this period. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor.service.ts:65` | Doctor name search cannot be empty. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor.service.ts:57` | Doctor pagination is outside safe bounds. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor-schedule.service.ts:48` | Doctor schedule was not found. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:839` | Doctor tenant context is required. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor.service.ts:97` | Doctor was not found. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointments.controller.ts:115` | Doctor/patient overlap or idempotency conflict. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointments.controller.ts:227` | Doctor/patient overlap or stale version. |
| USER_VISIBLE | `backend/src/modules/arrivals/presentation/arrivals.controller.ts:93` | Duplicate arrival, stale version, invalid appointment lifecycle, outside arrival window, or idempotency conflict. |
| MACHINE_CONTRACT | `backend/src/modules/billing/application/billing.service.ts:65` | Effective date is invalid. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctor-schedule.dto.ts:40` | Exclusive local end. 24:00 is permitted only as the end of a same-day row. |
| USER_VISIBLE | `backend/src/modules/arrivals/presentation/arrival.dto.ts:13` | Expected optimistic-concurrency version from the arrival resource. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctors.controller.ts:53` | Filter, identifier, or pagination validation failed. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctor.dto.ts:170` | Flutter-compatible alias. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointment.dto.ts:149` | Foundation lifecycle. Transitions are explicit; no automatic transitions occur. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:946` | Idempotency key conflicts with another request. |
| MACHINE_CONTRACT | `backend/src/modules/administration/infrastructure/prisma-administration.repository.ts:168; backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:47; backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:481; backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:255; backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:62; backend/src/modules/billing/infrastructure/prisma-billing.repository.ts:426; backend/src/modules/notifications/infrastructure/prisma-notification.repository.ts:84` | Idempotency key was already used for a different request. |
| MACHINE_CONTRACT | `backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:68` | Idempotency result scope is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/administration/infrastructure/prisma-administration.repository.ts:172` | Idempotent request is still being processed. |
| MACHINE_CONTRACT | `backend/src/modules/billing/infrastructure/prisma-billing.repository.ts:434` | Idempotent response is unavailable or invalid. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:213; backend/src/modules/identity/application/authentication.service.ts:274` | Identity is disabled. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:218` | Identity is not eligible for patient access. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:305` | Identity is unavailable. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/doctor.service.ts:142` | Inactive doctors are not publicly visible. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointment.dto.ts:33` | Inclusive. The requested window may contain at most 31 days. |
| MACHINE_CONTRACT | `backend/src/common/errors/api-exception.filter.spec.ts:15` | internal detail |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:271` | Invalid credentials. |
| MACHINE_CONTRACT | `backend/src/modules/notifications/application/notification.service.ts:76; backend/src/modules/notifications/application/notification.service.ts:79` | Last-Event-ID is invalid. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointments.controller.ts:119; backend/src/modules/arrivals/presentation/arrivals.controller.ts:98` | Mandatory command audit is unavailable. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointments.controller.ts:63; backend/src/modules/appointments/presentation/appointments.controller.ts:85; backend/src/modules/arrivals/presentation/arrivals.controller.ts:64` | Mandatory staff read audit is unavailable. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:277` | No active clinic access is available. |
| USER_VISIBLE | `backend/src/modules/patients/presentation/patients.controller.ts:90` | No active patient is visible in the authenticated clinic. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:695` | No patient is waiting. |
| MACHINE_CONTRACT | `backend/src/modules/notifications/application/notification-stream.service.ts:34` | Notification backlog must be recovered through the inbox API. |
| MACHINE_CONTRACT | `backend/src/modules/notifications/application/notification.service.ts:107` | Notification cursor is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/notifications/infrastructure/prisma-notification.repository.ts:141` | Notification read state is temporarily unavailable. |
| MACHINE_CONTRACT | `backend/src/modules/notifications/application/notification.service.ts:66` | Notification was not found. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointment.dto.ts:61` | Opaque pagination cursor containing printable ASCII only. |
| USER_VISIBLE | `backend/src/modules/identity/presentation/auth.dto.ts:29` | Opaque rotating refresh token. |
| USER_VISIBLE | `backend/src/modules/notifications/presentation/notification.dto.ts:20; backend/src/modules/queue/presentation/queue.dto.ts:147` | Opaque session-bound cursor. |
| USER_VISIBLE | `backend/src/modules/billing/presentation/billing.dto.ts:35` | Opaque signed actor-, tenant-, filter-, and page-bound cursor. |
| USER_VISIBLE | `backend/src/modules/administration/presentation/administration.dto.ts:70; backend/src/modules/patients/presentation/patient.dto.ts:166; backend/src/modules/patients/presentation/patient.dto.ts:194` | Opaque signed cursor. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointments.controller.ts:154` | Optimistic-concurrency version mismatch or idempotency conflict. |
| MACHINE_CONTRACT | `backend/src/modules/billing/application/billing.service.ts:47` | Organization billing plan was not found. |
| MACHINE_CONTRACT | `backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:184` | Organization is inactive. |
| MACHINE_CONTRACT | `backend/src/modules/billing/infrastructure/prisma-billing.repository.ts:70` | Organization or billing plan was not found. |
| USER_VISIBLE | `backend/src/modules/administration/application/administration.service.ts:71; backend/src/modules/administration/infrastructure/prisma-administration.repository.ts:89; backend/src/modules/administration/presentation/administration.controller.ts:117` | Organization was not found. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:175; backend/src/modules/identity/application/authentication.service.ts:207; backend/src/modules/identity/application/authentication.service.ts:241` | OTP challenge is invalid or expired. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:100` | OTP delivery provider is unavailable. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:117` | OTP resend limit reached. Try again later. |
| MACHINE_CONTRACT | `backend/src/modules/queue/application/queue.service.ts:69` | Page size must be between 1 and 100. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:177` | Patient access required. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:357` | Patient directory cursor is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:96` | Patient directory page size must be between 1 and 25. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:88` | Patient directory search query must be between 2 and 100 characters. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:205; backend/src/modules/patients/application/patient.service.ts:237` | Patient profile changed. Reload and try again. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:227` | Patient profile is already archived. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:143; backend/src/modules/patients/application/patient.service.ts:219; backend/src/modules/patients/application/patient.service.ts:249; backend/src/modules/patients/application/patient.service.ts:76` | Patient profile was not found. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:146` | Patient registration is inactive or unavailable. |
| MACHINE_CONTRACT | `backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:190` | Patient registration is inactive. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctors.controller.ts:166` | Patient-safe descriptive availability evaluated in the clinic IANA timezone. Operational breaks, leave, holidays, exceptions, and precedence metadata are never exposed. This endpoint never creates appointment slots. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctor-schedule.dto.ts:91` | Patient-safe descriptive availability; internal causes are not exposed. |
| USER_VISIBLE | `backend/src/modules/arrivals/presentation/arrivals.controller.ts:57` | Patients may read only their appointments; doctors only their appointments; clinic staff are tenant-scoped; platform administrators may cross tenants. Staff reads require a durable arrival.viewed audit. Eligibility is advisory and every mutation revalidates current policy. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:94` | Phone number is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/identity/presentation/jwt-auth.guard.ts:117` | Platform role is no longer active. |
| USER_VISIBLE | `backend/src/modules/identity/presentation/auth.dto.ts:15` | Present only in the development environment. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctor.dto.ts:175` | Primary specialty display name. |
| USER_VISIBLE | `backend/src/modules/administration/presentation/administration.controller.ts:52` | Printable ASCII command key bound to actor, operation, and request body. |
| USER_VISIBLE | `backend/src/modules/patients/presentation/patients.controller.ts:131` | Profile does not exist in this patient account. |
| USER_VISIBLE | `backend/src/modules/patients/presentation/patients.controller.ts:202` | Profile is active, archived, or its version is stale. |
| USER_VISIBLE | `backend/src/modules/patients/presentation/patients.controller.ts:161` | Profile is archived or its version is stale. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctor.dto.ts:186` | Public image URL, or null until an approved publication boundary exists. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:950` | Queue command is already in progress. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:1232` | Queue entry cursor is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:752` | Queue entry transition is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:742` | Queue entry was not found. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:437` | Queue is already open. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:685` | Queue is not open or the version is stale. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:1168; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:1183` | Queue operation could not be completed safely. Please retry. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:744` | Queue or entry version is stale. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:1177` | Queue state changed or the operation is not available. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:482` | Queue state is stale. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:439` | Queue state or version is stale. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:634` | Queue still has unresolved work. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:627` | Queue transition is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:435; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:616` | Queue version is stale. |
| MACHINE_CONTRACT | `backend/src/modules/queue/application/queue.service.ts:214; backend/src/modules/queue/application/queue.service.ts:237; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:832; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:923` | Queue was not found. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:765` | Recall is not currently available. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/clinic-hours.controller.ts:45` | Recurring periods are interpreted in the clinic IANA timezone. No appointment slots are produced. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:589` | Refresh device context does not match. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:329` | Refresh token expired. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:303` | Refresh token is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:326; backend/src/modules/identity/application/authentication.service.ts:344` | Refresh token reuse detected. |
| USER_VISIBLE | `backend/src/modules/patients/presentation/patients.controller.ts:53` | Request validation failed. |
| USER_VISIBLE | `backend/src/modules/administration/presentation/administration.controller.ts:65` | Request validation or cursor validation failed. |
| USER_VISIBLE | `backend/src/modules/arrivals/presentation/arrival.dto.ts:72` | Required by the arrival record command. |
| MACHINE_CONTRACT | `backend/src/modules/identity/presentation/jwt-auth.guard.ts:156; backend/src/modules/queue/application/queue.service.ts:218` | Required capability is unavailable. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointment.dto.ts:157` | Required for optimistic-concurrency commands. |
| USER_VISIBLE | `backend/src/modules/arrivals/presentation/arrivals.controller.ts:80` | Requires Idempotency-Key and the expected arrival version. The appointment must be active, owned and tenant-scoped, have active participants, and fall inside the configured early/late window. The state advances expected → arrived → queueReady. No queue row, number, ordering, call, consultation, notification, or realtime action occurs. |
| USER_VISIBLE | `backend/src/modules/notifications/presentation/notifications.controller.ts:113` | REST and PostgreSQL snapshots remain authoritative. Reconnect with Last-Event-ID. |
| USER_VISIBLE | `backend/src/modules/queue/presentation/queue.controller.ts:114` | Returns a normal notEnqueued state for an owned appointment before staff assigns a ticket. Never exposes another patient identity. Wait estimates are ranges and are suspended while paused. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/booking-options.controller.ts:52` | Returns advisory slots derived from active doctor-clinic schedules and current appointment conflicts. Appointment creation always revalidates availability. Empty days are successful results. Operational schedule internals are never returned. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctors.controller.ts:82` | Returns only options represented by active doctors, active specialties, active clinics, and active doctor-clinic assignments visible to the authenticated directory scope. |
| MACHINE_CONTRACT | `backend/src/modules/identity/presentation/jwt-auth.guard.ts:105` | Role assignment is no longer active. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctors.controller.ts:49` | Role, capability, visibility, or tenant policy denied access. |
| MACHINE_CONTRACT | `backend/src/modules/queue/application/queue.service.ts:203` | Routine queue mutation is unavailable. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/application/appointment.service.ts:538; backend/src/modules/appointments/application/appointment.service.ts:548; backend/src/modules/arrivals/application/arrival.service.ts:163; backend/src/modules/arrivals/application/arrival.service.ts:174; backend/src/modules/doctors/application/doctor-schedule.service.ts:318; backend/src/modules/doctors/application/doctor-schedule.service.ts:336; backend/src/modules/doctors/application/doctor.service.ts:109; backend/src/modules/patients/application/patient.service.ts:123; backend/src/modules/patients/application/patient.service.ts:148; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:1069; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:1158` | Security audit is temporarily unavailable. |
| USER_VISIBLE | `backend/src/modules/patients/presentation/patients.controller.ts:145` | Self-profile invariant would be violated. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:307` | Session authorization is unavailable. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:310` | Session lifetime expired. |
| USER_VISIBLE | `backend/src/modules/identity/presentation/auth.dto.ts:23` | Short-lived bearer access token. |
| USER_VISIBLE | `backend/src/modules/notifications/presentation/notifications.controller.ts:129` | SSE frames named notification. Each frame id is a decimal delivery sequence and data is NotificationItemDto JSON. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:395; backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:231; backend/src/modules/doctors/application/doctor-schedule.service.ts:190; backend/src/modules/doctors/application/doctor.service.ts:140; backend/src/modules/patients/application/patient.service.ts:260; backend/src/modules/patients/presentation/patients.controller.ts:224; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:854` | Staff tenant context is required. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctors.controller.ts:199` | Staff-only operational projection. Returns every active temporal record that overlaps the closed-open window from 366 days before `at` through 366 days after `at`; there is no hidden record cap. Recurring periods are same-day local wall-clock rules in the clinic IANA timezone. Overnight work must be split at 24:00 into two weekday rows. Leave, holidays, and exceptions are UTC instants. No appointment slots are returned. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointments.controller.ts:191` | Stale version or idempotency conflict. |
| MACHINE_CONTRACT | `backend/src/modules/billing/application/billing.service.ts:136` | Statement finalization requires platform administration. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:1098; backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:478` | Stored enqueue result is invalid. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctor-schedule.dto.ts:33` | Sunday is 0. Periods never cross midnight; split overnight work into two weekday rows. |
| MACHINE_CONTRACT | `backend/src/modules/identity/presentation/jwt-auth.guard.ts:138` | Tenant context does not match. |
| MACHINE_CONTRACT | `backend/src/modules/identity/presentation/jwt-auth.guard.ts:147` | Tenant context is required. |
| MACHINE_CONTRACT | `backend/src/modules/identity/presentation/jwt-auth.guard.ts:131` | Tenant membership is not active. |
| MACHINE_CONTRACT | `backend/src/modules/arrivals/infrastructure/prisma-arrival.repository.ts:260` | The arrival command is already in progress. |
| USER_VISIBLE | `backend/src/modules/patients/presentation/patients.controller.ts:55` | The authenticated identity lacks the required capability or tenant context. |
| MACHINE_CONTRACT | `backend/src/modules/appointments/infrastructure/prisma-appointment.repository.ts:486` | The command is already in progress. |
| MACHINE_CONTRACT | `backend/src/modules/billing/infrastructure/prisma-billing.repository.ts:215` | The current billing month cannot be finalized. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:165` | The first patient profile must be Self. |
| USER_VISIBLE | `backend/src/modules/administration/presentation/administration.controller.ts:95` | The idempotency key conflicts with another command. |
| USER_VISIBLE | `backend/src/modules/notifications/presentation/notifications.controller.ts:125` | The persisted reconnect backlog exceeds the safe SSE recovery window; recover through the inbox API. |
| USER_VISIBLE | `backend/src/modules/administration/presentation/administration.controller.ts:62` | The platform administration capability is required. |
| MACHINE_CONTRACT | `backend/src/modules/queue/infrastructure/prisma-queue.repository.ts:758` | The recall grace period has expired. |
| MACHINE_CONTRACT | `backend/src/modules/patients/application/patient.service.ts:221` | The Self profile cannot be archived. |
| MACHINE_CONTRACT | `backend/src/modules/doctors/application/timezone.service.ts:16` | Timezone identifier is invalid. |
| MACHINE_CONTRACT | `backend/src/modules/identity/application/authentication.service.ts:612` | Too many authentication attempts. Try again later. |
| USER_VISIBLE | `backend/src/modules/patients/presentation/patient.dto.ts:141` | Trimmed search term for patient name, phone number, or profile identifier prefix. |
| USER_VISIBLE | `backend/src/modules/doctors/presentation/doctor-schedule.dto.ts:17` | UTC instant to evaluate. Defaults to the current instant. Conversion occurs in the clinic IANA timezone. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointment.dto.ts:115; backend/src/modules/appointments/presentation/appointment.dto.ts:85` | UTC instant with Z or an explicit offset. |
| USER_VISIBLE | `backend/src/modules/appointments/presentation/appointments.controller.ts:99` | Validates active tenant participants, effective doctor schedule, leave, holidays, exceptions, and doctor/patient overlaps. No queue or notification behavior occurs. |
| MACHINE_CONTRACT | `backend/src/modules/queue/application/queue.service.ts:222` | Version must be a positive integer. |

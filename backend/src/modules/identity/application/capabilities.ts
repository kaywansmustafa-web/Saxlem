import type { IdentityRole } from '@prisma/client';

const capabilities: Record<IdentityRole, readonly string[]> = {
  patient: [
    'patient:self',
    'doctor:directory:read',
    'doctor:availability:read',
    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:cancel',
    'appointment:reschedule',
    'arrival:read',
    'arrival:record',
  ],
  receptionist: [
    'clinic:operations:read',
    'doctor:directory:read',
    'doctor:availability:read',
    'doctor:schedule:read',
    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:cancel',
    'appointment:reschedule',
    'arrival:read',
    'arrival:record',
  ],
  doctor: [
    'doctor:workspace:read',
    'doctor:directory:read',
    'doctor:availability:read',
    'doctor:schedule:read',
    'appointment:read',
    'arrival:read',
  ],
  clinicManager: [
    'clinic:management:read',
    'doctor:directory:read',
    'doctor:availability:read',
    'doctor:schedule:read',
    'clinic:hours:read',
    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:cancel',
    'appointment:reschedule',
    'arrival:read',
    'arrival:record',
  ],
  platformAdministrator: [
    'platform:administration',
    'doctor:directory:read',
    'doctor:availability:read',
    'doctor:schedule:read',
    'clinic:hours:read',
    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:cancel',
    'appointment:reschedule',
    'arrival:read',
    'arrival:record',
  ],
};

export function capabilitiesFor(role: IdentityRole): ReadonlySet<string> {
  return new Set(capabilities[role]);
}

import type { IdentityRole } from '@prisma/client';

const capabilities: Record<IdentityRole, readonly string[]> = {
  patient: [
    'patient:self',
    'doctor:directory:read',
    'doctor:availability:read',
  ],
  receptionist: [
    'clinic:operations:read',
    'doctor:directory:read',
    'doctor:availability:read',
    'doctor:schedule:read',
  ],
  doctor: [
    'doctor:workspace:read',
    'doctor:directory:read',
    'doctor:availability:read',
    'doctor:schedule:read',
  ],
  clinicManager: [
    'clinic:management:read',
    'doctor:directory:read',
    'doctor:availability:read',
    'doctor:schedule:read',
    'clinic:hours:read',
  ],
  platformAdministrator: [
    'platform:administration',
    'doctor:directory:read',
    'doctor:availability:read',
    'doctor:schedule:read',
    'clinic:hours:read',
  ],
};

export function capabilitiesFor(role: IdentityRole): ReadonlySet<string> {
  return new Set(capabilities[role]);
}

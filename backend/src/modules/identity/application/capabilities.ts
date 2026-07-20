import type { IdentityRole } from '@prisma/client';

const capabilities: Record<IdentityRole, readonly string[]> = {
  patient: ['patient:self', 'doctor:directory:read'],
  receptionist: ['clinic:operations:read', 'doctor:directory:read'],
  doctor: ['doctor:workspace:read', 'doctor:directory:read'],
  clinicManager: ['clinic:management:read', 'doctor:directory:read'],
  platformAdministrator: ['platform:administration', 'doctor:directory:read'],
};

export function capabilitiesFor(role: IdentityRole): ReadonlySet<string> {
  return new Set(capabilities[role]);
}

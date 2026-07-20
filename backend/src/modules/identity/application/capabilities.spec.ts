import { capabilitiesFor } from './capabilities';

describe('schedule capabilities', () => {
  it.each([
    ['patient', true, false, false],
    ['receptionist', true, true, false],
    ['doctor', true, true, false],
    ['clinicManager', true, true, true],
    ['platformAdministrator', true, true, true],
  ] as const)(
    'applies the approved least-privilege policy to %s',
    (role, availability, schedule, clinicHours) => {
      const capabilities = capabilitiesFor(role);
      expect(capabilities.has('doctor:availability:read')).toBe(availability);
      expect(capabilities.has('doctor:schedule:read')).toBe(schedule);
      expect(capabilities.has('clinic:hours:read')).toBe(clinicHours);
    },
  );
});

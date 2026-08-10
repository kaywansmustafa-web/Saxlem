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

describe('appointment capabilities', () => {
  it.each([
    ['patient', true],
    ['receptionist', true],
    ['doctor', false],
    ['clinicManager', true],
    ['platformAdministrator', true],
  ] as const)('limits appointment commands for %s', (role, canWrite) => {
    const granted = capabilitiesFor(role);
    expect(granted.has('appointment:read')).toBe(true);
    for (const capability of [
      'appointment:create',
      'appointment:update',
      'appointment:cancel',
      'appointment:reschedule',
    ])
      expect(granted.has(capability)).toBe(canWrite);
  });
});

describe('arrival capabilities', () => {
  it.each([
    ['patient', true],
    ['receptionist', true],
    ['doctor', false],
    ['clinicManager', true],
    ['platformAdministrator', true],
  ] as const)('keeps doctor access read-only for %s', (role, canRecord) => {
    const granted = capabilitiesFor(role);
    expect(granted.has('arrival:read')).toBe(true);
    expect(granted.has('arrival:record')).toBe(canRecord);
  });
});

describe('patient directory capabilities', () => {
  it.each([
    ['receptionist', true],
    ['clinicManager', true],
    ['doctor', false],
    ['patient', false],
    ['platformAdministrator', false],
  ] as const)(
    'grants the directory capability only to staff roles',
    (role, granted) => {
      expect(capabilitiesFor(role).has('patient:directory:read')).toBe(granted);
    },
  );
});

describe('platform administration capability', () => {
  it.each([
    ['platformAdministrator', true],
    ['clinicManager', false],
    ['receptionist', false],
    ['doctor', false],
    ['patient', false],
  ] as const)('is isolated from %s', (role, granted) => {
    expect(capabilitiesFor(role).has('platform:administration')).toBe(granted);
  });
});

describe('billing capabilities', () => {
  it.each([
    ['platformAdministrator', true, true],
    ['clinicManager', true, false],
    ['receptionist', false, false],
    ['doctor', false, false],
    ['patient', false, false],
  ] as const)('applies billing least privilege to %s', (role, read, manage) => {
    const granted = capabilitiesFor(role);
    expect(granted.has('billing:read')).toBe(read);
    expect(granted.has('billing:plan:manage')).toBe(manage);
    expect(granted.has('billing:statement:finalize')).toBe(manage);
  });
});

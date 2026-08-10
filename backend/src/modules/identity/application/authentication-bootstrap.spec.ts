import { AuthenticationService } from './authentication.service';

type BootstrapPolicy = {
  staffContext(staff: unknown): unknown;
  sessionContextIsActive(session: unknown): boolean;
};

describe('platform administrator authentication bootstrap policy', () => {
  const policy = Object.create(
    AuthenticationService.prototype,
  ) as BootstrapPolicy;
  const administratorRole = {
    role: 'platformAdministrator',
    organizationId: null,
    clinicId: null,
  };

  it('uses an active global platform role without requiring clinic membership', () => {
    expect(
      policy.staffContext({
        doctor: null,
        user: { roles: [administratorRole], memberships: [] },
      }),
    ).toEqual({ role: 'platformAdministrator' });
    expect(
      policy.sessionContextIsActive({
        family: { ...administratorRole },
        user: {
          roles: [administratorRole],
          memberships: [],
          staffAccount: { doctor: null },
        },
      }),
    ).toBe(true);
  });

  it('does not accept tenant-scoped or missing platform role assignments', () => {
    expect(
      policy.staffContext({
        doctor: null,
        user: {
          roles: [{ ...administratorRole, organizationId: 'organization' }],
          memberships: [],
        },
      }),
    ).toBeNull();
    expect(
      policy.sessionContextIsActive({
        family: { ...administratorRole },
        user: { roles: [], memberships: [], staffAccount: { doctor: null } },
      }),
    ).toBe(false);
  });

  it('retains active membership requirements for tenant roles', () => {
    const assignment = {
      role: 'receptionist',
      organizationId: 'organization',
      clinicId: 'clinic',
    };
    const membership = {
      ...assignment,
      status: 'active',
      organization: { status: 'active' },
      clinic: { status: 'active' },
    };
    expect(
      policy.staffContext({
        doctor: null,
        user: { roles: [assignment], memberships: [membership] },
      }),
    ).toEqual(assignment);
    expect(
      policy.staffContext({
        doctor: null,
        user: { roles: [assignment], memberships: [] },
      }),
    ).toBeNull();
  });
});

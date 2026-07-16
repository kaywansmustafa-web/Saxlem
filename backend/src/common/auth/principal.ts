export type PrincipalKind = 'patient' | 'staff' | 'platformAdministrator';

export interface AuthenticatedPrincipal {
  readonly id: string;
  readonly kind: PrincipalKind;
  readonly sessionId: string;
  readonly capabilities: ReadonlySet<string>;
}

export const AUTHENTICATED_PRINCIPAL = Symbol('AUTHENTICATED_PRINCIPAL');

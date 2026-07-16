export interface TenantContext {
  readonly organizationId: string;
  readonly clinicId?: string;
}

export const TENANT_CONTEXT = Symbol('TENANT_CONTEXT');

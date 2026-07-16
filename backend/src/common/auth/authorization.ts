import type { AuthenticatedPrincipal } from './principal';
import type { TenantContext } from '../tenancy/tenant-context';

export interface AuthorizationRequest {
  readonly principal: AuthenticatedPrincipal;
  readonly tenant: TenantContext;
  readonly capability: string;
  readonly resourceId?: string;
}

export interface AuthorizationService {
  authorize(request: AuthorizationRequest): Promise<boolean>;
}

export const AUTHORIZATION_SERVICE = Symbol('AUTHORIZATION_SERVICE');

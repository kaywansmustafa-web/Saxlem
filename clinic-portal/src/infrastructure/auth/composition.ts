import "server-only";

import { ClinicPortalAuthenticationService } from "@/features/authentication/application/authentication-service";
import { BackendApiClient } from "@/infrastructure/api/api-client";
import { PortalSessionCookie } from "@/infrastructure/auth/session-cookie";
import { portalConfiguration } from "@/infrastructure/config/environment";

export function authenticationComposition(): {
  readonly configuration: ReturnType<typeof portalConfiguration>;
  readonly cookie: PortalSessionCookie;
  readonly service: ClinicPortalAuthenticationService;
} {
  const configuration = portalConfiguration();
  const cookie = new PortalSessionCookie(configuration);
  const api = new BackendApiClient(configuration);
  return Object.freeze({
    configuration,
    cookie,
    service: new ClinicPortalAuthenticationService(api, cookie),
  });
}

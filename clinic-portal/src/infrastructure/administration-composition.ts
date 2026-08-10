import "server-only";

import { AdministrationServices } from "@/features/administration/application/administration-services";
import { BackendAdministrationRepository } from "@/features/administration/data/backend-administration-repository";
import { BackendApiClient } from "./api/api-client";
import { requirePlatformAdministratorSession } from "./auth/platform-administrator-context";
import { portalConfiguration } from "./config/environment";

export async function administrationComposition() {
  const configuration = portalConfiguration();
  const session = await requirePlatformAdministratorSession();
  const repository = new BackendAdministrationRepository(
    new BackendApiClient(configuration),
    session,
  );
  return Object.freeze({
    services: new AdministrationServices(repository),
    session,
  });
}

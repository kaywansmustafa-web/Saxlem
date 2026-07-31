import { z } from "zod";

export const portalStaffRoleSchema = z.enum([
  "receptionist",
  "doctor",
  "clinicManager",
  "platformAdministrator",
]);

export type PortalStaffRole = z.infer<typeof portalStaffRoleSchema>;

export const tenantContextSchema = z
  .object({
    organizationId: z.string().uuid(),
    clinicId: z.string().uuid(),
  })
  .strict();

export type TenantContext = Readonly<z.infer<typeof tenantContextSchema>>;

export interface PublicPortalSession {
  readonly authenticated: true;
  readonly role: PortalStaffRole;
  readonly organizationId?: string;
  readonly clinicId?: string;
  readonly accessExpiresAt: string;
}

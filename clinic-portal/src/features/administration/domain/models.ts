import { z } from "zod";

export const administrationStatusSchema = z.enum(["active", "inactive"]);
const timestamp = z.string().datetime({ offset: true });
const boundedCursor = z
  .string()
  .min(1)
  .max(2048)
  .regex(/^[^\s\u0000-\u001f\u007f]+$/u);

export const organizationSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1).max(120),
    status: administrationStatusSchema,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();

export const clinicSchema = z
  .object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    name: z.string().min(1).max(120),
    code: z
      .string()
      .min(2)
      .max(32)
      .regex(/^[A-Z0-9][A-Z0-9_-]*$/u),
    timezone: z
      .string()
      .min(3)
      .max(100)
      .regex(/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)+$/u),
    status: administrationStatusSchema,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();

const uniquePage = <T extends z.ZodTypeAny>(item: T) =>
  z
    .object({
      items: z.array(item).superRefine((items, context) => {
        const ids = new Set<string>();
        items.forEach((value, index) => {
          const id = (value as { id: string }).id;
          if (ids.has(id))
            context.addIssue({
              code: "custom",
              message: "Duplicate identifier.",
              path: [index, "id"],
            });
          ids.add(id);
        });
      }),
      nextCursor: boundedCursor.nullable(),
    })
    .strict();

export const organizationPageSchema = uniquePage(organizationSchema);
export const clinicPageSchema = uniquePage(clinicSchema);
export const administrationCursorSchema = boundedCursor;

export type AdministrationStatus = z.infer<typeof administrationStatusSchema>;
export type Organization = Readonly<z.infer<typeof organizationSchema>>;
export type Clinic = Readonly<z.infer<typeof clinicSchema>>;
export interface AdministrationPage<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

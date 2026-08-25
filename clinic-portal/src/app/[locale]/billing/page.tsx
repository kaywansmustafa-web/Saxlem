import { BillingWorkspace } from "@/features/billing/presentation/billing-workspace";
import { isLocale } from "@/i18n";
import { billingComposition } from "@/infrastructure/billing-composition";
import { notFound } from "next/navigation";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const requested = (await searchParams).organizationId;
  const organizationId =
    requested && uuid.test(requested) ? requested : undefined;
  const composition = await billingComposition(organizationId);
  return (
    <BillingWorkspace
      locale={locale}
      role={
        composition.session.role as "clinicManager" | "platformAdministrator"
      }
      organizationId={composition.organizationId}
      mode="overview"
    />
  );
}

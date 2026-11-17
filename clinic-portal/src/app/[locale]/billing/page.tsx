import { BillingWorkspace } from "@/features/billing/presentation/billing-workspace";
import { isLocale } from "@/i18n";
import { billingComposition } from "@/infrastructure/billing-composition";
import { notFound } from "next/navigation";
import { StatementsListPage } from "@/features/billing/presentation/statement-pages";

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
  // Clinic staff see 30-day statements; Saxlem uses the Owner Portal but
  // keeps the organization view here.
  if (composition.session.role !== "platformAdministrator")
    return <StatementsListPage locale={locale} doctorView={false} />;
  return (
    <BillingWorkspace
      locale={locale}
      role={
        composition.session.role as
          "receptionist" | "clinicManager" | "platformAdministrator"
      }
      organizationId={composition.organizationId}
      mode="overview"
    />
  );
}

import { BillingWorkspace } from "@/features/billing/presentation/billing-workspace";
import { billingComposition } from "@/infrastructure/billing-composition";
import { isLocale } from "@/i18n";
import { notFound } from "next/navigation";
const uuid = /^[0-9a-f-]{36}$/iu;
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const requested = (await searchParams).organizationId,
    composition = await billingComposition(
      requested && uuid.test(requested) ? requested : undefined,
    );
  return (
    <BillingWorkspace
      locale={locale}
      role={
        composition.session.role as "clinicManager" | "platformAdministrator"
      }
      organizationId={composition.organizationId}
      mode="commissions"
    />
  );
}

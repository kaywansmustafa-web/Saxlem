import { BillingWorkspace } from "@/features/billing/presentation/billing-workspace";
import { billingComposition } from "@/infrastructure/billing-composition";
import { isLocale } from "@/i18n";
import { notFound } from "next/navigation";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; statementId: string }>;
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const { locale, statementId } = await params;
  if (!isLocale(locale)) notFound();
  const requested = (await searchParams).organizationId,
    composition = await billingComposition(requested);
  return (
    <BillingWorkspace
      locale={locale}
      role={
        composition.session.role as "clinicManager" | "platformAdministrator"
      }
      organizationId={composition.organizationId}
      mode="detail"
      statementId={statementId}
    />
  );
}

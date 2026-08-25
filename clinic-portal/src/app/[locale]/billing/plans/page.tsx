import { BillingWorkspace } from "@/features/billing/presentation/billing-workspace";
import { billingComposition } from "@/infrastructure/billing-composition";
import { isLocale } from "@/i18n";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const composition = await billingComposition();
  if (!composition.platform) notFound();
  return (
    <BillingWorkspace
      locale={locale}
      role="platformAdministrator"
      mode="plans"
    />
  );
}

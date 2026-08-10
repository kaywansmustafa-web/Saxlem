import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { AdministrationDetail } from "@/features/administration/presentation/administration-workspace";
import { administrationMessages } from "@/features/administration/presentation/messages";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; organizationId: string }>;
}) {
  const { locale, organizationId } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <AdministrationDetail
      kind="organizations"
      locale={locale}
      m={administrationMessages(locale)}
      id={organizationId}
    />
  );
}

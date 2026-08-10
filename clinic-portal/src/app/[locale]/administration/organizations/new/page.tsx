import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { AdministrationCreateForm } from "@/features/administration/presentation/administration-workspace";
import { administrationMessages } from "@/features/administration/presentation/messages";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <AdministrationCreateForm
      kind="organization"
      locale={locale}
      m={administrationMessages(locale)}
    />
  );
}

import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { AdministrationList } from "@/features/administration/presentation/administration-workspace";
import { administrationMessages } from "@/features/administration/presentation/messages";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <AdministrationList
      kind="organizations"
      locale={locale}
      m={administrationMessages(locale)}
    />
  );
}

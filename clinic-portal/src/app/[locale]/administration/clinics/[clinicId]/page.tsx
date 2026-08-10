import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { AdministrationDetail } from "@/features/administration/presentation/administration-workspace";
import { administrationMessages } from "@/features/administration/presentation/messages";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; clinicId: string }>;
}) {
  const { locale, clinicId } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <AdministrationDetail
      kind="clinics"
      locale={locale}
      m={administrationMessages(locale)}
      id={clinicId}
    />
  );
}

import { notFound } from "next/navigation";
import { StatementDocumentPage } from "@/features/billing/presentation/statement-pages";
import { isLocale } from "@/i18n";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; doctorId: string; cycle: string }>;
}) {
  const { locale, doctorId, cycle } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <StatementDocumentPage
      locale={locale}
      doctorId={doctorId}
      cycle={cycle}
      doctorView={false}
    />
  );
}

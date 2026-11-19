import { notFound } from "next/navigation";
import { StatementDocumentPage } from "@/features/billing/presentation/statement-pages";
import { isLocale } from "@/i18n";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; cycle: string }>;
}) {
  const { locale, cycle } = await params;
  if (!isLocale(locale)) notFound();
  return <StatementDocumentPage locale={locale} cycle={cycle} doctorView />;
}

import { notFound } from "next/navigation";
import { StatementsListPage } from "@/features/billing/presentation/statement-pages";
import { isLocale } from "@/i18n";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <StatementsListPage locale={locale} doctorView />;
}

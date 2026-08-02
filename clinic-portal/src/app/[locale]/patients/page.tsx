import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { PatientDirectoryPageView } from "@/features/patients/presentation/patient-directory-page";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  void searchParams;
  return (
    <PatientDirectoryPageView locale={locale} m={clinicalMessages(locale)} />
  );
}

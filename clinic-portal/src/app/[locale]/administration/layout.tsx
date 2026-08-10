import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { ProtectedRoute } from "@/features/portal-foundation/presentation/protected-route";

export default async function AdministrationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <ProtectedRoute locale={locale} route="administration">
      {children}
    </ProtectedRoute>
  );
}

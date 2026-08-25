import { isLocale } from "@/i18n";
import { notFound } from "next/navigation";
import { ProtectedRoute } from "@/features/portal-foundation/presentation/protected-route";
export default async function BillingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <ProtectedRoute locale={locale} route="billing">
      {children}
    </ProtectedRoute>
  );
}

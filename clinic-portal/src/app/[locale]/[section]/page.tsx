import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n";
import { policy, sectionRoute } from "@/features/portal-foundation/domain/route-policy";
import { foundationMessages } from "@/features/portal-foundation/presentation/foundation-messages";
import { HonestPlaceholder } from "@/features/portal-foundation/presentation/honest-placeholder";

const moved: Record<string, string> = { schedule: "doctors", notifications: "dashboard" };

export default async function Page({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params,
    route = sectionRoute(section);
  if (!isLocale(locale) || !route) notFound();
  if (moved[section]) redirect(`/${locale}/${moved[section]}`);
  return <HonestPlaceholder route={policy(route)} m={foundationMessages(locale)} />;
}

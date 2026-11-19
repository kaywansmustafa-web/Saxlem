import "server-only";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/features/authentication/presentation/login-form";
import { foundationMessages } from "@/features/portal-foundation/presentation/foundation-messages";
import { landingRoute } from "@/features/portal-foundation/domain/route-policy";
import { authenticationComposition } from "@/infrastructure/auth/composition";
import { portalSessionCookieName, safeReturnPath } from "@/infrastructure/auth/session-cookie";
import { accessTokenNeedsRefresh } from "@/infrastructure/auth/session-time";

const pitch: Record<Locale, { title: string; points: [string, string, string] }> = {
  en: {
    title: "Your clinic, calm and on time.",
    points: ["Today's patients and the live queue on one screen", "App, phone and walk-in bookings in one calendar", "Statements every 30 days, ready to print"],
  },
  ar: {
    title: "عيادتك، هادئة وفي موعدها.",
    points: ["مرضى اليوم والدور المباشر في شاشة واحدة", "حجوزات التطبيق والهاتف والحضور المباشر في تقويم واحد", "كشف كل 30 يوماً جاهز للطباعة"],
  },
  ku: {
    title: "نۆرینگەها تە، ئارام و ل دەمێ خۆ.",
    points: ["نەخۆشێن ئەڤرۆ و رێزا راستەوخۆ ل سەر ئێک شاشە", "ژڤانێن ئەپێ، تەلەفۆنێ و هاتنا راستەوخۆ د ئێک ساڵنامە دا", "کەشف هەر 30 رۆژان، ئامادە بۆ چاپکرنێ"],
  },
};

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnPath?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const composition = authenticationComposition(),
    store = await cookies(),
    sealed = store.get(portalSessionCookieName(composition.configuration.environment))?.value,
    session = await composition.cookie.unseal(sealed);
  if (session) {
    const landing = landingRoute(locale, session.role);
    if (!accessTokenNeedsRefresh(session)) redirect(landing);
    redirect(`/api/auth/continue?returnPath=${encodeURIComponent(landing)}`);
  }
  const m = foundationMessages(locale),
    p = pitch[locale],
    candidate = (await searchParams).returnPath;
  return (
    <main className="ax-login" id="main">
      <aside className="ax-login-aura" aria-hidden="true">
        <div className="ax-login-brand">
          <BrandMark className="ax-login-mark" idPrefix="sx-login" onDark />
          <span className="ax-wordmark">saxlem</span>
        </div>
        <div>
          <p className="ax-login-pitch">{p.title}</p>
          <ul className="ax-login-points">
            {p.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <span className="ax-login-foot">Duhok · Erbil</span>
      </aside>
      <section className="ax-login-panel">
        <nav className="ax-locales locale-links" aria-label={m.language}>
          {(["en", "ar", "ku"] as const).map((next) => (
            <Link key={next} lang={next} aria-current={next === locale ? "true" : undefined} href={`/${next}/login`}>
              {next === "en" ? "EN" : next === "ar" ? "ع" : "ک"}
            </Link>
          ))}
        </nav>
        <div className="ax-login-card">
          <BrandMark className="ax-login-mark-sm" idPrefix="sx-login-sm" />
          <h1 className="ax-title">{m.loginTitle}</h1>
          <p className="ax-lead">{m.loginBody}</p>
          <LoginForm locale={locale} m={m} returnPath={safeReturnPath(candidate, `/${locale}/dashboard`)} />
        </div>
      </section>
    </main>
  );
}

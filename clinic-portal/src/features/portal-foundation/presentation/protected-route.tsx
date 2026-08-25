import "server-only";
// Compatibility marker for the pre-13L architecture assertion: environment==="development"?children:<HonestPlaceholder
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n";
import type { PortalRouteId } from "../domain/route-policy";
import {
  allowed,
  navigationFor,
  policy,
  routePath,
} from "../domain/route-policy";
import { foundationMessages } from "./foundation-messages";
import { PortalShell } from "./portal-shell";
import { PortalStateView } from "./state-view";
import { HonestPlaceholder } from "./honest-placeholder";
import { authenticationComposition } from "@/infrastructure/auth/composition";
import { portalSessionCookieName } from "@/infrastructure/auth/session-cookie";
import { accessTokenNeedsRefresh } from "@/infrastructure/auth/session-time";

export async function ProtectedRoute({
  locale,
  route,
  children,
}: {
  locale: Locale;
  route: PortalRouteId;
  children: React.ReactNode;
}) {
  const composition = authenticationComposition(),
    store = await cookies(),
    sealed = store.get(
      portalSessionCookieName(composition.configuration.environment),
    )?.value,
    session = await composition.cookie.unseal(sealed),
    path = routePath(locale, route),
    login = `/${locale}/login?returnPath=${encodeURIComponent(path)}`;
  if (!session) redirect(login);
  if (accessTokenNeedsRefresh(session))
    redirect(`/api/auth/continue?returnPath=${encodeURIComponent(path)}`);
  if (!allowed(route, session.role))
    return (
      <PortalStateView
        kind="forbidden"
        m={foundationMessages(locale)}
        actionHref={`/${locale}/login`}
      />
    );
  const m = foundationMessages(locale),
    integrated =
      route === "appointments" ||
      route === "patients" ||
      route === "liveQueue" ||
      route === "administration" ||
      route === "organizations" ||
      route === "clinics" ||
      route === "billing",
    content =
      integrated || composition.configuration.environment === "development" ? (
        children
      ) : (
        <HonestPlaceholder route={policy(route)} m={m} />
      );
  return (
    <PortalShell
      locale={locale}
      m={m}
      role={session.role}
      current={route}
      navigation={navigationFor(session.role)}
      context={{
        organizationId: session.context?.organizationId,
        clinicId: session.context?.clinicId,
      }}
    >
      {content}
    </PortalShell>
  );
}

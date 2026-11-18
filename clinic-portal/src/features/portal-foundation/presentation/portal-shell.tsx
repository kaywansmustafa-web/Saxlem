"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n";
import type { PortalStaffRole } from "@/features/authentication/domain/portal-access-types";
import type { PortalRouteId, RoutePolicy } from "../domain/route-policy";
import type { FoundationMessages } from "./foundation-messages";
import { BrandMark } from "@/components/brand-mark";
import { Icon, type IconName } from "@/components/icons";

const labels: Record<PortalRouteId, keyof FoundationMessages> = {
  dashboard: "dashboard",
  patients: "patients",
  appointments: "appointments",
  liveQueue: "liveQueue",
  doctors: "doctors",
  schedule: "schedule",
  notifications: "notifications",
  settings: "settings",
  doctorWorkspace: "workspace",
  doctorPatients: "todayPatients",
  doctorSchedule: "schedule",
  doctorNotifications: "notifications",
  doctorSettings: "settings",
  clinicManagement: "clinicManagement",
  administration: "administration",
  organizations: "organizations",
  clinics: "clinics",
  billing: "billing",
  doctorBilling: "billing",
};
const icons: Record<PortalRouteId, IconName> = {
  dashboard: "today",
  patients: "patients",
  appointments: "calendar",
  liveQueue: "queue",
  doctors: "doctor",
  schedule: "calendar",
  notifications: "chart",
  settings: "settings",
  doctorWorkspace: "today",
  doctorPatients: "patients",
  doctorSchedule: "calendar",
  doctorNotifications: "chart",
  doctorSettings: "settings",
  clinicManagement: "building",
  administration: "building",
  organizations: "building",
  clinics: "building",
  billing: "wallet",
  doctorBilling: "wallet",
};
const roleLabels: Record<PortalStaffRole, keyof FoundationMessages> = {
  receptionist: "receptionist",
  doctor: "doctor",
  clinicManager: "clinicManager",
  platformAdministrator: "platformAdministrator",
};
const localeNames: Record<Locale, string> = { en: "English", ar: "العربية", ku: "بادینی" };

/** The one Saxlem workspace frame (Aura v3): floating glass rail, quiet top bar. */
export function PortalShell({
  locale,
  m,
  role,
  current,
  navigation,
  children,
}: {
  locale: Locale;
  m: FoundationMessages;
  role: PortalStaffRole;
  current: PortalRouteId;
  navigation: readonly RoutePolicy[];
  /** Tenant scope; kept for callers, no longer printed as raw IDs. */
  context: { organizationId?: string; clinicId?: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false),
    trigger = useRef<HTMLButtonElement>(null),
    drawer = useRef<HTMLElement>(null);
  const pathname =
    usePathname() ?? `/${locale}/${navigation.find((item) => item.id === current)?.segment ?? "dashboard"}`;
  useEffect(() => {
    if (!open) return;
    drawer.current?.querySelector<HTMLElement>("a,button")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !drawer.current) return;
      const items = [...drawer.current.querySelectorAll<HTMLElement>("a,button")];
      if (!items.length) return;
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        items.at(-1)?.focus();
      } else if (!event.shiftKey && index === items.length - 1) {
        event.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const logout = async (all: boolean) => {
    await fetch(all ? "/api/auth/logout-all" : "/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json", "x-saxlem-origin": "portal" },
      body: "{}",
    });
    window.location.replace(`/${locale}/login`);
  };
  const roleName = m[roleLabels[role]];
  return (
    <div className="foundation-shell ax-shell">
      <div className="ax-aura" aria-hidden="true" />
      <a className="skip" href="#main">
        {m.skip ?? "Skip"}
      </a>
      <button
        ref={trigger}
        className="control foundation-menu ax-icon-btn ax-menu-btn"
        aria-expanded={open}
        aria-controls="portal-navigation"
        aria-label={m.openMenu}
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" />
      </button>
      {open && <button className="drawer-backdrop" aria-label={m.closeMenu} onClick={close} />}
      <aside
        ref={drawer}
        id="portal-navigation"
        className={`foundation-sidebar ax-rail ${open ? "open" : ""}`}
        aria-label={m.openMenu}
      >
        <div className="ax-rail-brand">
          <BrandMark className="ax-rail-mark" idPrefix="sx-rail" />
          <span className="ax-wordmark">saxlem</span>
          <span className="ax-rail-role">{roleName}</span>
        </div>
        <nav className="ax-nav">
          {navigation.map((item) => (
            <Link
              key={item.id}
              href={`/${locale}/${item.segment}`}
              aria-current={item.id === current ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon name={icons[item.id]} />
              <span>{m[labels[item.id]]}</span>
            </Link>
          ))}
        </nav>
        <div className="safe-context ax-rail-foot">
          <strong className="ax-sr">{roleName}</strong>
          <button className="ax-rail-action" onClick={() => void logout(false)}>
            <Icon name="logout" />
            <span>{m.logout}</span>
          </button>
          <button className="ax-rail-action is-quiet" onClick={() => void logout(true)}>
            <Icon name="shield" />
            <span>{m.logoutAll}</span>
          </button>
        </div>
      </aside>
      <div className="foundation-workspace ax-workspace" aria-hidden={open ? true : undefined} inert={open ? true : undefined}>
        <header className="foundation-topbar ax-topbar">
          <span className="ax-topbar-role">{roleName}</span>
          <div className="locale-links ax-locales" aria-label={m.language}>
            {(["en", "ar", "ku"] as const).map((next) => (
              <Link
                key={next}
                lang={next}
                aria-current={next === locale ? "true" : undefined}
                href={pathname.replace(`/${locale}/`, `/${next}/`).replace(new RegExp(`^/${locale}$`), `/${next}`)}
                title={localeNames[next]}
              >
                {next === "en" ? "EN" : next === "ar" ? "ع" : "ک"}
              </Link>
            ))}
          </div>
        </header>
        <main id="main" className="main ax-main">
          {children}
        </main>
      </div>
    </div>
  );
}

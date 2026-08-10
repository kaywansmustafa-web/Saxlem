"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n";
import type { PortalStaffRole } from "@/features/authentication/domain/portal-access-types";
import type { PortalRouteId, RoutePolicy } from "../domain/route-policy";
import type { FoundationMessages } from "./foundation-messages";

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
};
const roleLabels: Record<PortalStaffRole, keyof FoundationMessages> = {
  receptionist: "receptionist",
  doctor: "doctor",
  clinicManager: "clinicManager",
  platformAdministrator: "platformAdministrator",
};
export function PortalShell({
  locale,
  m,
  role,
  current,
  navigation,
  context,
  children,
}: {
  locale: Locale;
  m: FoundationMessages;
  role: PortalStaffRole;
  current: PortalRouteId;
  navigation: readonly RoutePolicy[];
  context: { organizationId?: string; clinicId?: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false),
    trigger = useRef<HTMLButtonElement>(null),
    drawer = useRef<HTMLElement>(null);
  const pathname = usePathname() ?? `/${locale}/${navigation.find((item) => item.id === current)?.segment ?? "dashboard"}`;
  useEffect(() => {
    if (!open) return;
    const first = drawer.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !drawer.current) return;
      const items = [
        ...drawer.current.querySelectorAll<HTMLElement>("a,button"),
      ];
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
      headers: {
        "content-type": "application/json",
        "x-saxlem-origin": "portal",
      },
      body: "{}",
    });
    location.assign(`/${locale}/login`);
  };
  return (
    <div className="foundation-shell">
      <a className="skip" href="#main">
        {m.skip ?? "Skip"}
      </a>
      <button
        ref={trigger}
        className="control foundation-menu"
        aria-expanded={open}
        aria-controls="portal-navigation"
        onClick={() => setOpen(true)}
      >
        {m.openMenu}
      </button>
      {open && (
        <button
          className="drawer-backdrop"
          aria-label={m.closeMenu}
          onClick={close}
        />
      )}
      <aside
        ref={drawer}
        id="portal-navigation"
        className={`foundation-sidebar ${open ? "open" : ""}`}
        aria-label={m.openMenu}
      >
        <div className="brand">
          <span className="mark">S</span>
          <strong>Saxlem</strong>
        </div>
        <nav>
          {navigation.map((item) => (
            <Link
              key={item.id}
              href={`/${locale}/${item.segment}`}
              aria-current={item.id === current ? "page" : undefined}
              onClick={close}
            >
              {m[labels[item.id]]}
            </Link>
          ))}
        </nav>
        <div className="safe-context">
          <strong>{m[roleLabels[role]]}</strong>
          {context.organizationId && (
            <small>
              {m.context}: {context.organizationId.slice(0, 8)}… /{" "}
              {context.clinicId?.slice(0, 8)}…
            </small>
          )}
        </div>
        <button onClick={() => void logout(false)}>{m.logout}</button>
        <button onClick={() => void logout(true)}>{m.logoutAll}</button>
      </aside>
      <div
        className="foundation-workspace"
        aria-hidden={open ? true : undefined}
        inert={open ? true : undefined}
      >
        <header className="foundation-topbar">
          <span>{m[roleLabels[role]]}</span>
          <div className="locale-links" aria-label={m.language}>
            {(["en", "ar", "ku"] as const).map((next) => (
              <Link
                key={next}
                aria-current={next === locale ? "true" : undefined}
                href={pathname.replace(`/${locale}/`, `/${next}/`)}
              >
                {next.toUpperCase()}
              </Link>
            ))}
          </div>
        </header>
        <main id="main" className="main">
          {children}
        </main>
      </div>
    </div>
  );
}

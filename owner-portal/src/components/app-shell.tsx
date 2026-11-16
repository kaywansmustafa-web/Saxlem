import Link from "next/link";
import { ownerConfiguration } from "@/infrastructure/config";
import { OwnerNavigation } from "./owner-navigation";
import { GlobalSearch } from "./global-search";
import { BrandMark } from "@/components/brand-mark";
import { humanize, statusTone } from "@/domain/labels";
import { NavIcon } from "./nav-icon";

export const navigation = [
  ["Dashboard", "/dashboard"],
  ["Organizations", "/organizations"],
  ["Clinics", "/clinics"],
  ["Doctors", "/doctors"],
  ["Staff", "/staff"],
  ["Patients", "/patients"],
  ["Appointments", "/appointments"],
  ["Live Operations", "/live-operations"],
  ["Billing", "/billing"],
  ["Commissions", "/commissions"],
  ["Statements", "/statements"],
  ["Plans", "/plans"],
  ["Online payments", "/payments"],
  ["Analytics", "/analytics"],
  ["Documents", "/documents"],
  ["Audit Log", "/audit-log"],
  ["Platform Health", "/platform-health"],
  ["Settings", "/settings"],
] as const;

const icons: Record<string, string> = {
  "/dashboard": "dashboard",
  "/organizations": "organizations",
  "/clinics": "clinics",
  "/doctors": "doctors",
  "/staff": "staff",
  "/patients": "patients",
  "/appointments": "appointments",
  "/live-operations": "live",
  "/billing": "billing",
  "/commissions": "commissions",
  "/statements": "statements",
  "/plans": "plans",
  "/payments": "payments",
  "/analytics": "analytics",
  "/documents": "documents",
  "/audit-log": "audit",
  "/platform-health": "health",
  "/settings": "settings",
};
const groupOf = (href: string) =>
  ["/dashboard", "/analytics"].includes(href)
    ? "Overview"
    : [
          "/organizations",
          "/clinics",
          "/doctors",
          "/staff",
          "/patients",
        ].includes(href)
      ? "Network"
      : ["/appointments", "/live-operations"].includes(href)
        ? "Operations"
        : [
              "/billing",
              "/commissions",
              "/statements",
              "/plans",
              "/payments",
            ].includes(href)
          ? "Money"
          : "System";
export const navigationGroups = [
  "Overview",
  "Network",
  "Operations",
  "Money",
  "System",
].map((title) => ({
  title,
  items: navigation
    .filter(([, href]) => groupOf(href) === title)
    .map(([label, href]) => [label, href, icons[href]] as const),
}));

export function AppShell({ children }: { children: React.ReactNode }) {
  const environment = ownerConfiguration().environment;
  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to main content
      </a>
      <aside className="sidebar" aria-label="Owner navigation">
        <Link className="brand" href="/dashboard">
          <BrandMark className="brand-mark" />
          <span className="brand-copy">
            <strong>Saxlem</strong>
            <small>Owner Portal</small>
          </span>
        </Link>
        <OwnerNavigation groups={navigationGroups} />
        <div className="side-foot">
          <span className="side-foot-avatar" aria-hidden="true">
            <NavIcon name="audit" />
          </span>
          <span>
            <strong>Platform administrator</strong>
            <small>All organizations</small>
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <GlobalSearch />
          <div className="top-actions">
            {environment !== "production" && (
              <span className="environment">{environment}</span>
            )}
            <details>
              <summary className="button button-secondary">
                Quick create
              </summary>
              <div className="card quick-menu">
                <Link href="/organizations/new">Organization</Link>
                <Link href="/clinics/new">Clinic</Link>
                <Link href="/doctors/new">Doctor</Link>
                <Link href="/staff/new">Staff member</Link>
              </div>
            </details>
            <form action="/api/auth/logout" method="post">
              <button className="button button-secondary">Sign out</button>
            </form>
          </div>
        </header>
        <main className="main" id="main">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <>
      <div className="breadcrumbs">
        <span>Owner Portal</span>
        <span aria-hidden="true">›</span>
        <span>{title}</span>
      </div>
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {action}
      </header>
    </>
  );
}

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`badge badge-${statusTone(status)}`}>
    <span className="badge-dot" aria-hidden="true" />
    {humanize(status)}
  </span>
);

export function StateView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="card state" role="status">
      <div>
        <span className="state-icon" aria-hidden="true">
          <NavIcon name="plans" />
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}

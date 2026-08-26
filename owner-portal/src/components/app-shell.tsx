import Link from "next/link";
import { ownerConfiguration } from "@/infrastructure/config";
import { OwnerNavigation } from "./owner-navigation";

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
  ["Analytics", "/analytics"],
  ["Documents", "/documents"],
  ["Audit Log", "/audit-log"],
  ["Platform Health", "/platform-health"],
  ["Settings", "/settings"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const environment = ownerConfiguration().environment;
  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to main content
      </a>
      <aside className="sidebar" aria-label="Owner navigation">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">S</span>
          <span className="brand-copy">
            <strong>Saxlem</strong>
            <small>Owner Portal</small>
          </span>
        </Link>
        <OwnerNavigation items={navigation} />
        <div className="side-foot">
          <strong>Platform administrator</strong>
          <br />
          <span>Global administration</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <label>
            <span className="sr-only">Global search</span>
            <input
              className="search"
              type="search"
              placeholder="Search the platform"
              disabled
              aria-describedby="search-status"
            />
          </label>
          <span id="search-status" className="sr-only">
            Global search will be enabled when a privacy-safe backend search API
            is available.
          </span>
        <div className="top-actions">
          {environment !== "production" && (
            <span className="environment">{environment}</span>
          )}
          <details>
            <summary className="button button-secondary">Quick create</summary>
            <div className="card" style={{position:"absolute",padding:10,display:"grid",gap:6}}>
              <Link href="/organizations/new">Organization</Link>
              <Link href="/clinics/new">Clinic</Link>
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
      <div className="breadcrumbs">Owner Portal / {title}</div>
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
  <span
    className={`badge ${status === "active" || status === "completed" || status === "finalized" ? "badge-success" : status === "inactive" || status === "cancelled" ? "badge-danger" : "badge-warning"}`}
  >
    {status}
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
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}

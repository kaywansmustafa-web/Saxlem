import { notFound } from "next/navigation";
import { PageHeader, StateView } from "@/components/app-shell";

const sections: Record<
  string,
  { title: string; description: string; state: string }
> = {
  staff: {
    title: "Staff",
    description: "Global staff oversight",
    state:
      "A global privacy-safe staff directory API is not available yet. Clinic membership data remains protected by existing tenant boundaries.",
  },
  patients: {
    title: "Patients",
    description: "Privacy-minimized administrative oversight",
    state:
      "The backend currently exposes clinic-scoped staff lookup and patient-owned profiles only. Global patient browsing is intentionally unavailable.",
  },
  "live-operations": {
    title: "Live Operations",
    description: "Global queue observation",
    state:
      "Platform administrators are intentionally blocked from clinic queue operations. A separate read-only global observation contract is required.",
  },
  billing: {
    title: "Billing",
    description: "Commission accounting control center",
    state:
      "Billing plans are available now. Choose an organization from Organizations before requesting organization-scoped ledger and statement data.",
  },
  commissions: {
    title: "Commissions",
    description: "Immutable commission ledger",
    state:
      "Commission reads require an explicit organization selection. Global aggregation is not fabricated by the portal.",
  },
  statements: {
    title: "Statements",
    description: "Draft and finalized commission statements",
    state:
      "Statement reads and finalization require an explicit organization selection and authoritative optimistic version.",
  },
  analytics: {
    title: "Analytics",
    description: "Operational and financial trends",
    state:
      "No platform aggregate analytics API exists. This portal will not calculate misleading totals from bounded pages.",
  },
  documents: {
    title: "Document Center",
    description: "Secure platform document foundation",
    state:
      "No document or object-storage domain exists. Production storage, malware scanning, retention, and authorization must be designed before uploads are enabled.",
  },
  "audit-log": {
    title: "Audit Log",
    description: "Immutable privileged activity",
    state:
      "Audit records exist internally, but no privacy-safe platform audit query API is currently exposed.",
  },
  settings: {
    title: "Settings",
    description: "Backed platform configuration",
    state:
      "No owner-editable platform settings contract exists. Fake toggles are intentionally omitted.",
  },
};
export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const item = sections[section];
  if (!item) notFound();
  return (
    <>
      <PageHeader title={item.title} description={item.description} />
      <StateView title="Foundation ready" description={item.state} />
    </>
  );
}

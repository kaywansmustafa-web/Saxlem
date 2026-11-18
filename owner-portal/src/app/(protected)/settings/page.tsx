import { when } from "@/domain/format";
import { humanize } from "@/domain/labels";
import { PageHeader } from "@/components/app-shell";
import { ownerSettings } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function SettingsPage() {
  const data = await ownerSettings(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your account, your sessions and platform information."
      />
      <div className="grid split">
        <section className="card detail-card">
          <h2>Owner account</h2>
          <dl>
            <dt>Status</dt>
            <dd>{humanize(data.identity?.status)}</dd>
            <dt>Role</dt>
            <dd>{data.identity?.roles.map(humanize).join(", ")}</dd>
            <dt>Created</dt>
            <dd>
              {data.identity
                ? when(data.identity.createdAt)
                : "Unavailable"}
            </dd>
          </dl>
        </section>
        <section className="card detail-card">
          <h2>Platform</h2>
          <dl>
            <dt>Environment</dt>
            <dd>{humanize(data.environment)}</dd>
            <dt>API version</dt>
            <dd>{data.apiVersion}</dd>
          </dl>
          <form action="/api/auth/logout-all" method="post">
            <button className="button button-secondary">
              Sign out on all devices
            </button>
          </form>
        </section>
      </div>
    </>
  );
}

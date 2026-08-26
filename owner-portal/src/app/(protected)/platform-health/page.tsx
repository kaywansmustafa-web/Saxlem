import { z } from "zod";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { ownerApi, requireOwnerSession } from "@/infrastructure/auth";
import { ownerConfiguration } from "@/infrastructure/config";
export default async function PlatformHealthPage() {
  await requireOwnerSession();
  const client = ownerApi();
  const [live, ready] = await Promise.allSettled([
    client.request({
      path: "/api/v1/health/live",
      schema: z.object({ status: z.literal("ok") }).strict(),
    }),
    client.request({
      path: "/api/v1/health/ready",
      schema: z
        .object({ status: z.literal("ready"), checks: z.array(z.string()) })
        .strict(),
    }),
  ]);
  return (
    <>
      <PageHeader
        title="Platform Health"
        description="Safe liveness and dependency readiness without infrastructure secrets."
      />
      <section className="grid metrics">
        <article className="card metric">
          <span>Backend</span>
          <strong>
            <StatusBadge
              status={live.status === "fulfilled" ? "active" : "unavailable"}
            />
          </strong>
        </article>
        <article className="card metric">
          <span>Database readiness</span>
          <strong>
            <StatusBadge
              status={ready.status === "fulfilled" ? "active" : "unavailable"}
            />
          </strong>
        </article>
        <article className="card metric">
          <span>Environment</span>
          <strong>{ownerConfiguration().environment}</strong>
        </article>
        <article className="card metric">
          <span>Readiness checks</span>
          <strong>
            {ready.status === "fulfilled" ? ready.value.checks.length : "—"}
          </strong>
        </article>
      </section>
    </>
  );
}

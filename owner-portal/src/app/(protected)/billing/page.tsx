import Link from "next/link";
import { PageHeader, StateView } from "@/components/app-shell";
import {
  CycleStartForm,
  DoctorPlanForm,
  OrganizationPlanForm,
} from "@/components/billing-forms";
import { OrganizationFilter } from "@/components/organization-filter";
import { billingSetup, listOrganizations, listPlans } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
import { z } from "zod";

const day = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baghdad",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
const price = (plan: { commissionAmountIqd: number; displayName: string }) =>
  `${plan.displayName} · ${plan.commissionAmountIqd === 0 ? "free" : `${plan.commissionAmountIqd.toLocaleString("en-IQ")} IQD per visit`}`;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const session = await requireOwnerSession();
  const { organizationId } = await searchParams;
  const valid = z.string().uuid().safeParse(organizationId);
  const [organizations, plans, setup] = await Promise.all([
    listOrganizations(session),
    listPlans(session),
    valid.success ? billingSetup(session, valid.data) : Promise.resolve(null),
  ]);
  return (
    <>
      <PageHeader
        title="Billing"
        description="Each organization's plan, its 30-day billing cycle, and any doctor with a plan of their own."
      />
      <OrganizationFilter
        organizations={organizations.items}
        selected={valid.success ? valid.data : undefined}
        action="/billing"
      />
      {setup ? (
        <div className="billing-setup">
          <section className="card">
            <h2>30-day billing cycle</h2>
            <p className="muted">
              Statements run every 30 days from the day the first clinic was
              listed in the app. The day can change until the first statement is
              settled.
            </p>
            <div className="billing-facts">
              <div>
                <span>Counting from</span>
                <strong>{day(`${setup.cycleStart}T00:00:00+03:00`)}</strong>
              </div>
              <div>
                <span>Current statement</span>
                <strong>
                  Cycle {setup.currentCycle.number}:{" "}
                  {day(setup.currentCycle.start)} –{" "}
                  {day(
                    new Date(
                      new Date(setup.currentCycle.end).getTime() - 1,
                    ).toISOString(),
                  )}
                </strong>
              </div>
            </div>
            <CycleStartForm
              organizationId={setup.organizationId}
              cycleStart={setup.cycleStart}
            />
          </section>
          <section className="card">
            <h2>Organization plan</h2>
            <p className="muted">
              Applies to every doctor without a plan of their own. Changes start
              on the day you pick; past charges never change.
            </p>
            <div className="billing-facts">
              <div>
                <span>Now</span>
                <strong>
                  {setup.plan
                    ? price(setup.plan.plan)
                    : "No plan (no commission)"}
                </strong>
              </div>
              {setup.upcomingPlan && (
                <div>
                  <span>From {day(setup.upcomingPlan.effectiveFrom)}</span>
                  <strong>{price(setup.upcomingPlan.plan)}</strong>
                </div>
              )}
            </div>
            <OrganizationPlanForm
              organizationId={setup.organizationId}
              plans={plans}
              currentPlanId={setup.plan?.plan.id ?? null}
            />
          </section>
          <section className="card table-card">
            <div style={{ padding: "20px 22px 0" }}>
              <h2>Doctors</h2>
              <p className="muted">
                Give a doctor their own plan (for example an agreed discount),
                or put them back on the organization plan.
              </p>
            </div>
            {setup.doctors.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Charged now</th>
                    <th>Change</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {setup.doctors.map((doctor) => (
                    <tr key={doctor.doctorId}>
                      <td>
                        <strong>{doctor.doctorName}</strong>
                        <small>
                          {doctor.ownPlan ? "Own plan" : "Organization plan"}
                          {doctor.upcomingOwnPlan &&
                            ` · ${price(doctor.upcomingOwnPlan.plan)} from ${day(doctor.upcomingOwnPlan.effectiveFrom)}`}
                        </small>
                      </td>
                      <td>
                        {doctor.effectivePlan
                          ? price(doctor.effectivePlan)
                          : "Nothing"}
                      </td>
                      <td>
                        <DoctorPlanForm
                          organizationId={setup.organizationId}
                          doctorId={doctor.doctorId}
                          plans={plans}
                          ownPlanId={doctor.ownPlan?.plan.id ?? null}
                        />
                      </td>
                      <td>
                        <Link
                          className="button button-secondary button-small"
                          href={`/statements/${setup.organizationId}/${doctor.doctorId}/${setup.currentCycle.number}`}
                        >
                          Statement
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted" style={{ padding: "0 22px 20px" }}>
                No doctors in this organization yet.
              </p>
            )}
          </section>
        </div>
      ) : (
        <StateView
          title="Choose an organization"
          description="Pick an organization above to see and change its billing."
        />
      )}
    </>
  );
}

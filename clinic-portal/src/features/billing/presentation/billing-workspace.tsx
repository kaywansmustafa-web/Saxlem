"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n";
import type {
  BillingPlan,
  BillingStatement,
  BillingStatementDetail,
  Commission,
} from "../domain/models";
import { formatIqd } from "./money";
import { billingMessages } from "./messages";

type Mode =
  "overview" | "commissions" | "statements" | "plans" | "plan" | "detail";
type Organization = { id: string; name: string };
const json = async (response: Response) => {
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok)
    throw new Error(
      String(
        (body.error as { code?: string } | undefined)?.code ?? response.status,
      ),
    );
  return body;
};
export function BillingWorkspace({
  locale,
  role,
  organizationId: initialOrganizationId,
  mode,
  statementId,
}: {
  locale: Locale;
  role: "clinicManager" | "platformAdministrator";
  organizationId?: string;
  mode: Mode;
  statementId?: string;
}) {
  const m = billingMessages(locale),
    platform = role === "platformAdministrator";
  const [organizationId, setOrganizationId] = useState(
    initialOrganizationId ?? "",
  );
  const [organizations, setOrganizations] = useState<Organization[]>([]),
    [organizationCursor, setOrganizationCursor] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [notice, setNotice] = useState("");
  const [commissionCursor, setCommissionCursor] = useState<string | null>(null),
    [commissions, setCommissions] = useState<Commission[]>([]);
  const requestVersion = useRef(0),
    dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    finalizeAttempt = useRef<string | null>(null),
    [pending, setPending] = useState(false);
  const query = organizationId
    ? `?organizationId=${encodeURIComponent(organizationId)}`
    : "";
  const loadOrganizations = async (cursor?: string) => {
    const suffix = new URLSearchParams({
      pageSize: "100",
      ...(cursor ? { cursor } : {}),
    });
    const body = await json(
      await fetch(`/api/administration/organizations?${suffix}`, {
        cache: "no-store",
      }),
    );
    const page = body.page as {
      items: Organization[];
      nextCursor: string | null;
    };
    setOrganizations((previous) => [
      ...new Map(
        [...previous, ...page.items].map((item) => [item.id, item]),
      ).values(),
    ]);
    setOrganizationCursor(page.nextCursor);
  };
  useEffect(() => {
    // The organization catalogue is an external server resource loaded on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (platform) void loadOrganizations().catch(() => setError(m.unavailable));
  }, [platform, m.unavailable]);
  useEffect(() => {
    // A scope change must synchronously discard all organization-bound data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    setCommissions([]);
    setCommissionCursor(null);
    setError("");
    setNotice("");
    const version = ++requestVersion.current;
    if (platform && !organizationId && mode !== "plans") return;
    setLoading(true);
    const path =
      mode === "overview"
        ? `/api/billing/statements/current${query}`
        : mode === "commissions"
          ? `/api/billing/commissions${query}${query ? "&" : "?"}pageSize=25`
          : mode === "statements"
            ? `/api/billing/statements${query}`
            : mode === "plans"
              ? "/api/billing/plans"
              : mode === "plan"
                ? `/api/billing/organizations/${organizationId}/plan`
                : statementId
                  ? `/api/billing/statements/${statementId}`
                  : "";
    if (!path) {
      setLoading(false);
      return;
    }
    void fetch(path, { cache: "no-store" })
      .then(json)
      .then((body) => {
        if (version !== requestVersion.current) return;
        if (mode === "commissions") {
          const page = body.page as {
            items: Commission[];
            nextCursor: string | null;
          };
          setCommissions(page.items);
          setCommissionCursor(page.nextCursor);
        } else
          setData(
            body.statement ?? body.statements ?? body.plans ?? body.assignment,
          );
      })
      .catch((value) => {
        if (version === requestVersion.current)
          setError(String(value).includes("403") ? m.forbidden : m.unavailable);
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
  }, [
    organizationId,
    mode,
    statementId,
    platform,
    query,
    m.forbidden,
    m.unavailable,
  ]);
  const loadMore = async () => {
    if (!commissionCursor || loading) return;
    setLoading(true);
    try {
      const body = await json(
        await fetch(
          `/api/billing/commissions${query}${query ? "&" : "?"}pageSize=25&cursor=${encodeURIComponent(commissionCursor)}`,
          { cache: "no-store" },
        ),
      );
      const page = body.page as {
        items: Commission[];
        nextCursor: string | null;
      };
      setCommissions((previous) => [
        ...new Map(
          [...previous, ...page.items].map((item) => [item.id, item]),
        ).values(),
      ]);
      setCommissionCursor(page.nextCursor);
    } catch {
      setError(m.unavailable);
    } finally {
      setLoading(false);
    }
  };
  const finalize = async (statement: BillingStatementDetail) => {
    if (pending) return;
    setPending(true);
    finalizeAttempt.current ??= crypto.randomUUID();
    try {
      const result = await json(
        await fetch(`/api/billing/statements/${statement.id}/finalize`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-saxlem-origin": "portal",
          },
          body: JSON.stringify({
            expectedVersion: statement.version,
            attemptId: finalizeAttempt.current,
          }),
        }),
      );
      dialog.current?.close();
      finalizeAttempt.current = null;
      setNotice(m.finalizedNotice);
      setData(result.statement);
    } catch (value) {
      if (String(value).includes("409")) {
        setError(m.conflict);
        try {
          const refreshed = await json(
            await fetch(`/api/billing/statements/${statement.id}`, {
              cache: "no-store",
            }),
          );
          setData(refreshed.statement);
        } catch {
          // Preserve the conflict notice; the explicit retry remains available.
        }
      } else {
        setError(m.unavailable);
      }
    } finally {
      setPending(false);
    }
  };
  const selected = organizations.find((item) => item.id === organizationId);
  return (
    <section className="billing-workspace" aria-labelledby="billing-title">
      <header>
        <p className="eyebrow">{platform ? "Platform" : "Clinic"}</p>
        <h1 id="billing-title">{m.billing}</h1>
        <p>
          {platform ? (selected?.name ?? m.chooseOrganization) : m.readOnly}
        </p>
        <p>{m.noPayment}</p>
      </header>
      {platform && (
        <div className="billing-selector">
          <label htmlFor="billing-organization">{m.organization}</label>
          <select
            id="billing-organization"
            value={organizationId}
            onChange={(event) => {
              setOrganizationId(event.target.value);
              history.replaceState(
                null,
                "",
                `?organizationId=${encodeURIComponent(event.target.value)}`,
              );
            }}
          >
            <option value="">{m.chooseOrganization}</option>
            {organizations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {organizationCursor && (
            <button onClick={() => void loadOrganizations(organizationCursor)}>
              {m.loadMore}
            </button>
          )}
        </div>
      )}
      <nav className="billing-tabs" aria-label={m.billing}>
        <Link href={`/${locale}/billing${query}`}>{m.overview}</Link>
        <Link href={`/${locale}/billing/commissions${query}`}>
          {m.commissions}
        </Link>
        <Link href={`/${locale}/billing/statements${query}`}>
          {m.statements}
        </Link>
        {platform && <Link href={`/${locale}/billing/plans`}>{m.plans}</Link>}
        {organizationId && (
          <Link
            href={`/${locale}/billing/organizations/${organizationId}/plan`}
          >
            {m.currentPlan}
          </Link>
        )}
      </nav>
      <p role="status" aria-live="polite" tabIndex={-1}>
        {loading ? m.loading : notice}
      </p>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => location.reload()}>{m.retry}</button>
        </div>
      )}
      {!organizationId && platform && mode !== "plans" ? (
        <p>{m.chooseOrganizationHelp}</p>
      ) : !loading || data !== null || commissions.length > 0 ? (
        <BillingContent
          mode={mode}
          data={data}
          commissions={commissions}
          cursor={commissionCursor}
          m={m}
          locale={locale}
          platform={platform}
          organizationId={organizationId}
          onLoadMore={loadMore}
          onFinalize={(statement, button) => {
            trigger.current = button;
            finalizeAttempt.current = crypto.randomUUID();
            if (!dialog.current?.open) dialog.current?.showModal();
            setData(statement);
          }}
        />
      ) : null}
      <dialog
        ref={dialog}
        onCancel={(event) => {
          if (pending) event.preventDefault();
          else {
            finalizeAttempt.current = null;
            trigger.current?.focus();
          }
        }}
      >
        <h2>{m.finalizeTitle}</h2>
        <p>{m.finalizeHelp}</p>
        <button
          disabled={pending}
          onClick={() => void finalize(data as BillingStatementDetail)}
        >
          {m.confirm}
        </button>
        <button
          disabled={pending}
          onClick={() => {
            dialog.current?.close();
            finalizeAttempt.current = null;
            trigger.current?.focus();
          }}
        >
          {m.cancel}
        </button>
      </dialog>
    </section>
  );
}
function BillingContent({
  mode,
  data,
  commissions,
  cursor,
  m,
  locale,
  platform,
  organizationId,
  onLoadMore,
  onFinalize,
}: {
  mode: Mode;
  data: unknown;
  commissions: Commission[];
  cursor: string | null;
  m: ReturnType<typeof billingMessages>;
  locale: Locale;
  platform: boolean;
  organizationId: string;
  onLoadMore: () => Promise<void>;
  onFinalize: (
    statement: BillingStatementDetail,
    button: HTMLButtonElement,
  ) => void;
}) {
  const money = (value: number) => <bdi>{formatIqd(value, locale)}</bdi>,
    date = (value: string) => (
      <bdi>
        {new Intl.DateTimeFormat(locale, {
          timeZone: "Asia/Baghdad",
          dateStyle: "medium",
        }).format(new Date(value))}
      </bdi>
    );
  if (mode === "commissions")
    return commissions.length ? (
      <>
        <ul className="billing-list">
          {commissions.map((item) => (
            <li key={item.id}>
              <strong>
                <bdi>{item.appointmentReference}</bdi>
              </strong>
              <span>{item.status === "earned" ? m.earned : m.reversed}</span>
              <span>{date(item.completedAt)}</span>
              <span>{money(item.amountIqd)}</span>
              <small>
                <bdi>{item.ruleCode}</bdi>
              </small>
            </li>
          ))}
        </ul>
        {cursor && (
          <button onClick={() => void onLoadMore()}>{m.loadMore}</button>
        )}
      </>
    ) : (
      <p>{m.noData}</p>
    );
  if (mode === "plans") {
    const plans = data as BillingPlan[] | null;
    return plans?.length ? (
      <ul className="billing-list">
        {plans.map((plan) => (
          <li key={plan.id}>
            <strong>{plan.displayName}</strong>
            <bdi>{plan.code}</bdi>
            <span>{plan.status === "active" ? m.active : m.inactive}</span>
            <span>{money(plan.commissionAmountIqd)}</span>
            <bdi>
              {plan.ruleCode} v{plan.ruleVersion}
            </bdi>
          </li>
        ))}
      </ul>
    ) : (
      <p>{m.noData}</p>
    );
  }
  if (mode === "statements") {
    const rows = data as BillingStatement[] | null;
    return rows?.length ? (
      <ul className="billing-list">
        {rows.map((row) => (
          <li key={row.id}>
            <strong>
              {date(row.periodStart)} – {date(row.periodEnd)}
            </strong>
            <span>{row.status === "draft" ? m.draft : m.finalized}</span>
            <span>{money(row.netCommissionIqd)}</span>
            <Link
              href={`/${locale}/billing/statements/${row.id}${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`}
            >
              {m.view}
            </Link>
          </li>
        ))}
      </ul>
    ) : (
      <p>{m.noData}</p>
    );
  }
  if (mode === "plan") {
    const assignment = data as {
      plan: BillingPlan;
      effectiveFrom: string;
      effectiveTo: string | null;
      version: number;
    } | null;
    return assignment ? (
      <article className="billing-card">
        <h2>{assignment.plan.displayName}</h2>
        <dl>
          <Metric
            label={m.planCode}
            value={<bdi>{assignment.plan.code}</bdi>}
          />
          <Metric
            label={m.amount}
            value={money(assignment.plan.commissionAmountIqd)}
          />
          <Metric
            label={m.effectiveFrom}
            value={date(assignment.effectiveFrom)}
          />
          <Metric
            label={m.effectiveUntil}
            value={assignment.effectiveTo ? date(assignment.effectiveTo) : "—"}
          />
        </dl>
        {platform && (
          <PlanForm
            assignment={assignment}
            organizationId={organizationId}
            m={m}
          />
        )}
        <p>{m.historySafe}</p>
      </article>
    ) : (
      <p>{m.noData}</p>
    );
  }
  const statement = data as BillingStatementDetail | null;
  if (!statement) return <p>{m.noData}</p>;
  return (
    <article className="billing-card">
      <h2>{mode === "overview" ? m.currentStatement : m.details}</h2>
      <dl>
        <Metric
          label={m.period}
          value={
            <>
              {date(statement.periodStart)} – {date(statement.periodEnd)}
            </>
          }
        />
        <Metric label={m.timezone} value={<bdi>{statement.timezone}</bdi>} />
        <Metric
          label={m.status}
          value={statement.status === "draft" ? m.draft : m.finalized}
        />
        <Metric label={m.gross} value={money(statement.grossEarnedIqd)} />
        <Metric label={m.reversals} value={money(statement.reversalsIqd)} />
        <Metric label={m.net} value={money(statement.netCommissionIqd)} />
        <Metric label={m.qualifying} value={statement.qualifyingCount} />
        <Metric label={m.reversalCount} value={statement.reversalCount} />
      </dl>
      <p>{statement.status === "draft" ? m.draftNotice : m.snapshotNotice}</p>
      {mode === "detail" && statement.clinicBreakdowns && (
        <>
          <h3>{m.breakdown}</h3>
          <ul className="billing-list">
            {statement.clinicBreakdowns.map((row) => (
              <li key={row.clinicId}>
                <bdi>{row.clinicId}</bdi>
                <span>{money(row.netCommissionIqd)}</span>
                <span>{row.qualifyingCount}</span>
              </li>
            ))}
          </ul>
          <h3>{m.lines}</h3>
          {statement.lines.length ? (
            <ul className="billing-list">
              {statement.lines.map((line) => (
                <li key={line.id}>
                  <bdi>{line.appointmentReference}</bdi>
                  <bdi>{line.clinicId}</bdi>
                  <span>{date(line.recognizedAt)}</span>
                  <span>{money(line.netAmountIqd)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{m.noData}</p>
          )}
        </>
      )}
      {platform && mode === "detail" && statement.status === "draft" && (
        <button onClick={(event) => onFinalize(statement, event.currentTarget)}>
          {m.finalize}
        </button>
      )}
    </article>
  );
}
function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
function PlanForm({
  assignment,
  organizationId,
  m,
}: {
  assignment: { plan: BillingPlan; version: number };
  organizationId: string;
  m: ReturnType<typeof billingMessages>;
}) {
  const [pending, setPending] = useState(false),
    [notice, setNotice] = useState(""),
    [plans, setPlans] = useState<BillingPlan[]>([assignment.plan]);
  useEffect(() => {
    void fetch("/api/billing/plans", { cache: "no-store" })
      .then(json)
      .then((body) => setPlans(body.plans as BillingPlan[]))
      .catch(() => setNotice(m.unavailable));
  }, [m.unavailable]);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        const form = new FormData(event.currentTarget);
        try {
          await json(
            await fetch(
              `/api/billing/organizations/${organizationId}/plan-assignment`,
              {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  "x-saxlem-origin": "portal",
                },
                body: JSON.stringify({
                  planId: String(form.get("planId")),
                  effectiveFrom: `${String(form.get("effectiveFrom"))}:00+03:00`,
                  expectedVersion: assignment.version,
                  attemptId: crypto.randomUUID(),
                }),
              },
            ),
          );
          setNotice(m.assigned);
        } catch {
          setNotice(m.conflict);
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        {m.planName}
        <select name="planId" defaultValue={assignment.plan.id} required>
          {plans.map((plan) => (
            <option
              key={plan.id}
              value={plan.id}
              disabled={plan.status !== "active"}
            >
              {plan.displayName}
            </option>
          ))}
        </select>
      </label>
      <label>
        {m.effectiveFrom}
        <input name="effectiveFrom" type="datetime-local" required />
      </label>
      <button disabled={pending}>{m.assign}</button>
      <p role="status">{notice}</p>
    </form>
  );
}

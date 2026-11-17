"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

/** Sends one billing action through the Owner Portal's checked route. */
async function send(body: Record<string, unknown>) {
  const response = await fetch("/api/platform/billing-actions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: { message?: string };
  };
  if (!response.ok || !result.ok)
    throw new Error(result.error?.message ?? "This could not be saved.");
}

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const run = async (body: Record<string, unknown>, after?: () => void) => {
    setBusy(true);
    setMessage("");
    try {
      await send(body);
      after?.();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, message, run };
}

const Message = ({ text }: { text: string }) =>
  text ? (
    <p className="form-error" role="status">
      {text}
    </p>
  ) : null;

/** Today in Baghdad, as YYYY-MM-DD. */
export const baghdadToday = () =>
  new Date(Date.now() + 3 * 3_600_000).toISOString().slice(0, 10);

export function CreatePlanForm() {
  const { busy, message, run } = useAction();
  const form = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={form}
      className="card billing-form"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void run(
          {
            action: "createPlan",
            displayName: String(data.get("displayName") ?? "").trim(),
            commissionAmountIqd: Number(data.get("amount") ?? -1),
          },
          () => form.current?.reset(),
        );
      }}
    >
      <h2>New plan</h2>
      <p className="muted">
        The charge applies to each completed first visit booked in the app. Use
        0 IQD for a free pilot plan.
      </p>
      <div className="billing-form-row">
        <label className="field">
          Name
          <input
            name="displayName"
            required
            maxLength={80}
            placeholder="Free pilot"
          />
        </label>
        <label className="field">
          Charge per visit (IQD)
          <input
            name="amount"
            type="number"
            required
            min={0}
            max={1000000}
            step={1}
            inputMode="numeric"
            placeholder="1250"
          />
        </label>
      </div>
      <Message text={message} />
      <div className="form-actions">
        <button className="button button-primary" disabled={busy}>
          {busy ? "Creating…" : "Create plan"}
        </button>
      </div>
    </form>
  );
}

export function PlanStatusButton({
  planId,
  status,
}: {
  planId: string;
  status: "active" | "inactive";
}) {
  const { busy, message, run } = useAction();
  const next = status === "active" ? "inactive" : "active";
  return (
    <span className="inline-action">
      <button
        className="button button-secondary button-small"
        disabled={busy}
        onClick={() => void run({ action: "planStatus", planId, status: next })}
      >
        {status === "active" ? "Turn off" : "Turn on"}
      </button>
      <Message text={message} />
    </span>
  );
}

export function CycleStartForm({
  organizationId,
  cycleStart,
}: {
  organizationId: string;
  cycleStart: string;
}) {
  const { busy, message, run } = useAction();
  return (
    <form
      className="billing-inline-form"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void run({
          action: "cycleStart",
          organizationId,
          startDate: String(data.get("startDate")),
        });
      }}
    >
      <label className="field">
        First day listed in the app
        <input
          type="date"
          name="startDate"
          required
          defaultValue={cycleStart}
          max={baghdadToday()}
        />
      </label>
      <button className="button button-secondary" disabled={busy}>
        {busy ? "Saving…" : "Change start day"}
      </button>
      <Message text={message} />
    </form>
  );
}

interface PlanOption {
  id: string;
  displayName: string;
  commissionAmountIqd: number;
  status: "active" | "inactive";
}
const planLabel = (plan: PlanOption) =>
  `${plan.displayName} · ${plan.commissionAmountIqd === 0 ? "free" : `${plan.commissionAmountIqd.toLocaleString("en-IQ")} IQD per visit`}`;

export function OrganizationPlanForm({
  organizationId,
  plans,
  currentPlanId,
}: {
  organizationId: string;
  plans: readonly PlanOption[];
  currentPlanId: string | null;
}) {
  const { busy, message, run } = useAction();
  const active = plans.filter((plan) => plan.status === "active");
  return (
    <form
      className="billing-inline-form"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void run({
          action: "organizationPlan",
          organizationId,
          planId: String(data.get("planId")),
          from: String(data.get("from")),
        });
      }}
    >
      <label className="field">
        Plan
        <select name="planId" required defaultValue={currentPlanId ?? ""}>
          {active.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {planLabel(plan)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        From
        <input
          type="date"
          name="from"
          required
          defaultValue={baghdadToday()}
          min={baghdadToday()}
        />
      </label>
      <button className="button button-secondary" disabled={busy}>
        {busy ? "Saving…" : "Change plan"}
      </button>
      <Message text={message} />
    </form>
  );
}

export function DoctorPlanForm({
  organizationId,
  doctorId,
  plans,
  ownPlanId,
}: {
  organizationId: string;
  doctorId: string;
  plans: readonly PlanOption[];
  ownPlanId: string | null;
}) {
  const { busy, message, run } = useAction();
  const active = plans.filter((plan) => plan.status === "active");
  return (
    <form
      className="billing-inline-form compact"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const planId = String(data.get("planId"));
        void run({
          action: "doctorPlan",
          organizationId,
          doctorId,
          planId: planId || null,
          from: String(data.get("from")),
        });
      }}
    >
      <select name="planId" aria-label="Plan" defaultValue={ownPlanId ?? ""}>
        <option value="">Same as the clinic</option>
        {active.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {planLabel(plan)}
          </option>
        ))}
      </select>
      <input
        type="date"
        name="from"
        aria-label="From"
        required
        defaultValue={baghdadToday()}
        min={baghdadToday()}
      />
      <button className="button button-secondary button-small" disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </button>
      <Message text={message} />
    </form>
  );
}

export function CreditButton({
  commissionId,
  reference,
  amountIqd,
}: {
  commissionId: string;
  reference: string;
  amountIqd: number;
}) {
  const { busy, message, run } = useAction();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    dialog.current?.close();
    trigger.current?.focus();
  };
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="button button-secondary button-small"
        onClick={() => dialog.current?.showModal()}
      >
        Credit
      </button>
      <dialog ref={dialog} aria-label={`Credit ${reference}`}>
        <section className="dialog-content">
          <h2>Credit {reference}?</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void run(
                {
                  action: "credit",
                  commissionId,
                  reason: String(data.get("reason") ?? "").trim(),
                },
                close,
              );
            }}
          >
            <p>
              Removes {amountIqd.toLocaleString("en-IQ")} IQD from this
              doctor&apos;s open statement. The reason is shown on the statement
              and kept in the audit log.
            </p>
            <label className="field">
              Reason
              <textarea name="reason" required maxLength={500} rows={3} />
            </label>
            <Message text={message} />
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={close}
              >
                Cancel
              </button>
              <button className="button button-primary" disabled={busy}>
                {busy ? "Saving…" : "Credit charge"}
              </button>
            </div>
          </form>
        </section>
      </dialog>
    </>
  );
}

export function SettleStatementForm({
  statement,
}: {
  statement: {
    organizationId: string;
    doctorId: string;
    doctorName: string;
    cycleNumber: number;
    statementNumber: string;
    netPayableIqd: number;
  };
}) {
  const { busy, message, run } = useAction();
  const doctorPays = statement.netPayableIqd < 0;
  const amount = `${Math.abs(statement.netPayableIqd).toLocaleString("en-IQ")} IQD`;
  const [method, setMethod] = useState<"fib" | "cash">(
    doctorPays ? "cash" : "fib",
  );
  return (
    <form
      className="card settle-form no-print"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const text = (name: string) =>
          String(data.get(name) ?? "").trim() || undefined;
        void run({
          action: "settle",
          organizationId: statement.organizationId,
          doctorId: statement.doctorId,
          cycleNumber: statement.cycleNumber,
          method,
          expectedNetPayableIqd: statement.netPayableIqd,
          reference: text("reference"),
          counterpartyName: text("counterpartyName"),
          note: text("note"),
        });
      }}
    >
      <h2>
        {statement.netPayableIqd === 0
          ? "Close this statement"
          : doctorPays
            ? `Record cash received from ${statement.doctorName}`
            : `Record payment to ${statement.doctorName}`}
      </h2>
      <p className="muted">
        {statement.netPayableIqd === 0
          ? "Nothing is owed either way. Closing it locks the statement."
          : doctorPays
            ? `${statement.doctorName} pays Saxlem ${amount} in cash, in person. Record it once you have the money.`
            : `Saxlem pays ${statement.doctorName} ${amount}, by FIB transfer or in cash.`}
      </p>
      {!doctorPays && statement.netPayableIqd !== 0 && (
        <fieldset className="method-choice">
          <legend>How</legend>
          <label>
            <input
              type="radio"
              name="method"
              checked={method === "fib"}
              onChange={() => setMethod("fib")}
            />
            FIB transfer
          </label>
          <label>
            <input
              type="radio"
              name="method"
              checked={method === "cash"}
              onChange={() => setMethod("cash")}
            />
            Cash
          </label>
        </fieldset>
      )}
      <div className="billing-form-row">
        <label className="field">
          {method === "fib"
            ? "FIB transfer reference"
            : "Receipt number (optional)"}
          <input name="reference" maxLength={120} required={method === "fib"} />
        </label>
        {method === "cash" && (
          <label className="field">
            {doctorPays ? "Paid by" : "Received by"}
            <input
              name="counterpartyName"
              maxLength={120}
              placeholder={
                doctorPays ? statement.doctorName : "Name at the clinic"
              }
            />
          </label>
        )}
      </div>
      <label className="field">
        Note (optional)
        <input name="note" maxLength={500} />
      </label>
      <Message text={message} />
      <div className="form-actions">
        <button className="button button-primary" disabled={busy}>
          {busy
            ? "Saving…"
            : statement.netPayableIqd === 0
              ? "Close statement"
              : doctorPays
                ? `Cash received: ${amount}`
                : `Paid: ${amount}`}
        </button>
      </div>
    </form>
  );
}

export function PrintButton({
  label = "Print or save as PDF",
}: {
  label?: string;
}) {
  return (
    <button
      type="button"
      className="button button-primary no-print"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}

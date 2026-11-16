import type { Locale } from "@/i18n";
import type { BackendPayment } from "../data/backend-payment-repository";
import { paymentMessages, paymentTone } from "./messages";
import { RecordCounterPayment } from "./record-counter-payment";

export function formatIqd(locale: Locale, amount: number) {
  return `${new Intl.NumberFormat(locale).format(amount)} IQD`;
}

/** Payment status on the appointment page, with "Mark as paid" for reception. */
export function PaymentSection({
  payment,
  locale,
  appointmentId,
  appointmentStatus,
  failed,
}: {
  payment?: BackendPayment;
  locale: Locale;
  appointmentId: string;
  appointmentStatus: string;
  failed?: boolean;
}) {
  const m = paymentMessages(locale);
  if (!payment)
    return failed ? (
      <section className="section payment-card" aria-labelledby="payment-title">
        <h2 id="payment-title">{m.payment}</h2>
        <p className="muted">{m.unavailable}</p>
      </section>
    ) : null;
  const settled = [
      "paid",
      "refundPending",
      "refunded",
      "refundFailed",
    ].includes(payment.status),
    canRecord =
      !settled &&
      ["scheduled", "confirmed", "completed"].includes(appointmentStatus),
    amount = formatIqd(locale, payment.amountIqd);
  return (
    <section className="section payment-card" aria-labelledby="payment-title">
      <div className="payment-head">
        <h2 id="payment-title">{m.payment}</h2>
        <span className={`pill ${paymentTone(payment.status)}`}>
          {m[payment.status]}
        </span>
      </div>
      <dl className="payment-facts">
        <div>
          <dt>{m.amount}</dt>
          <dd>
            <bdi>{amount}</bdi>
          </dd>
        </div>
        <div>
          <dt>{m.method}</dt>
          <dd>{payment.method === "online" ? m.online : m.counter}</dd>
        </div>
        {payment.paidAt && (
          <div>
            <dt>{m.paidAt}</dt>
            <dd>
              {new Intl.DateTimeFormat(locale, {
                timeZone: "Asia/Baghdad",
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(payment.paidAt))}
            </dd>
          </div>
        )}
      </dl>
      {payment.status === "pending" && <p className="muted">{m.pendingHint}</p>}
      {payment.status === "refundFailed" && (
        <p className="payment-warning" role="status">
          {m.refundFailedHint}
        </p>
      )}
      {canRecord && (
        <RecordCounterPayment
          appointmentId={appointmentId}
          amountLabel={amount}
          m={m}
        />
      )}
    </section>
  );
}

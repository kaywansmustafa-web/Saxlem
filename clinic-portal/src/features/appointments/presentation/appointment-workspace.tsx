import Link from "next/link";
import type { Locale } from "@/i18n";
import type { BackendAppointment } from "../data/backend-appointment-repository";
import type { ClinicalMessages } from "@/features/clinical-presentation/messages";
import { AppointmentMutations } from "./appointment-mutations";
import type { BackendArrival } from "@/features/arrivals/data/backend-arrival-repository";
import type { ArrivalMessages } from "@/features/arrivals/presentation/messages";
import type { BackendPayment } from "@/features/payments/data/backend-payment-repository";
import { PaymentSection } from "@/features/payments/presentation/payment-section";
import { bookingMessages, originLabel } from "./booking-messages";

export function AppointmentWorkspace({
  appointment: a,
  locale,
  m,
  arrival,
  arrivalError,
  arrivalMessages: am,
  payment,
  paymentError,
}: {
  payment?: BackendPayment;
  paymentError?: boolean;
  appointment: BackendAppointment;
  locale: Locale;
  m: ClinicalMessages;
  arrival?: BackendArrival;
  arrivalError?: boolean;
  arrivalMessages?: ArrivalMessages;
}) {
  return (
    <>
      <Link className="back-link" href={`/${locale}/appointments`}>
        {m.backAppointments}
      </Link>
      <header className="heading">
        <p className="eyebrow">{m.appointmentDetails}</p>
        <h1>{a.patientName}</h1>
        <p>
          <bdi>{a.reference}</bdi>
        </p>
      </header>
      <section className="section">
        <h2>{m.appointmentDetails}</h2>
        <dl className="clinical-detail-grid">
          {[
            [
              m.date,
              new Intl.DateTimeFormat(locale, {
                timeZone: "Asia/Baghdad",
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(a.startsAt)),
            ],
            [m.doctor, a.doctorName],
            [m.clinic, a.clinicName],
            [m.status, m[a.status]],
            [
              bookingMessages(locale).source,
              originLabel(a.origin, bookingMessages(locale)) ?? "-",
            ],
            [m.reason, a.reason],
            [m.duration, `${a.durationMinutes}`],
            [m.fee, new Intl.NumberFormat(locale).format(a.feeIqd) + " IQD"],
            [m.reference, a.reference],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <Link
          className="link"
          href={`/${locale}/patients/${a.patientProfileId}`}
        >
          {m.patientDetails}
        </Link>
      </section>
      <PaymentSection
        payment={payment}
        failed={paymentError}
        locale={locale}
        appointmentId={a.id}
        appointmentStatus={a.status}
      />
      {am && (
        <section className="section" aria-labelledby="arrival-state">
          <h2 id="arrival-state">{am.arrival}</h2>
          {arrival ? (
            <>
              <p>
                <strong>{am.arrivalStatus}:</strong> {am[arrival.status]}
              </p>
              <p>{am.queueSeparate}</p>
              <Link
                className="link"
                href={`/${locale}/appointments/${a.id}/arrival`}
              >
                {am.openArrival}
              </Link>
            </>
          ) : arrivalError ? (
            <div role="alert">
              <p>{am.partialError}</p>
              <Link href={`/${locale}/appointments/${a.id}`}>{am.retry}</Link>
            </div>
          ) : null}
        </section>
      )}
      {!["cancelled", "completed", "noShow"].includes(a.status) && (
        <AppointmentMutations appointment={a} m={m} />
      )}
    </>
  );
}

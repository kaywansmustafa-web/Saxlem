import Link from "next/link";
import type { Locale } from "@/i18n";
import { fmt } from "@/i18n";
import type { DoctorPatientsProjection } from "../domain/models";
import type { DoctorPatientsMessages } from "./messages";

export function DoctorPatientsView({
  data,
  locale,
  m,
}: {
  data: DoctorPatientsProjection;
  locale: Locale;
  m: DoctorPatientsMessages;
}) {
  const stateLabel =
    data.sessionState === "active"
      ? m.active
      : data.sessionState === "paused"
        ? m.paused
        : m.finished;

  return (
    <div className="doctor-patients">
      <header className="heading">
        <p className="eyebrow">{m.eyebrow}</p>
        <h1>{m.title}</h1>
        <p>{m.subtitle}</p>
      </header>

      <section className="section doctor-section compact">
        <div className="section-head">
          <h2>{m.sessionSummary}</h2>
        </div>

        <dl className="doctor-session-status">
          <Metric label={m.doctor} value={data.doctorName} />
          <Metric label={m.clinic} value={data.clinicName} />
          <Metric label={m.room} value={data.room} />
          <Metric label={m.sessionState} value={stateLabel} />
          <Metric
            label={m.visiblePatients}
            value={String(data.totalVisible)}
          />
        </dl>
      </section>

      <section className="section doctor-section dominant">
        <div className="section-head">
          <h2>{m.currentPatient}</h2>
        </div>

        {data.current ? (
          <article className="doctor-current">
            <div className="doctor-current-name">
              <span>
                {m.patientId} · <bdi>{data.current.patientId}</bdi>
              </span>
              <h2>{data.current.name}</h2>
              <p>{fmt(m.years, { age: data.current.age })}</p>
            </div>

            <strong className="doctor-queue-number">
              <span>{m.queueNumber}</span>
              {data.current.queueNumber}
            </strong>

            <dl>
              <Metric
                label={m.appointmentTime}
                value={data.current.appointmentTime}
              />
              <Metric
                label={m.appointmentType}
                value={data.current.appointmentType}
              />
              <Metric
                label={m.arrivalState}
                value={data.current.arrivalState}
              />
              <Metric
                label={m.importantNote}
                value={data.current.importantNote}
              />
            </dl>

            <div className="doctor-current-actions">
              <Link href={`/${locale}/patients/${data.current.patientId}`}>
                {m.openPatient}
              </Link>
              <Link
                href={`/${locale}/appointments/${data.current.appointmentId}`}
              >
                {m.openAppointment}
              </Link>
            </div>
          </article>
        ) : (
          <SafeState title={m.noCurrent} body={m.noCurrentBody} />
        )}
      </section>

      <section className="section doctor-section">
        <div className="section-head">
          <h2>{m.nextPatients}</h2>
        </div>

        {data.next.length ? (
          <div className="doctor-next-list">
            {data.next.map((patient) => (
              <article key={patient.appointmentId}>
                <strong className="queue-list-number">
                  {patient.queueNumber}
                </strong>

                <div>
                  <h3>{patient.name}</h3>
                  <p>
                    {patient.appointmentTime} · {patient.arrivalState} ·{" "}
                    {fmt(m.minutes, {
                      minutes: patient.estimatedWaitMinutes,
                    })}
                  </p>
                </div>

                <div className="doctor-current-actions">
                  <Link href={`/${locale}/patients/${patient.patientId}`}>
                    {m.openPatient}
                  </Link>
                  <Link
                    href={`/${locale}/appointments/${patient.appointmentId}`}
                  >
                    {m.openAppointment}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <SafeState title={m.noNext} body={m.noNextBody} />
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function SafeState({ title, body }: { title: string; body: string }) {
  return (
    <div className="doctor-safe-state">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

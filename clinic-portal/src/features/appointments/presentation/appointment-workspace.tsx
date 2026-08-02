import Link from "next/link";
import type { Locale } from "@/i18n";
import type { BackendAppointment } from "../data/backend-appointment-repository";
import type { ClinicalMessages } from "@/features/clinical-presentation/messages";
import { AppointmentMutations } from "./appointment-mutations";

export function AppointmentWorkspace({ appointment:a, locale, m }: { appointment: BackendAppointment; locale: Locale; m: ClinicalMessages }) {
  return <><Link className="back-link" href={`/${locale}/appointments`}>{m.backAppointments}</Link><header className="heading"><p className="eyebrow">{m.appointmentDetails}</p><h1>{a.patientName}</h1><p><bdi>{a.reference}</bdi></p></header><section className="section"><h2>{m.appointmentDetails}</h2><dl className="clinical-detail-grid">{[[m.date,new Date(a.startsAt).toLocaleString(locale)],[m.doctor,a.doctorName],[m.clinic,a.clinicName],[m.status,m[a.status]],[m.reason,a.reason],[m.duration,`${a.durationMinutes}`],[m.fee,new Intl.NumberFormat(locale).format(a.feeIqd)+" IQD"],[m.reference,a.reference]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><Link className="link" href={`/${locale}/patients/${a.patientProfileId}`}>{m.patientDetails}</Link></section>{!["cancelled","completed","noShow"].includes(a.status)&&<AppointmentMutations appointment={a} m={m}/>}</>;
}

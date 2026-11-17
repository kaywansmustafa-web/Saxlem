import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { ClinicalState } from "@/features/clinical-presentation/clinical-state";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
import { iraqCalendarDate } from "@/features/appointments/domain/appointment-filter-contract";
import { bookingMessages } from "@/features/appointments/presentation/booking-messages";
import { NewBooking } from "@/features/appointments/presentation/new-booking";

/** Phone booking (?mode=phone, default) or walk-in (?mode=walkIn). */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const mode = query.mode === "walkIn" ? "walkIn" : "phone";
  const text = (value: unknown, pattern: RegExp) =>
    typeof value === "string" && pattern.test(value) ? value : undefined;
  const preset = {
    doctorId: text(query.doctorId, /^[0-9a-f-]{36}$/i),
    date: text(query.date, /^\d{4}-\d{2}-\d{2}$/),
    startsAt: text(
      query.startsAt,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
    ),
  };
  const m = bookingMessages(locale);
  let doctors;
  try {
    const composition = await clinicalComposition(locale);
    doctors = await composition.queueDoctors.list(composition.context.clinicId);
  } catch {
    return <ClinicalState kind="backendError" m={clinicalMessages(locale)} />;
  }
  return (
    <>
      <header className="heading booking-heading">
        <Link className="link" href={`/${locale}/appointments/board`}>
          {m.dayBoard}
        </Link>
        <h1>{mode === "walkIn" ? m.walkInTitle : m.phoneTitle}</h1>
        <p>{mode === "walkIn" ? m.walkInHelp : m.phoneHelp}</p>
        <nav className="booking-mode" aria-label={m.newBooking}>
          <Link
            href={`/${locale}/appointments/new?mode=phone`}
            aria-current={mode === "phone" ? "page" : undefined}
          >
            {m.newBooking}
          </Link>
          <Link
            href={`/${locale}/appointments/new?mode=walkIn`}
            aria-current={mode === "walkIn" ? "page" : undefined}
          >
            {m.walkIn}
          </Link>
        </nav>
      </header>
      <NewBooking
        key={mode}
        mode={mode}
        doctors={doctors}
        today={iraqCalendarDate(new Date())}
        timezone="Asia/Baghdad"
        locale={locale}
        m={m}
        preset={preset}
      />
    </>
  );
}

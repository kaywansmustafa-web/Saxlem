import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { appointmentStatusSchema } from "@/features/appointments/data/backend-appointment-repository";
import { AppointmentsPage } from "@/features/appointments/presentation/appointments-page";
import { ClinicalState } from "@/features/clinical-presentation/clinical-state";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
import {
  iraqDateRange,
  parseAppointmentNavigation,
} from "@/features/appointments/domain/appointment-filter-contract";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const q = await searchParams,
    m = clinicalMessages(locale),
    range = iraqDateRange(q.from, q.to),
    status = appointmentStatusSchema.safeParse(q.status).success
      ? appointmentStatusSchema.parse(q.status)
      : undefined,
    navigation = parseAppointmentNavigation(q.cursor, q.trail);
  if (!range.ok || !navigation.ok)
    return (
      <AppointmentsPage
        page={{ items: [], nextCursor: null }}
        locale={locale}
        m={m}
        filters={{ from: range.from, to: range.to, trail: [] }}
        validationMessage={!range.ok ? m.dateRangeInvalid : m.validation}
      />
    );
  const { from, to, fromInstant, toInstant } = range,
    { cursor, trail } = navigation;
  let page;
  try {
    const { appointments } = await clinicalComposition(locale);
    page = await appointments.list({
      from: fromInstant,
      to: toInstant,
      status,
      cursor,
    });
  } catch (error) {
    return <ClinicalState kind={kind(error)} m={m} />;
  }
  return (
    <AppointmentsPage
      page={page}
      locale={locale}
      m={m}
      filters={{ from, to, status, cursor, trail }}
    />
  );
}
const kind = (
  error: unknown,
): "offline" | "unauthorized" | "forbidden" | "notFound" | "backendError" =>
  error instanceof PortalApiError
    ? error.detail.kind === "offline" || error.detail.kind === "timeout"
      ? "offline"
      : error.detail.kind === "unauthorized"
        ? "unauthorized"
        : error.detail.kind === "forbidden"
          ? "forbidden"
          : error.detail.status === 404
            ? "notFound"
            : "backendError"
    : "backendError";

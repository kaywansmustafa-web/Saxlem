import type { DoctorSchedule } from "@/infrastructure/doctor-composition";
import type { WorkdayMessages } from "./messages";

type ClinicSchedule = DoctorSchedule["clinics"][number];
type Period = { weekday: number; startsAt: string; endsAt: string };

const range = (period: Period) =>
  period.startsAt === "00:00" && period.endsAt === "24:00" ? null : `${period.startsAt}–${period.endsAt}`;

/** A doctor's week at a glance: hours, breaks and days off, today highlighted. */
export function WeeklyHours({ m, clinic, todayWeekday }: { m: WorkdayMessages; clinic: ClinicSchedule; todayWeekday: number }) {
  const hours = (clinic.weeklyWorkingHours ?? []) as Period[],
    breaks = (clinic.breaks ?? []) as Period[];
  return (
    <ul className="ax-week">
      {m.weekdays.map((name, weekday) => {
        const today = hours.filter((p) => p.weekday === weekday),
          pauses = breaks.filter((p) => p.weekday === weekday);
        return (
          <li key={name} className={`${weekday === todayWeekday ? "is-today" : ""} ${today.length ? "" : "is-off"}`}>
            <span className="ax-week-day">{name}</span>
            <span className="ax-week-hours">
              {today.length === 0 ? (
                <span className="ax-chip is-muted">{m.dayOff}</span>
              ) : (
                today.map((p) => (
                  <span key={`${p.startsAt}-${p.endsAt}`} className="ax-week-range">
                    {range(p) ?? m.allDay}
                  </span>
                ))
              )}
              {pauses.map((p) => (
                <span key={`b-${p.startsAt}`} className="ax-chip is-soft">
                  {m.breakLabel} {range(p)}
                </span>
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

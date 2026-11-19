"use client";
import {
  type Period,
  copyToEveryDay,
  fromTime,
  inputTime,
  nextPeriod,
  toTime,
  weekOrder,
} from "../domain/week";
import type { DoctorSettingsMessages } from "./messages";

/** One week of time ranges: each day can have several (09:00–13:00, 16:00–20:00). */
export function WeekEditor({
  label,
  periods,
  onChange,
  idPrefix,
  weekdays,
  m,
  emptyLabel,
  newPeriod = [540, 1020],
}: {
  label: string;
  periods: Period[];
  onChange: (next: Period[]) => void;
  idPrefix: string;
  weekdays: readonly string[];
  m: DoctorSettingsMessages;
  emptyLabel: string;
  newPeriod?: readonly [number, number];
}) {
  const set = (index: number, patch: Partial<Period>) =>
    onChange(periods.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  return (
    <fieldset className="ds-week">
      <legend>{label}</legend>
      {weekOrder.map((day) => {
        const name = weekdays[day] ?? "";
        const rows = periods
          .map((p, index) => ({ p, index }))
          .filter(({ p }) => p.weekday === day)
          .sort((a, b) => a.p.startsMinute - b.p.startsMinute);
        return (
          <div key={day} className="ds-week-day">
            <span className="ds-week-name" id={`${idPrefix}-${day}`}>
              {name}
            </span>
            <div className="ds-week-ranges">
              {rows.length === 0 && (
                <span className="ds-week-empty">{emptyLabel}</span>
              )}
              {rows.map(({ p, index }) => (
                <span key={index} className="ds-range">
                  <input
                    type="time"
                    step={300}
                    aria-label={m.fromLabel(name)}
                    value={inputTime(p.startsMinute)}
                    onChange={(e) => {
                      const minutes = fromTime(e.target.value);
                      if (minutes !== null)
                        set(index, { startsMinute: minutes });
                    }}
                  />
                  <span aria-hidden="true">–</span>
                  <input
                    type="time"
                    step={300}
                    aria-label={m.untilLabel(name)}
                    value={inputTime(p.endsMinute)}
                    onChange={(e) => {
                      const minutes = fromTime(e.target.value, true);
                      if (minutes !== null) set(index, { endsMinute: minutes });
                    }}
                  />
                  <button
                    type="button"
                    className="ds-link"
                    aria-label={m.removeLabel(
                      name,
                      `${toTime(p.startsMinute)}–${toTime(p.endsMinute)}`,
                    )}
                    onClick={() =>
                      onChange(periods.filter((_, i) => i !== index))
                    }
                  >
                    {m.remove}
                  </button>
                </span>
              ))}
              <span className="ds-week-actions">
                <button
                  type="button"
                  className="ax-btn ds-small"
                  aria-describedby={`${idPrefix}-${day}`}
                  onClick={() =>
                    onChange([...periods, nextPeriod(day, periods, newPeriod)])
                  }
                >
                  {m.add}
                </button>
                {rows.length > 0 && (
                  <button
                    type="button"
                    className="ax-btn ax-btn-ghost ds-small"
                    aria-describedby={`${idPrefix}-${day}`}
                    onClick={() => onChange(copyToEveryDay(periods, day))}
                  >
                    {m.copyToAll}
                  </button>
                )}
              </span>
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}

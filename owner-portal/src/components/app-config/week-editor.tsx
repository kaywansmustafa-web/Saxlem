"use client";
import { type Period, fromTime, toTime, weekOrder, weekdayNames } from "@/domain/week";

/** One week of periods: each day can have several (09:00–13:00, 16:00–20:00). */
export function WeekEditor({
  label,
  periods,
  onChange,
  idPrefix,
  newPeriod = [540, 1020],
  emptyLabel = "Closed",
}: {
  label: string;
  periods: Period[];
  onChange: (next: Period[]) => void;
  idPrefix: string;
  newPeriod?: [number, number];
  emptyLabel?: string;
}) {
  const set = (index: number, patch: Partial<Period>) =>
    onChange(periods.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  return (
    <fieldset className="week-editor">
      <legend>{label}</legend>
      {weekOrder.map((day) => {
        const rows = periods
          .map((p, index) => ({ p, index }))
          .filter(({ p }) => p.weekday === day)
          .sort((a, b) => a.p.startsMinute - b.p.startsMinute);
        return (
          <div key={day} className="week-day">
            <span className="week-day-name" id={`${idPrefix}-${day}`}>
              {weekdayNames[day]}
            </span>
            <div className="week-periods">
              {rows.length === 0 && <span className="muted">{emptyLabel}</span>}
              {rows.map(({ p, index }) => (
                <span key={index} className="week-period">
                  <input
                    type="time"
                    step={300}
                    aria-label={`${weekdayNames[day]} from`}
                    value={toTime(p.startsMinute) === "24:00" ? "00:00" : toTime(p.startsMinute)}
                    onChange={(e) => {
                      const m = fromTime(e.target.value);
                      if (m !== null) set(index, { startsMinute: m });
                    }}
                  />
                  <span aria-hidden="true">–</span>
                  <input
                    type="time"
                    step={300}
                    aria-label={`${weekdayNames[day]} until`}
                    value={toTime(p.endsMinute) === "24:00" ? "00:00" : toTime(p.endsMinute)}
                    onChange={(e) => {
                      const m = fromTime(e.target.value, true);
                      if (m !== null) set(index, { endsMinute: m });
                    }}
                  />
                  <button
                    type="button"
                    className="text-button"
                    aria-label={`Remove ${weekdayNames[day]} ${toTime(p.startsMinute)}–${toTime(p.endsMinute)}`}
                    onClick={() => onChange(periods.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </span>
              ))}
            </div>
            <span className="week-day-actions">
              <button
                type="button"
                className="button button-small"
                aria-describedby={`${idPrefix}-${day}`}
                onClick={() => {
                  const last = rows.at(-1)?.p;
                  const start = last ? Math.min(last.endsMinute + 60, 1380) : newPeriod[0];
                  onChange([
                    ...periods,
                    { weekday: day, startsMinute: start, endsMinute: last ? Math.min(start + 180, 1440) : newPeriod[1] },
                  ]);
                }}
              >
                Add
              </button>
              {rows.length > 0 && (
                <button
                  type="button"
                  className="button button-small"
                  aria-describedby={`${idPrefix}-${day}`}
                  onClick={() =>
                    onChange(
                      weekOrder.flatMap((other) =>
                        other === day
                          ? rows.map(({ p }) => p)
                          : rows.map(({ p }) => ({ ...p, weekday: other })),
                      ),
                    )
                  }
                >
                  Copy to every day
                </button>
              )}
            </span>
          </div>
        );
      })}
    </fieldset>
  );
}

import { describe, expect, it } from "vitest";
import { fromTime, localToIso, outside, summary, toTime, weekProblem } from "@/domain/week";

const p = (weekday: number, from: string, to: string) => ({
  weekday,
  startsMinute: fromTime(from)!,
  endsMinute: fromTime(to, true)!,
});

describe("weekly hours helpers", () => {
  it("reads and writes clock times, midnight as an end", () => {
    expect(fromTime("09:30")).toBe(570);
    expect(fromTime("00:00", true)).toBe(1440);
    expect(fromTime("9:30")).toBeNull();
    expect(toTime(1440)).toBe("24:00");
  });

  it("checks the same rules as the server", () => {
    expect(weekProblem([p(1, "09:00", "13:00"), p(1, "16:00", "20:00")], "hours")).toBeNull();
    expect(weekProblem([p(1, "09:00", "13:00"), p(1, "12:00", "14:00")], "hours")).toBe("Monday: periods overlap.");
    expect(weekProblem([p(2, "13:00", "09:00")], "hours")).toBe("Tuesday: each period must end after it starts.");
    expect(weekProblem([{ weekday: 1, startsMinute: 541, endsMinute: 600 }], "hours")).toMatch(/5-minute/);
    expect(outside([p(1, "08:00", "20:00")], [p(1, "09:00", "13:00"), p(2, "09:00", "13:00")])).toEqual([
      p(2, "09:00", "13:00"),
    ]);
  });

  it("summarises from Saturday, and turns clinic time into an exact moment", () => {
    expect(summary([p(0, "09:00", "13:00"), p(6, "10:00", "12:00")])).toBe("Sat 10:00–12:00 · Sun 09:00–13:00");
    expect(summary([])).toBe("None");
    expect(localToIso("2026-11-20T09:00", "Asia/Baghdad")).toBe("2026-11-20T09:00:00+03:00");
  });
});

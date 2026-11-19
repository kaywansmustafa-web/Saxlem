"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n";
import type { DayBoard as Board } from "../data/backend-appointment-repository";
import { clockFormat, type BookingMessages } from "./booking-messages";

type Slot = Board["doctors"][number]["slots"][number];
type Origin = NonNullable<Slot["appointment"]>["origin"];
interface Picked {
  readonly doctorId: string;
  readonly doctorName: string;
  readonly slot: Slot;
}

const originClass: Record<Origin, string> = {
  patientBooked: "app",
  clinicCreated: "phone",
  walkIn: "walkin",
};

/**
 * Reception's day board: one column per doctor, one row per time. Colour
 * shows how each slot is taken (app, phone, walk-in), white means free.
 * Every cell also carries a text label so colour is never the only cue.
 */
export function DayBoard({
  board,
  live,
  locale,
  m,
}: {
  board: Board;
  /** True for today: the board refreshes itself every 30 seconds. */
  live: boolean;
  locale: Locale;
  m: BookingMessages;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [picked, setPicked] = useState<Picked | null>(null);

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [live, router]);

  const time = useMemo(
    () => clockFormat(locale, board.clinicTimezone),
    [locale, board.clinicTimezone],
  );
  const rows = useMemo(
    () =>
      [
        ...new Set(
          board.doctors.flatMap((doctor) =>
            doctor.slots.map((slot) => slot.startsAt),
          ),
        ),
      ].sort(),
    [board.doctors],
  );
  const cells = useMemo(
    () =>
      board.doctors.map(
        (doctor) =>
          new Map(doctor.slots.map((slot) => [slot.startsAt, slot] as const)),
      ),
    [board.doctors],
  );
  const now = new Date(board.generatedAt).getTime();
  const nowRow = live
    ? rows.find((startsAt) =>
        board.doctors.some((doctor) =>
          doctor.slots.some(
            (slot) =>
              slot.startsAt === startsAt &&
              new Date(slot.startsAt).getTime() <= now &&
              new Date(slot.endsAt).getTime() > now,
          ),
        ),
      )
    : undefined;

  // Open today's board at the current time rather than at midnight.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scroller.current;
    const row = container?.querySelector<HTMLElement>(".board-now");
    if (container && row)
      container.scrollTop = Math.max(0, row.offsetTop - 140);
    // Only on first render of this board; refreshes keep the user's place.
  }, []);

  const open = (value: Picked) => {
    setPicked(value);
    dialog.current?.showModal();
  };
  const bookingHref = (mode: "phone" | "walkIn") => {
    if (!picked) return "#";
    const query = new URLSearchParams({
      mode,
      doctorId: picked.doctorId,
      date: board.date,
      startsAt: picked.slot.startsAt,
    });
    return `/${locale}/appointments/new?${query}`;
  };

  const legend: [string, string][] = [
    ["free", m.legendFree],
    ["app", m.legendApp],
    ["phone", m.legendPhone],
    ["walkin", m.legendWalkIn],
    ["unavailable", m.legendUnavailable],
    ["past", m.legendPast],
  ];

  return (
    <section className="day-board" aria-label={m.dayBoard}>
      <div className="board-toolbar">
        <ul className="board-legend" aria-label={m.legend}>
          {legend.map(([kind, label]) => (
            <li key={kind}>
              <span className={`board-swatch ${kind}`} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
        {live && (
          <p className="board-updated" role="status">
            <span className="board-live-dot" aria-hidden="true" />
            {m.updated.replace(
              "{time}",
              time.format(new Date(board.generatedAt)),
            )}
          </p>
        )}
      </div>

      {board.doctors.length === 0 || rows.length === 0 ? (
        <div className="compact-state" role="status">
          {m.noDoctorsToday}
        </div>
      ) : (
        <div className="board-scroll" ref={scroller}>
          <table
            className="board-grid"
            style={{ ["--doctors" as string]: board.doctors.length }}
          >
            <caption className="visually-hidden">{m.boardTitle}</caption>
            <thead>
              <tr>
                <th scope="col" className="board-time-head">
                  {m.time}
                </th>
                {board.doctors.map((doctor) => (
                  <th scope="col" key={doctor.doctorId}>
                    <span className="board-doctor">{doctor.doctorName}</span>
                    <span className="board-doctor-count">
                      {doctor.slots.filter((s) => s.state === "free").length}{" "}
                      {m.free}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((startsAt) => (
                <tr
                  key={startsAt}
                  className={startsAt === nowRow ? "board-now" : undefined}
                >
                  <th scope="row" className="board-time">
                    <time dateTime={startsAt}>
                      {time.format(new Date(startsAt))}
                    </time>
                    {startsAt === nowRow && (
                      <span className="board-now-tag">{m.now}</span>
                    )}
                  </th>
                  {board.doctors.map((doctor, index) => {
                    const slot = cells[index]!.get(startsAt);
                    return (
                      <td key={doctor.doctorId}>
                        {slot ? (
                          <Cell
                            slot={slot}
                            m={m}
                            locale={locale}
                            time={time}
                            onPick={() =>
                              open({
                                doctorId: doctor.doctorId,
                                doctorName: doctor.doctorName,
                                slot,
                              })
                            }
                          />
                        ) : (
                          <span className="board-cell off">{m.notWorking}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dialog
        ref={dialog}
        aria-labelledby="board-dialog-title"
        onClose={() => setPicked(null)}
      >
        {picked && (
          <>
            <h2 id="board-dialog-title">
              {m.bookThisTime
                .replace("{time}", time.format(new Date(picked.slot.startsAt)))
                .replace("{doctor}", picked.doctorName)}
            </h2>
            <div className="board-choices">
              <Link className="board-choice phone" href={bookingHref("phone")}>
                <span className="board-swatch phone" aria-hidden="true" />
                {m.phoneOption}
              </Link>
              {picked.slot.walkIn ? (
                <Link
                  className="board-choice walkin"
                  href={bookingHref("walkIn")}
                >
                  <span className="board-swatch walkin" aria-hidden="true" />
                  {m.walkInOption}
                </Link>
              ) : (
                <p className="booking-muted">{m.walkInLater}</p>
              )}
            </div>
            <div className="row-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => dialog.current?.close()}
              >
                {m.close}
              </button>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}

function Cell({
  slot,
  m,
  locale,
  time,
  onPick,
}: {
  slot: Slot;
  m: BookingMessages;
  locale: Locale;
  time: { format: (value: Date | string) => string };
  onPick: () => void;
}) {
  if (slot.state === "booked" && slot.appointment) {
    const a = slot.appointment;
    const kind = originClass[a.origin];
    const label =
      a.origin === "patientBooked"
        ? m.legendApp
        : a.origin === "clinicCreated"
          ? m.legendPhone
          : m.legendWalkIn;
    const status =
      a.status === "completed"
        ? m.completedTag
        : a.status === "noShow"
          ? m.noShowTag
          : null;
    return (
      <Link
        className={`board-cell booked ${kind}`}
        href={`/${locale}/appointments/${a.id}`}
      >
        <span className="board-patient">{a.patientName}</span>
        <span className="board-tag">
          {label}
          {status && ` · ${status}`}
        </span>
        {a.onTheWayEta && (
          <span className="board-on-the-way">
            {m.onTheWay.replace("{time}", time.format(a.onTheWayEta))}
          </span>
        )}
      </Link>
    );
  }
  if (slot.state === "free")
    return (
      <button type="button" className="board-cell free" onClick={onPick}>
        <span>{m.free}</span>
        {slot.walkIn && <span className="board-walkin">{m.walkInReady}</span>}
      </button>
    );
  return (
    <span className={`board-cell ${slot.state}`}>
      {slot.state === "unavailable" ? m.legendUnavailable : m.legendPast}
    </span>
  );
}

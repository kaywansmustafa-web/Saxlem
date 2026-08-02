"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n";
import type { PatientDirectoryPage } from "../data/backend-patient-directory-repository";
import type { ClinicalMessages } from "@/features/clinical-presentation/messages";
export function PatientDirectoryPageView({
  page: initialPage = null,
  query: initialQuery = "",
  locale,
  m,
}: {
  page?: PatientDirectoryPage | null;
  query?: string;
  locale: Locale;
  m: ClinicalMessages;
}) {
  const [query, setQuery] = useState(initialQuery),
    [submittedQuery, setSubmittedQuery] = useState(initialQuery),
    [page, setPage] = useState(initialPage),
    [searchBusy, setSearchBusy] = useState(false),
    [paginationBusy, setPaginationBusy] = useState(false),
    [message, setMessage] = useState(initialPage ? "" : m.searchFirst),
    heading = useRef<HTMLHeadingElement>(null),
    requestSequence = useRef(0),
    searchAbort = useRef<AbortController | null>(null),
    paginationLock = useRef(false);
  const search = async () => {
    const submitted = query.trim();
    if (submitted.length < 2) {
      setMessage(m.validation);
      return;
    }
    const requestId = ++requestSequence.current,
      controller = new AbortController();
    searchAbort.current?.abort();
    searchAbort.current = controller;
    setSubmittedQuery(submitted);
    setPage(null);
    setSearchBusy(true);
    setMessage(m.loading);
    try {
      const response = await fetch("/api/patients/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: submitted }),
        signal: controller.signal,
      });
      if (requestId !== requestSequence.current) return;
      if (response.ok) {
        const result = (await response.json()) as {
          page: PatientDirectoryPage;
        };
        setPage(result.page);
        setMessage(result.page.items.length ? "" : m.noPatients);
        queueMicrotask(() => heading.current?.focus());
      } else
        setMessage(
          response.status === 401
            ? m.unauthorized
            : response.status === 403
              ? m.forbidden
              : response.status === 400
                ? m.validation
                : m.backendError,
        );
    } catch (error) {
      if (
        requestId === requestSequence.current &&
        !(error instanceof DOMException && error.name === "AbortError")
      )
        setMessage(m.offline);
    } finally {
      if (requestId === requestSequence.current) setSearchBusy(false);
    }
  };
  const loadMore = async () => {
    if (
      paginationLock.current ||
      searchBusy ||
      !page?.nextCursor ||
      !submittedQuery
    )
      return;
    paginationLock.current = true;
    setPaginationBusy(true);
    const requestId = requestSequence.current,
      cursor = page.nextCursor;
    setMessage(m.loading);
    try {
      const response = await fetch("/api/patients/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: submittedQuery, cursor }),
      });
      if (requestId !== requestSequence.current) return;
      if (response.ok) {
        const result = (await response.json()) as {
          page: PatientDirectoryPage;
        };
        setPage((current) => {
          if (!current) return result.page;
          const unique = new Map(
            current.items.map((item) => [item.patientProfileId, item]),
          );
          for (const item of result.page.items)
            unique.set(item.patientProfileId, item);
          return {
            items: [...unique.values()],
            nextCursor: result.page.nextCursor,
          };
        });
        setMessage("");
      } else
        setMessage(
          response.status === 401
            ? m.unauthorized
            : response.status === 403
              ? m.forbidden
              : response.status === 400
                ? m.validation
                : m.backendError,
        );
    } catch {
      if (requestId === requestSequence.current) setMessage(m.offline);
    } finally {
      paginationLock.current = false;
      setPaginationBusy(false);
    }
  };
  return (
    <>
      <header className="heading">
        <p className="eyebrow">{m.patients}</p>
        <h1>{m.patients}</h1>
        <p>{m.patientHelp}</p>
      </header>
      <form
        role="search"
        className="patient-search"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <label htmlFor="patient-query">{m.search}</label>
        <div className="search-field">
          <input
            id="patient-query"
            name="q"
            type="search"
            minLength={2}
            maxLength={100}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={m.searchHint}
            required
          />
          <button aria-busy={searchBusy} type="submit">
            {searchBusy ? m.loading : m.searchAction}
          </button>
        </div>
      </form>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {page && (
        <section aria-labelledby="patient-results-heading">
          <h2
            ref={heading}
            tabIndex={-1}
            id="patient-results-heading"
            className="visually-hidden"
          >
            {m.patients}
          </h2>
          {page.items.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{m.patient}</th>
                    <th>{m.status}</th>
                    <th>{m.recent}</th>
                    <th>{m.upcoming}</th>
                    <th>{m.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((p) => (
                    <tr key={p.patientProfileId}>
                      <td>{p.displayName}</td>
                      <td>{p.active ? m.active : m.inactive}</td>
                      <td>
                        {p.lastAppointmentAt
                          ? new Date(p.lastAppointmentAt).toLocaleString(locale)
                          : "—"}
                      </td>
                      <td>
                        {p.nextAppointmentAt
                          ? new Date(p.nextAppointmentAt).toLocaleString(locale)
                          : "—"}
                      </td>
                      <td>
                        <Link
                          className="link"
                          href={`/${locale}/patients/${p.patientProfileId}`}
                        >
                          {m.patientDetails}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {page.nextCursor && (
            <button
              disabled={paginationBusy || searchBusy}
              onClick={() => void loadMore()}
            >
              {paginationBusy ? m.loading : m.next}
            </button>
          )}
        </section>
      )}
    </>
  );
}

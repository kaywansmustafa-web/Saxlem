"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { Locale } from "@/i18n";
import {
  clinicPageSchema,
  clinicSchema,
  organizationPageSchema,
  organizationSchema,
  type Clinic,
  type Organization,
} from "../domain/models";
import type { AdministrationMessages } from "./messages";

type Kind = "organizations" | "clinics";
type RecordValue = Organization | Clinic;
type Failure =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "unavailable"
  | "failure";
const uuid = z.string().uuid();
const noControl = /^[^\u0000-\u001f\u007f]*$/u;

async function portalRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, cache: "no-store" });
  } catch {
    throw new Error("unavailable");
  }
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const kind =
      response.status === 401
        ? "unauthorized"
        : response.status === 403
          ? "forbidden"
          : response.status === 404
            ? "notFound"
            : response.status === 409
              ? "conflict"
              : response.status >= 500
                ? "unavailable"
                : "failure";
    throw new Error(kind);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new Error("failure");
  return parsed.data;
}

const pageEnvelope = <T extends z.ZodTypeAny>(page: T) =>
  z.object({ ok: z.literal(true), page }).strict();
const organizationEnvelope = z
  .object({ ok: z.literal(true), organization: organizationSchema })
  .strict();
const clinicEnvelope = z
  .object({ ok: z.literal(true), clinic: clinicSchema })
  .strict();

export function AdministrationOverview({
  locale,
  m,
}: {
  locale: Locale;
  m: AdministrationMessages;
}) {
  const cards = [
    [
      m.organizations,
      m.organizationsHelp,
      `/${locale}/administration/organizations`,
      m.openOrganizations,
    ],
    [
      m.clinics,
      m.clinicsHelp,
      `/${locale}/administration/clinics`,
      m.openClinics,
    ],
  ] as const;
  return (
    <div className="administration-page">
      <PageHeading title={m.administration} help={m.administrationHelp} />
      <div className="administration-overview">
        {cards.map(([title, help, href, action]) => (
          <section className="administration-card" key={href}>
            <h2>{title}</h2>
            <p>{help}</p>
            <Link className="admin-link" href={href}>
              {action}
            </Link>
          </section>
        ))}
      </div>
      <nav className="administration-actions" aria-label={m.onboarding}>
        <Link
          className="admin-primary"
          href={`/${locale}/administration/organizations/new`}
        >
          {m.createOrganization}
        </Link>
        <Link
          className="admin-secondary"
          href={`/${locale}/administration/clinics/new`}
        >
          {m.onboardClinic}
        </Link>
      </nav>
    </div>
  );
}

export function AdministrationList({
  kind,
  locale,
  m,
}: {
  kind: Kind;
  locale: Locale;
  m: AdministrationMessages;
}) {
  const search = useSearchParams();
  const organizationId =
    kind === "clinics" ? search.get("organizationId") : null;
  const [items, setItems] = useState<RecordValue[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [state, setState] = useState<"loading" | "ready" | "failure">("loading"),
    [failure, setFailure] = useState<Failure>("failure"),
    [loadingMore, setLoadingMore] = useState(false),
    [moreFailure, setMoreFailure] = useState(false);
  const generation = useRef(0);
  const load = useCallback(
    async (next?: string) => {
      const current = ++generation.current;
      if (next) setLoadingMore(true);
      else setState("loading");
      setMoreFailure(false);
      const query = new URLSearchParams({ pageSize: "25" });
      if (next) query.set("cursor", next);
      if (organizationId) query.set("organizationId", organizationId);
      try {
        const schema =
          kind === "organizations"
            ? pageEnvelope(organizationPageSchema)
            : pageEnvelope(clinicPageSchema);
        const result = await portalRequest(
          `/api/administration/${kind}?${query}`,
          schema,
        );
        if (current !== generation.current) return;
        const page = result.page as {
          items: RecordValue[];
          nextCursor: string | null;
        };
        setItems((previous) =>
          next
            ? [
                ...new Map(
                  [...previous, ...page.items].map((item) => [item.id, item]),
                ).values(),
              ]
            : page.items,
        );
        setCursor(page.nextCursor);
        setState("ready");
      } catch (error) {
        if (current !== generation.current) return;
        const value =
          error instanceof Error ? (error.message as Failure) : "failure";
        if (value === "unauthorized") {
          setItems([]);
          setCursor(null);
          setFailure(value);
          setState("failure");
        } else if (next) {
          setMoreFailure(true);
        } else {
          setFailure(value);
          setState("failure");
        }
      } finally {
        if (current === generation.current) setLoadingMore(false);
      }
    },
    [kind, organizationId],
  );
  useEffect(() => {
    queueMicrotask(() => {
      setItems([]);
      setCursor(null);
      void load();
    });
    return () => {
      generation.current += 1;
    };
  }, [load]);
  const title = kind === "organizations" ? m.organizations : m.clinics,
    help = kind === "organizations" ? m.organizationsHelp : m.clinicsHelp;
  if (state === "loading")
    return (
      <AdminState
        text={
          kind === "organizations" ? m.loadingOrganizations : m.loadingClinics
        }
        loading
      />
    );
  if (state === "failure")
    return (
      <AdminState
        text={messageFor(failure, m)}
        action={m.retry}
        onAction={() => void load()}
      />
    );
  return (
    <div className="administration-page">
      <PageHeading
        title={title}
        help={help}
        action={
          <Link
            className="admin-primary"
            href={`/${locale}/administration/${kind}/new${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`}
          >
            {kind === "organizations" ? m.createOrganization : m.onboardClinic}
          </Link>
        }
      />
      {items.length === 0 ? (
        <AdminState
          text={kind === "organizations" ? m.noOrganizations : m.noClinics}
        />
      ) : (
        <div className="administration-grid">
          {items.map((item) => (
            <EntityCard
              key={item.id}
              item={item}
              kind={kind}
              locale={locale}
              m={m}
            />
          ))}
        </div>
      )}
      {moreFailure && (
        <p className="admin-inline-error" role="alert">
          {m.unavailable}
        </p>
      )}{" "}
      {cursor && (
        <button
          className="admin-secondary load-more"
          disabled={loadingMore}
          onClick={() => void load(cursor)}
        >
          {loadingMore ? m.loading : m.loadMore}
        </button>
      )}
    </div>
  );
}

export function AdministrationDetail({
  kind,
  locale,
  m,
  id,
}: {
  kind: Kind;
  locale: Locale;
  m: AdministrationMessages;
  id: string;
}) {
  const search = useSearchParams();
  const [record, setRecord] = useState<RecordValue | null>(null),
    [state, setState] = useState<"loading" | "ready" | "failure">("loading"),
    [failure, setFailure] = useState<Failure>("failure");
  const generation = useRef(0);
  const load = useCallback(async () => {
    const current = ++generation.current;
    if (!uuid.safeParse(id).success) {
      setFailure("notFound");
      setState("failure");
      return;
    }
    setRecord(null);
    setState("loading");
    try {
      if (kind === "organizations") {
        const result = await portalRequest(
          `/api/administration/organizations/${id}`,
          organizationEnvelope,
        );
        if (current !== generation.current) return;
        setRecord(result.organization);
      } else {
        const result = await portalRequest(
          `/api/administration/clinics/${id}`,
          clinicEnvelope,
        );
        if (current !== generation.current) return;
        setRecord(result.clinic);
      }
      if (current !== generation.current) return;
      setState("ready");
    } catch (error) {
      if (current !== generation.current) return;
      setFailure(
        error instanceof Error ? (error.message as Failure) : "failure",
      );
      setState("failure");
    }
  }, [id, kind]);
  useEffect(() => {
    queueMicrotask(() => void load());
    return () => {
      generation.current += 1;
    };
  }, [load]);
  if (state === "loading") return <AdminState text={m.loading} loading />;
  if (state === "failure" || !record)
    return (
      <AdminState
        text={messageFor(failure, m)}
        action={failure === "notFound" ? undefined : m.retry}
        onAction={() => void load()}
      />
    );
  const clinic = kind === "clinics" ? (record as Clinic) : null;
  return (
    <div className="administration-page">
      {search.get("created") === "true" && (
        <p className="admin-success" role="status">
          {kind === "organizations" ? m.organizationCreated : m.clinicCreated}
        </p>
      )}
      <Link className="admin-back" href={`/${locale}/administration/${kind}`}>
        {kind === "organizations" ? m.backToOrganizations : m.backToClinics}
      </Link>
      <PageHeading
        title={record.name}
        help={kind === "organizations" ? m.organization : m.clinic}
      />
      <dl className="administration-details">
        <Meta label={m.status}>
          <Status value={record.status} m={m} />
        </Meta>
        {clinic && (
          <>
            <Meta label={m.clinicCode}>
              <bdi>{clinic.code}</bdi>
            </Meta>
            <Meta label={m.timezone}>
              <bdi>{clinic.timezone}</bdi>
            </Meta>
            <Meta label={m.organization}>
              <bdi>{clinic.organizationId}</bdi>
            </Meta>
          </>
        )}
        <Meta label={m.created}>
          <time dateTime={record.createdAt}>
            {formatDate(record.createdAt, locale)}
          </time>
        </Meta>
        <Meta label={m.updated}>
          <time dateTime={record.updatedAt}>
            {formatDate(record.updatedAt, locale)}
          </time>
        </Meta>
        <Meta label={m.identifier}>
          <bdi>{record.id}</bdi>
        </Meta>
      </dl>
      {kind === "organizations" && (
        <nav className="administration-actions">
          <Link
            className="admin-secondary"
            href={`/${locale}/administration/clinics?organizationId=${record.id}`}
          >
            {m.clinicsInOrganization}
          </Link>
          <Link
            className="admin-primary"
            href={`/${locale}/administration/clinics/new?organizationId=${record.id}`}
          >
            {m.onboardClinic}
          </Link>
        </nav>
      )}
    </div>
  );
}

export function AdministrationCreateForm({
  kind,
  locale,
  m,
}: {
  kind: "organization" | "clinic";
  locale: Locale;
  m: AdministrationMessages;
}) {
  const router = useRouter(),
    search = useSearchParams(),
    formRef = useRef<HTMLFormElement>(null),
    summaryRef = useRef<HTMLDivElement>(null),
    attempt = useRef<{ fingerprint: string; id: string } | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]),
    [organizationState, setOrganizationState] = useState<
      "loading" | "ready" | "failure" | "incomplete"
    >(kind === "clinic" ? "loading" : "ready"),
    [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null),
    [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}),
    [codePreview, setCodePreview] = useState("");
  const preselected = search.get("organizationId") ?? "";
  useEffect(() => {
    if (kind !== "clinic") return;
    let active = true;
    (async () => {
      try {
        const items: Organization[] = [];
        let cursor: string | null = null;
        const seenCursors = new Set<string>();
        for (let page = 0; page < 20; page += 1) {
          const query = new URLSearchParams({ pageSize: "100" });
          if (cursor) query.set("cursor", cursor);
          const result = await portalRequest(
            `/api/administration/organizations?${query}`,
            pageEnvelope(organizationPageSchema),
          );
          items.push(...result.page.items);
          cursor = result.page.nextCursor;
          if (!cursor) break;
          if (seenCursors.has(cursor)) throw new Error("stale cursor");
          seenCursors.add(cursor);
        }
        if (cursor) {
          if (active) setOrganizationState("incomplete");
          return;
        }
        if (!active) return;
        setOrganizations([
          ...new Map(items.map((item) => [item.id, item])).values(),
        ]);
        setOrganizationState("ready");
      } catch {
        if (active) setOrganizationState("failure");
      }
    })();
    return () => {
      active = false;
    };
  }, [kind]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget),
      values: Record<string, string> =
        kind === "organization"
          ? { name: String(data.get("name") ?? "").trim() }
          : {
              organizationId: String(data.get("organizationId") ?? ""),
              name: String(data.get("name") ?? "").trim(),
              code: String(data.get("code") ?? "")
                .trim()
                .toUpperCase(),
              timezone: String(data.get("timezone") ?? "").trim(),
            };
    const errors = validate(kind, values, m);
    setFieldErrors(errors);
    setError(null);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>("[aria-invalid=true]")
          ?.focus(),
      );
      return;
    }
    const fingerprint = JSON.stringify(values);
    if (!attempt.current || attempt.current.fingerprint !== fingerprint)
      attempt.current = { fingerprint, id: crypto.randomUUID() };
    setPending(true);
    try {
      const path = kind === "organization" ? "organizations" : "clinics",
        body = { ...values, attemptId: attempt.current.id };
      let recordId: string;
      if (kind === "organization") {
        const result = await portalRequest(
          "/api/administration/organizations",
          organizationEnvelope,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        recordId = result.organization.id;
      } else {
        const result = await portalRequest(
          "/api/administration/clinics",
          clinicEnvelope,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        recordId = result.clinic.id;
      }
      attempt.current = null;
      router.push(`/${locale}/administration/${path}/${recordId}?created=true`);
    } catch (cause) {
      setError(
        messageFor(
          cause instanceof Error ? (cause.message as Failure) : "failure",
          m,
        ),
      );
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setPending(false);
    }
  };
  if (organizationState === "loading")
    return <AdminState text={m.loadingOrganizations} loading />;
  if (organizationState === "failure")
    return (
      <AdminState
        text={m.unavailable}
        action={m.retry}
        onAction={() => location.reload()}
      />
    );
  if (organizationState === "incomplete")
    return <AdminState text={m.organizationSelectionLimit} />;
  const title = kind === "organization" ? m.createOrganization : m.createClinic;
  return (
    <div className="administration-page">
      <PageHeading
        title={title}
        help={kind === "organization" ? m.organizationsHelp : m.clinicsHelp}
      />
      {error && (
        <div
          ref={summaryRef}
          className="admin-error-summary"
          role="alert"
          tabIndex={-1}
        >
          <strong>{m.errorSummary}</strong>
          <p>{error}</p>
        </div>
      )}
      <form
        ref={formRef}
        className="administration-form"
        noValidate
        onSubmit={(event) => void submit(event)}
      >
        {kind === "clinic" && (
          <Field
            label={m.selectOrganization}
            name="organizationId"
            error={fieldErrors.organizationId}
          >
            <select
              id="organizationId"
              name="organizationId"
              defaultValue={preselected}
              aria-invalid={!!fieldErrors.organizationId}
              aria-describedby={
                fieldErrors.organizationId ? "organizationId-error" : undefined
              }
            >
              <option value="">{m.selectOrganization}</option>
              {organizations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field
          label={kind === "organization" ? m.organizationName : m.clinicName}
          name="name"
          error={fieldErrors.name}
        >
          <input
            id="name"
            name="name"
            maxLength={120}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            autoComplete="organization"
            onChange={() => {
              attempt.current = null;
            }}
          />
        </Field>
        {kind === "clinic" && (
          <>
            <Field
              label={m.clinicCode}
              name="code"
              error={fieldErrors.code}
              help={m.invalidCode}
            >
              <input
                id="code"
                name="code"
                minLength={2}
                maxLength={32}
                dir="ltr"
                aria-invalid={!!fieldErrors.code}
                aria-describedby={
                  fieldErrors.code ? "code-help code-error" : "code-help"
                }
                onChange={(event) => {
                  setCodePreview(event.target.value.toUpperCase());
                  attempt.current = null;
                }}
              />
              {codePreview && (
                <output className="code-preview">
                  <bdi>{codePreview}</bdi>
                </output>
              )}
            </Field>
            <Field
              label={m.timezone}
              name="timezone"
              error={fieldErrors.timezone}
              help={m.invalidTimezone}
            >
              <input
                id="timezone"
                name="timezone"
                defaultValue="Asia/Baghdad"
                dir="ltr"
                aria-invalid={!!fieldErrors.timezone}
                aria-describedby={
                  fieldErrors.timezone
                    ? "timezone-help timezone-error"
                    : "timezone-help"
                }
                onChange={() => {
                  attempt.current = null;
                }}
              />
            </Field>
          </>
        )}
        <div className="administration-actions">
          <button className="admin-primary" disabled={pending} type="submit">
            {pending ? m.creating : m.create}
          </button>
          <Link
            className="admin-secondary"
            href={`/${locale}/administration/${kind === "organization" ? "organizations" : "clinics"}`}
          >
            {m.cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}

function validate(
  kind: "organization" | "clinic",
  value: Record<string, string>,
  m: AdministrationMessages,
) {
  const errors: Record<string, string> = {};
  if (!value.name) errors.name = m.required;
  else if (value.name.length > 120) errors.name = m.maximumLength;
  else if (!noControl.test(value.name)) errors.name = m.invalidValue;
  if (kind === "clinic") {
    if (!uuid.safeParse(value.organizationId).success)
      errors.organizationId = m.invalidValue;
    if (!/^[A-Z0-9][A-Z0-9_-]{1,31}$/u.test(value.code))
      errors.code = m.invalidCode;
    if (
      !/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)+$/u.test(value.timezone) ||
      value.timezone.length > 100
    )
      errors.timezone = m.invalidTimezone;
  }
  return errors;
}
function PageHeading({
  title,
  help,
  action,
}: {
  title: string;
  help: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="administration-heading">
      <div>
        <p className="eyebrow">Saxlem</p>
        <h1>{title}</h1>
        <p>{help}</p>
      </div>
      {action}
    </header>
  );
}
function EntityCard({
  item,
  kind,
  locale,
  m,
}: {
  item: RecordValue;
  kind: Kind;
  locale: Locale;
  m: AdministrationMessages;
}) {
  const clinic = kind === "clinics" ? (item as Clinic) : null;
  return (
    <article className="administration-card">
      <div className="administration-card-head">
        <h2>{item.name}</h2>
        <Status value={item.status} m={m} />
      </div>
      {clinic && (
        <p>
          <bdi>{clinic.code}</bdi> · <bdi>{clinic.timezone}</bdi>
        </p>
      )}
      <p>
        {m.created}:{" "}
        <time dateTime={item.createdAt}>
          {formatDate(item.createdAt, locale)}
        </time>
      </p>
      <Link
        className="admin-link"
        href={`/${locale}/administration/${kind}/${item.id}`}
      >
        {kind === "organizations" ? m.viewOrganization : m.viewClinic}
      </Link>
    </article>
  );
}
function Status({
  value,
  m,
}: {
  value: "active" | "inactive";
  m: AdministrationMessages;
}) {
  return (
    <span className={`pill ${value === "active" ? "positive" : "neutral"}`}>
      {m[value]}
    </span>
  );
}
function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
function AdminState({
  text,
  loading = false,
  action,
  onAction,
}: {
  text: string;
  loading?: boolean;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <section
      className="administration-state"
      role={loading ? "status" : "alert"}
      aria-live="polite"
      aria-busy={loading || undefined}
    >
      <p>{text}</p>
      {action && (
        <button className="admin-secondary" onClick={onAction}>
          {action}
        </button>
      )}
    </section>
  );
}
function Field({
  label,
  name,
  error,
  help,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-field">
      <label htmlFor={name}>{label}</label>
      <div>
        {/* clone-free: descendants carry matching names and browsers associate through nesting fallback */}
        {children}
      </div>
      {help && (
        <p id={`${name}-help`} className="field-help">
          {help}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
function messageFor(kind: Failure, m: AdministrationMessages) {
  return kind === "unauthorized"
    ? m.sessionExpired
    : kind === "forbidden"
      ? m.forbidden
      : kind === "notFound"
        ? m.notFound
        : kind === "conflict"
          ? m.conflict
          : kind === "unavailable"
            ? m.unavailable
            : m.failure;
}
function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

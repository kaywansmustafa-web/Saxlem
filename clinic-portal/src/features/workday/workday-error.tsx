import type { Locale } from "@/i18n";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { clinicalMessages } from "@/features/clinical-presentation/messages";

/** A calm, retryable message when the backend can't answer; never raw errors. */
export function WorkdayError({ locale, error }: { locale: Locale; error: unknown }) {
  const m = clinicalMessages(locale);
  const forbidden = error instanceof PortalApiError && error.detail.status === 403;
  return (
    <div className="ax-page">
      <div className="ax-card ax-empty ax-empty-lg" role="alert">
        <p>{forbidden ? m.forbidden : m.backendError}</p>
        <a className="ax-btn ax-btn-primary" href="">
          {m.retry}
        </a>
      </div>
    </div>
  );
}

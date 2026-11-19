import Link from "next/link";
import { PageHeader, StateView } from "@/components/app-shell";
import { ReviewModeration } from "@/components/review-moderation";
import { listReviews } from "@/data/owner-data";
import { when } from "@/domain/format";
import { requireOwnerSession } from "@/infrastructure/auth";

const filters = [
  ["All", undefined],
  ["Shown", "published"],
  ["Hidden", "hidden"],
] as const;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cursor?: string }>;
}) {
  const { status: raw, cursor } = await searchParams;
  const status =
    raw === "published" || raw === "hidden" ? raw : undefined;
  const page = await listReviews(await requireOwnerSession(), status, cursor);
  return (
    <>
      <PageHeader
        title="Reviews"
        description="What patients wrote after a visit that took place. Hide anything abusive, untrue or personal; hidden reviews leave the doctor's rating."
      />
      <nav className="tabs" aria-label="Filter reviews">
        {filters.map(([label, value]) => (
          <Link
            key={label}
            aria-current={value === status ? "page" : undefined}
            href={value ? `/reviews?status=${value}` : "/reviews"}
          >
            {label}
          </Link>
        ))}
      </nav>
      {page.items.length ? (
        <div className="review-list">
          {page.items.map((review) => (
            <article key={review.id} className="card review-card">
              <header>
                <span
                  className="stars"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {"★".repeat(review.rating)}
                  <span className="stars-empty">
                    {"★".repeat(5 - review.rating)}
                  </span>
                </span>
                <strong>{review.doctorName}</strong>
                <span className="muted">· {review.clinicName}</span>
              </header>
              {review.comment ? (
                <p className="review-comment">{review.comment}</p>
              ) : (
                <p className="muted">No comment, rating only.</p>
              )}
              <footer>
                <span className="muted">
                  {review.authorName}
                  {review.anonymous && " (shown as anonymous)"} ·{" "}
                  {when(review.createdAt)} · visit{" "}
                  <bdi>{review.appointmentReference}</bdi>
                </span>
                <ReviewModeration id={review.id} status={review.status} />
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <StateView
          title="No reviews yet"
          description="Patients are asked to rate a visit an hour after it ends."
        />
      )}
      {page.nextCursor && (
        <p>
          <Link
            className="button"
            href={`/reviews?${new URLSearchParams({
              ...(status ? { status } : {}),
              cursor: page.nextCursor,
            }).toString()}`}
          >
            Older reviews
          </Link>
        </p>
      )}
    </>
  );
}

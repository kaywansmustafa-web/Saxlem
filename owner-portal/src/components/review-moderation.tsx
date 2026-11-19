"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Hide a review (it leaves the doctor's rating) or show it again. */
export function ReviewModeration({
  id,
  status,
}: {
  id: string;
  status: "published" | "hidden";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const next = status === "published" ? "hidden" : "published";
  return (
    <span className="review-actions">
      {status === "hidden" && <span className="badge badge-warning">Hidden</span>}
      <button
        type="button"
        className={next === "hidden" ? "button review-hide" : "button"}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await fetch(`/api/platform/reviews/${id}/status`, {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ status: next }),
            });
            if (!response.ok) throw new Error();
            router.refresh();
          } catch {
            setError("Couldn't change it. Try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {next === "hidden" ? "Hide" : "Show again"}
      </button>
      {error && (
        <span role="alert" className="review-error">
          {error}
        </span>
      )}
    </span>
  );
}

"use client";
export default function ErrorView({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="card state" role="alert">
      <div>
        <h2>We could not load this page</h2>
        <p>The service may be temporarily unavailable. No changes were made.</p>
        <button className="button button-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </section>
  );
}

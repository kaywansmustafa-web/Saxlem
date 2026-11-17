"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="primary statement-print no-print"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}

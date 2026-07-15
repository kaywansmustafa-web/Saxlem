"use client";
import { usePathname } from "next/navigation";
import { isLocale, messages } from "@/i18n";

function useCopy() {
  const candidate = usePathname().split("/")[1];
  return messages(isLocale(candidate) ? candidate : "en");
}

export function DashboardLoading() {
  const m = useCopy();
  return <div role="status" aria-label={m.loading}><div className="skeleton"/><div className="metrics"><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div></div>;
}

export function DashboardError({ reset }: { reset: () => void }) {
  const m = useCopy();
  return <div className="state"><div><h1>{m.unavailable}</h1><p>{m.unavailableBody}</p><button className="primary" onClick={reset}>{m.back}</button></div></div>;
}

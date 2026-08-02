import type { ClinicalMessages } from "./messages";

export function ClinicalState({ kind, m }: { kind: "offline"|"unauthorized"|"forbidden"|"notFound"|"backendError"; m: ClinicalMessages }) {
  return <section className="state" role="alert" aria-live="polite"><div><h1>{m[kind]}</h1><a href="">{m.retry}</a></div></section>;
}

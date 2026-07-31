import Link from "next/link";
import type { FoundationMessages } from "./foundation-messages";
export type StateKind="loading"|"unauthorized"|"forbidden"|"sessionExpired"|"offline"|"timeout"|"failure"|"notFound";
export function PortalStateView({kind,m,actionHref,requestId}:{kind:StateKind;m:FoundationMessages;actionHref?:string;requestId?:string}){const urgent=kind!=="loading";return <section className="portal-state" role={urgent?"alert":"status"} aria-live={urgent?"assertive":"polite"}><h1>{m[kind]}</h1>{requestId&&<p><code>{requestId}</code></p>}{actionHref&&<Link className="primary" href={actionHref}>{kind==="unauthorized"||kind==="sessionExpired"?m.goLogin:m.retry}</Link>}</section>}

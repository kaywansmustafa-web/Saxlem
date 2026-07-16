export type DoctorNotificationFailure="notFound"|"stale"|"forbidden";export class DoctorNotificationError extends Error{constructor(public readonly kind:DoctorNotificationFailure){super(kind)}}

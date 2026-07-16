import type{DoctorAction,DoctorSession}from"./models";
export type DoctorFailure="notFound"|"stale"|"paused"|"finished"|"invalidTransition"|"queueUnavailable"|"appointmentNotFound";
export class DoctorSessionError extends Error{constructor(public readonly kind:DoctorFailure){super(kind)}}
export function assertDoctorTransition(session:DoctorSession,action:DoctorAction){if(session.state==="finished")throw new DoctorSessionError("finished");if(session.state==="paused"&&action==="complete")throw new DoctorSessionError("paused");if(action==="pause"&&session.state!=="active")throw new DoctorSessionError("invalidTransition");if(action==="resume"&&session.state!=="paused")throw new DoctorSessionError("invalidTransition")}

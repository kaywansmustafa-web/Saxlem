export type QueueState="onTime"|"delayed"|"paused"; export interface QueueRow{id:string;doctor:string;current:string;waiting:number;delay:number;state:QueueState}
export interface Arrival{id:string;time:string;patient:string;doctor:string;status:"expected"|"arrived";next:"confirm"|"welcome"}
export interface DoctorRow{id:string;name:string;specialty:string;state:"working"|"break"|"delayed"|"finished";load:number;next:string}
export interface Dashboard{clinic:{id:string;name:string;delayed:boolean};metrics:{appointments:number;waiting:number;checkedIn:number;delayed:number};queues:QueueRow[];arrivals:Arrival[];doctors:DoctorRow[];updates:string[]}

import type{DoctorScheduleDefinition}from"./models";export interface DoctorScheduleRepository{today(doctorId:string,clinicId:string):Promise<DoctorScheduleDefinition|null>}

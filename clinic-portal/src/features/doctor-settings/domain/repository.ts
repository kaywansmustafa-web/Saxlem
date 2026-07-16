import type{DoctorSettingsSource}from"./models";export interface DoctorSettingsRepository{get(doctorId:string,clinicId:string):Promise<DoctorSettingsSource|null>}

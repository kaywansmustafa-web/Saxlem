import type{PatientSummary,PatientWorkspace}from"./models";export interface PatientRepository{list():Promise<PatientSummary[]>;get(id:string):Promise<PatientWorkspace|null>}

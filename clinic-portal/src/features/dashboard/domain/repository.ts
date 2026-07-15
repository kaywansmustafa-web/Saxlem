import type{Dashboard}from"./models"; export interface DashboardRepository{today(clinicId:string):Promise<Dashboard>}

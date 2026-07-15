import type{DashboardRepository}from"../domain/repository"; export class GetDashboard{constructor(private repo:DashboardRepository){}execute(id:string){return this.repo.today(id)}}

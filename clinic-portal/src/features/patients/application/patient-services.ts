import type{PatientRepository}from"../domain/repository";import type{PatientSummary}from"../domain/models";import{fullName}from"../domain/models";
export const filterPatients=(patients:PatientSummary[],query:string)=>{const q=query.trim().toLocaleLowerCase();if(!q)return patients;const digits=q.replace(/\D/g,"");return patients.filter(p=>[p.firstName,p.lastName,fullName(p),p.id].some(v=>v.toLocaleLowerCase().includes(q))||(digits.length>0&&p.phone.replace(/\D/g,"").includes(digits)))};
export class GetPatients{constructor(private repo:PatientRepository){}execute(){return this.repo.list()}}
export class GetPatientWorkspace{constructor(private repo:PatientRepository){}execute(id:string){return this.repo.get(id)}}
export const todayArrivals=(patients:PatientSummary[])=>patients.filter(p=>p.today).sort((a,b)=>a.today!.time.localeCompare(b.today!.time));
export const recentlyViewed=(patients:PatientSummary[])=>patients.filter(p=>p.recentlyViewedRank).sort((a,b)=>a.recentlyViewedRank!-b.recentlyViewedRank!).slice(0,6);

import{redirect}from"next/navigation";export default async function LocalePage({params}:{params:Promise<{locale:string}>}){redirect(`/${(await params).locale}/dashboard`)}

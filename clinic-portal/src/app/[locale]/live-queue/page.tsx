import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { queueMessages } from "@/features/live-queue/presentation/messages";
import { liveQueueServices } from "@portal-composition";
import { LiveQueueWorkspace } from "@/features/live-queue/presentation/live-queue-workspace";
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale}=await params;if(!isLocale(locale))notFound();const data=await liveQueueServices()?.get.execute("queue-karwan");if(!data)notFound();return <LiveQueueWorkspace initial={data} locale={locale} m={queueMessages(locale)}/>}

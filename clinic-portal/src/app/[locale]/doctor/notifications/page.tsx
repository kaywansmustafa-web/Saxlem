import { redirect } from "next/navigation";

/** Older doctor links (patients, notifications) now live on Today. */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/doctor/session`);
}

import { AppShell } from "@/components/app-shell";
import { requireOwnerSession } from "@/infrastructure/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwnerSession();
  return <AppShell>{children}</AppShell>;
}

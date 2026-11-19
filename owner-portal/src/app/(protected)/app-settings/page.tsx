import { PageHeader } from "@/components/app-shell";
import { AppSettingsForm } from "@/components/app-config/app-settings-form";
import { appSettings } from "@/data/app-catalog";
import { requireOwnerSession } from "@/infrastructure/auth";

export default async function AppSettingsPage() {
  const data = await appSettings(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="App settings"
        description="Numbers, links and switches the app and server use, so they change without a new app version. Every value has safe limits; changes are recorded in the audit log."
      />
      <AppSettingsForm groups={data.groups} settings={data.settings} />
    </>
  );
}

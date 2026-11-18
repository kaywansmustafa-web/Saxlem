import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { ClinicLocationForm } from "@/components/clinic-location-form";
import { clinicDetail } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";

export default async function ClinicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const clinic = await clinicDetail(await requireOwnerSession(), id);
  return (
    <>
      <PageHeader
        title={clinic.name}
        description="Where the clinic is and how patients reach it."
        action={
          <Link className="button" href="/clinics">
            All clinics
          </Link>
        }
      />
      <div className="grid split">
        <section className="card detail-card">
          <h2>Clinic</h2>
          <p>
            <StatusBadge status={clinic.status} />
          </p>
          <dl>
            <dt>Code</dt>
            <dd>{clinic.code}</dd>
            <dt>Timezone</dt>
            <dd>{clinic.timezone}</dd>
          </dl>
        </section>
        <ClinicLocationForm clinicId={clinic.id} location={clinic} />
      </div>
    </>
  );
}

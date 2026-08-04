import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GetDoctorWorkspace } from "@/features/doctor/application/doctor-session-services";
import { MockDoctorSessionRepository } from "@/features/doctor/data/mock-doctor-session-repository";
import { MockLiveQueueRepository } from "@/features/live-queue/data/mock-live-queue-repository";
import { projectDoctorPatients } from "@/features/doctor-patients/application/project-doctor-patients";
import { DoctorPatientsView } from "@/features/doctor-patients/presentation/doctor-patients-view";
import { doctorPatientsMessages } from "@/features/doctor-patients/presentation/messages";

afterEach(cleanup);

async function projection() {
  const workspace = await new GetDoctorWorkspace(
    new MockDoctorSessionRepository(),
    new MockLiveQueueRepository(),
    { now: () => new Date("2026-07-16T08:29:00.000Z") },
  ).execute("session-karwan-morning");

  if (!workspace) throw new Error("missing doctor workspace");

  return projectDoctorPatients(workspace);
}

describe("doctor patients presentation", () => {
  it("shows the current patient prominently and lists next patients", async () => {
    render(
      <DoctorPatientsView
        data={await projection()}
        locale="en"
        m={doctorPatientsMessages("en")}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Patients Today", level: 1 }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Current Patient" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Rojin Salih")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open Patient Workspace" }).length)
      .toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Open Appointment" }).length)
      .toBeGreaterThan(0);
  });

  it("keeps all locale catalogs in key parity", () => {
    expect(Object.keys(doctorPatientsMessages("ar"))).toEqual(
      Object.keys(doctorPatientsMessages("en")),
    );
    expect(Object.keys(doctorPatientsMessages("ku"))).toEqual(
      Object.keys(doctorPatientsMessages("en")),
    );
  });
});

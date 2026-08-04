import { describe, expect, it } from "vitest";
import { GetDoctorWorkspace } from "@/features/doctor/application/doctor-session-services";
import { MockDoctorSessionRepository } from "@/features/doctor/data/mock-doctor-session-repository";
import { MockLiveQueueRepository } from "@/features/live-queue/data/mock-live-queue-repository";
import { projectDoctorPatients } from "@/features/doctor-patients/application/project-doctor-patients";

describe("doctor patients projection", () => {
  it("reuses the doctor workspace current and next patients safely", async () => {
    const workspace = await new GetDoctorWorkspace(
      new MockDoctorSessionRepository(),
      new MockLiveQueueRepository(),
      { now: () => new Date("2026-07-16T08:29:00.000Z") },
    ).execute("session-karwan-morning");

    if (!workspace) throw new Error("missing doctor workspace");

    const patients = projectDoctorPatients(workspace);

    expect(patients.doctorName).toBe("Dr. Karwan Ahmed");
    expect(patients.current?.patientId).toBe("PT-1008");
    expect(patients.next.length).toBeLessThanOrEqual(3);
    expect(patients.totalVisible).toBe(
      (patients.current ? 1 : 0) + patients.next.length,
    );
  });

  it("returns an immutable next-patient list copy", async () => {
    const workspace = await new GetDoctorWorkspace(
      new MockDoctorSessionRepository(),
      new MockLiveQueueRepository(),
      { now: () => new Date("2026-07-16T08:29:00.000Z") },
    ).execute("session-karwan-morning");

    if (!workspace) throw new Error("missing doctor workspace");

    const patients = projectDoctorPatients(workspace);

    expect(Object.isFrozen(patients)).toBe(true);
    expect(Object.isFrozen(patients.next)).toBe(true);
  });
});

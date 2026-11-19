"use client";

export type PickerDoctor = {
  id: string;
  displayName: string;
  clinics: { id: string }[];
};

/**
 * Most receptionists work for one doctor. Shown only for the receptionist
 * role, once a clinic is chosen; more doctors can be ticked for a shared
 * front desk, and the receptionist can add more later in the Clinic Portal.
 */
export function ReceptionDoctorPicker({
  doctors,
  clinicId,
}: {
  doctors: PickerDoctor[];
  clinicId: string;
}) {
  const options = doctors.filter((doctor) =>
    doctor.clinics.some((clinic) => clinic.id === clinicId),
  );
  return (
    <fieldset className="field doctor-picker">
      <legend>Works for</legend>
      {!clinicId ? (
        <small>Choose a clinic first.</small>
      ) : options.length === 0 ? (
        <small>No active doctors at this clinic yet.</small>
      ) : (
        <>
          {options.map((doctor, index) => (
            <label key={doctor.id} className="check-row">
              <input
                type="checkbox"
                name="doctorIds"
                value={doctor.id}
                defaultChecked={index === 0 && options.length === 1}
              />
              {doctor.displayName}
            </label>
          ))}
          <small>
            Usually one doctor. Tick more only if this receptionist covers
            several. They can add doctors later in the Clinic Portal.
          </small>
        </>
      )}
    </fieldset>
  );
}

/** Reads the ticked doctors; at least one is needed when any exist. */
export function pickedDoctors(form: HTMLFormElement): string[] {
  return new FormData(form).getAll("doctorIds").map(String);
}

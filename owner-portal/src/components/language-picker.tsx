/** The languages a doctor speaks, as the backend knows them (never typed by hand). */
export const doctorLanguages = [
  ["badiniKurdish", "Kurdish (Badini)"],
  ["soraniKurdish", "Kurdish (Sorani)"],
  ["arabic", "Arabic"],
  ["english", "English"],
  ["turkish", "Turkish"],
] as const;

export const languageName = (value: string) =>
  doctorLanguages.find(([key]) => key === value)?.[1] ?? value;

export function LanguagePicker({ selected = [] }: { selected?: readonly string[] }) {
  return (
    <fieldset className="field language-picker">
      <legend>Languages</legend>
      <div className="choice-row">
        {doctorLanguages.map(([value, label]) => (
          <label key={value} className="choice">
            <input type="checkbox" name="languages" value={value} defaultChecked={selected.includes(value)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Checked languages from a submitted form. */
export const checkedLanguages = (form: HTMLFormElement) =>
  new FormData(form).getAll("languages").map(String);

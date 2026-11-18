import Link from "next/link";
import type { Locale } from "@/i18n";
import type { DoctorProfile } from "@/infrastructure/doctor-composition";
import { Icon } from "@/components/icons";
import { workdayMessages } from "./messages";
import { SignOutButtons } from "./sign-out";

const localeNames: Record<Locale, string> = { en: "English", ar: "العربية", ku: "کوردی (بادینی)" };

/** Settings for clinic staff: who you are, portal language, signing out. */
export function SettingsView({
  locale,
  role,
  path,
  clinicName,
  profile,
  facts = [],
}: {
  locale: Locale;
  role: "doctor" | "receptionist" | "clinicManager";
  path: string;
  clinicName?: string;
  profile?: DoctorProfile;
  facts?: readonly { label: string; value: string }[];
}) {
  const m = workdayMessages(locale);
  const roleName = role === "doctor" ? m.roleDoctor : role === "clinicManager" ? m.roleManager : m.roleReceptionist;
  const rows = [
    { label: m.role, value: roleName },
    ...(clinicName ? [{ label: m.clinic, value: clinicName }] : []),
    ...facts,
  ];
  return (
    <div className="ax-page ax-settings">
      <header className="ax-hero">
        <div>
          <p className="ax-eyebrow">{roleName}</p>
          <h1 className="ax-title">{m.settingsTitle}</h1>
        </div>
      </header>
      {profile && (
        <section className="ax-card ax-profile" aria-labelledby="profile-title">
          <div className="ax-profile-head">
            <span className="ax-avatar" aria-hidden="true">
              {profile.displayName.replace(/^Dr\.?\s*/i, "").slice(0, 1)}
            </span>
            <div>
              <h2 id="profile-title" className="ax-card-title">
                {profile.displayName}
              </h2>
              <p className="ax-muted">{profile.specialty}</p>
            </div>
          </div>
          <dl className="ax-facts">
            {profile.licenseNumber && (
              <div>
                <dt>{m.license}</dt>
                <dd>{profile.licenseNumber}</dd>
              </div>
            )}
            {typeof profile.yearsOfExperience === "number" && (
              <div>
                <dt>{m.experience}</dt>
                <dd>{m.years(profile.yearsOfExperience)}</dd>
              </div>
            )}
            {profile.languages?.length ? (
              <div>
                <dt>{m.languages}</dt>
                <dd>{profile.languages.map((l) => m.languageNames[l] ?? l).join(", ")}</dd>
              </div>
            ) : null}
          </dl>
          <p className="ax-hint">{m.profileChanges}</p>
        </section>
      )}
      <section className="ax-card" aria-labelledby="account-title">
        <h2 id="account-title" className="ax-card-title">
          {m.account}
        </h2>
        <dl className="ax-facts">
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="ax-card" aria-labelledby="language-title">
        <h2 id="language-title" className="ax-card-title">
          {m.language}
        </h2>
        <div className="ax-choice">
          {(["ku", "ar", "en"] as const).map((next) => (
            <Link
              key={next}
              lang={next}
              className="ax-choice-item"
              aria-current={next === locale ? "true" : undefined}
              href={path.replace(`/${locale}/`, `/${next}/`)}
            >
              <Icon name="globe" size={18} />
              {localeNames[next]}
            </Link>
          ))}
        </div>
      </section>
      <section className="ax-card" aria-labelledby="security-title">
        <h2 id="security-title" className="ax-card-title">
          {m.security}
        </h2>
        <p className="ax-muted">{m.securityBody}</p>
        <SignOutButtons locale={locale} signOut={m.signOut} everywhere={m.signOutEverywhere} />
      </section>
    </div>
  );
}

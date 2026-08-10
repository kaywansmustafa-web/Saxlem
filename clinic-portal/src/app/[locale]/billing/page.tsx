import { billingComposition } from "@/infrastructure/billing-composition";
import { isLocale } from "@/i18n";
import { notFound } from "next/navigation";

const copy = {
  en: {
    title: "Billing",
    platform:
      "Select an organization through the billing administration workflow to review its plan and statements.",
    current: "Current statement",
    net: "Net commission",
    status: "Status",
  },
  ar: {
    title: "الفوترة",
    platform: "اختر مؤسسة من خلال إدارة الفوترة لمراجعة الخطة والكشوفات.",
    current: "الكشف الحالي",
    net: "صافي العمولة",
    status: "الحالة",
  },
  ku: {
    title: "Billing",
    platform: "Select an organization to review billing.",
    current: "Current statement",
    net: "Net commission",
    status: "Status",
  },
} as const;

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = copy[locale];
  const composition = await billingComposition();
  if (composition.platform) {
    const plans = await composition.platform.plans();
    return (
      <section aria-labelledby="billing-title">
        <h1 id="billing-title">{m.title}</h1>
        <p>{m.platform}</p>
        <p>
          {plans.length} {m.title.toLowerCase()}
        </p>
      </section>
    );
  }
  const statement = await composition.read!.currentStatement();
  return (
    <section aria-labelledby="billing-title">
      <h1 id="billing-title">{m.title}</h1>
      <h2>{m.current}</h2>
      <dl>
        <div>
          <dt>{m.status}</dt>
          <dd>{statement.status}</dd>
        </div>
        <div>
          <dt>{m.net}</dt>
          <dd>
            {new Intl.NumberFormat(locale === "ku" ? "ku" : locale).format(
              statement.netCommissionIqd,
            )}{" "}
            IQD
          </dd>
        </div>
      </dl>
    </section>
  );
}

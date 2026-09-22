import { useState } from "react";
import { CheckCircle2, ImagePlus, Eye, ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { cities } from "../data/cities";
import { propertyTypeKeys, amenityKeys } from "../data/meta";
import { formatPrice } from "../lib/format";
import type { AmenityKey } from "../data/types";

export default function PublishPage() {
  const { t, L, lang, isRTL } = useLocale();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const Prev = isRTL ? ArrowRight : ArrowLeft;
  const Next = isRTL ? ArrowLeft : ArrowRight;

  const [form, setForm] = useState({
    transaction: "sale",
    type: "apartment",
    title: "",
    description: "",
    price: "",
    city: "casablanca",
    neighborhood: "",
    surface: "",
    bedrooms: "2",
    bathrooms: "1",
    furnished: false,
    amenities: [] as AmenityKey[],
    name: "",
    phone: "",
    email: "",
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const toggleAmenity = (a: AmenityKey) =>
    set({
      amenities: form.amenities.includes(a)
        ? form.amenities.filter((x) => x !== a)
        : [...form.amenities, a],
    });

  const selectedCity = cities.find((c) => c.id === form.city);
  const steps = [t("publish.step1"), t("publish.step2"), t("publish.step3")];

  if (done) {
    return (
      <div className="container-page flex flex-col items-center justify-center gap-4 py-24 text-center">
        <PartyPopper size={56} className="text-brand-600" />
        <h1 className="text-2xl font-extrabold text-ink-900">{t("publish.published")}</h1>
        <button className="btn-primary mt-2" onClick={() => { setDone(false); setStep(1); }}>
          {t("publish.title")}
        </button>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-ink-900">{t("publish.title")}</h1>
        <p className="mt-2 text-ink-500">{t("publish.subtitle")}</p>
      </div>

      {/* Stepper */}
      <div className="mx-auto mb-8 flex max-w-2xl items-center justify-between">
        {steps.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const complete = step > n;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
                    active
                      ? "bg-brand-600 text-white"
                      : complete
                        ? "bg-emerald-500 text-white"
                        : "bg-ink-200 text-ink-600"
                  }`}
                >
                  {complete ? <CheckCircle2 size={18} /> : n}
                </span>
                <span className="mt-1 hidden text-xs font-medium text-ink-600 sm:block">
                  {label}
                </span>
              </div>
              {n < steps.length && (
                <div className={`mx-2 h-0.5 flex-1 ${complete ? "bg-emerald-500" : "bg-ink-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="field-label">{t("publish.transaction")}</label>
                <div className="inline-flex rounded-xl bg-ink-100 p-1">
                  {["sale", "rent"].map((v) => (
                    <button
                      key={v}
                      onClick={() => set({ transaction: v })}
                      className={`rounded-lg px-5 py-1.5 text-sm font-semibold transition ${
                        form.transaction === v ? "bg-white text-brand-700 shadow-sm" : "text-ink-600"
                      }`}
                    >
                      {t(`transactions.${v}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label">{t("publish.propertyType")}</label>
                <select className="input" value={form.type} onChange={(e) => set({ type: e.target.value })}>
                  {propertyTypeKeys.map((k) => (
                    <option key={k} value={k}>{t(`types.${k}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">{t("publish.propertyTitle")}</label>
                <input
                  className="input"
                  placeholder={t("publish.titlePlaceholder")}
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">{t("publish.description")}</label>
                <textarea
                  className="input min-h-[120px]"
                  placeholder={t("publish.descriptionPlaceholder")}
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">{t("publish.price")}</label>
                  <input type="number" dir="ltr" className="input" value={form.price} onChange={(e) => set({ price: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">{t("publish.surface")}</label>
                  <input type="number" dir="ltr" className="input" value={form.surface} onChange={(e) => set({ surface: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">{t("publish.city")}</label>
                  <select className="input" value={form.city} onChange={(e) => set({ city: e.target.value, neighborhood: "" })}>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{L(c.name)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">{t("publish.neighborhood")}</label>
                  <select className="input" value={form.neighborhood} onChange={(e) => set({ neighborhood: e.target.value })}>
                    <option value="">{t("home.anyNeighborhood")}</option>
                    {selectedCity?.neighborhoods.map((n) => (
                      <option key={n.fr} value={L(n)}>{L(n)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">{t("publish.bedrooms")}</label>
                  <input type="number" dir="ltr" className="input" value={form.bedrooms} onChange={(e) => set({ bedrooms: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">{t("publish.bathrooms")}</label>
                  <input type="number" dir="ltr" className="input" value={form.bathrooms} onChange={(e) => set({ bathrooms: e.target.value })} />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-700">
                <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-600" checked={form.furnished} onChange={(e) => set({ furnished: e.target.checked })} />
                {t("publish.furnished")}
              </label>
              <div>
                <label className="field-label">{t("publish.amenities")}</label>
                <div className="flex flex-wrap gap-2">
                  {amenityKeys.map((a) => {
                    const active = form.amenities.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() => toggleAmenity(a)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          active ? "border-brand-300 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600"
                        }`}
                      >
                        {t(`amenities.${a}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="field-label">{t("publish.photos")}</label>
                <div className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 text-ink-400 hover:border-brand-300">
                  <ImagePlus size={28} />
                  <span className="text-sm">{t("publish.photosHint")}</span>
                </div>
              </div>
              <h3 className="pt-2 font-bold text-ink-800">{t("publish.contactInfo")}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">{t("publish.fullName")}</label>
                  <input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">{t("publish.phone")}</label>
                  <input dir="ltr" className="input" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label">{t("publish.email")}</label>
                  <input dir="ltr" type="email" className="input" value={form.email} onChange={(e) => set({ email: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="btn-ghost disabled:opacity-40"
            >
              <Prev size={16} /> {t("publish.back")}
            </button>
            {step < 3 ? (
              <button onClick={() => setStep((s) => s + 1)} className="btn-primary">
                {t("publish.next")} <Next size={16} />
              </button>
            ) : (
              <button onClick={() => setDone(true)} className="btn-primary">
                <CheckCircle2 size={16} /> {t("publish.publishNow")}
              </button>
            )}
          </div>
        </div>

        {/* Live preview */}
        <aside>
          <div className="card sticky top-20 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-ink-100 p-3 text-sm font-bold text-ink-700">
              <Eye size={16} /> {t("publish.previewTitle")}
            </div>
            <div className="p-4">
              <div className="mb-3 grid h-40 place-items-center rounded-xl bg-ink-100 text-ink-400">
                <ImagePlus size={32} />
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${
                  form.transaction === "sale" ? "bg-brand-600" : "bg-emerald-600"
                }`}
              >
                {t(`transactions.${form.transaction}`)}
              </span>
              <h3 className="mt-2 text-base font-bold text-ink-900">
                {form.title || t("publish.titlePlaceholder")}
              </h3>
              <p className="text-sm text-ink-500">
                {form.neighborhood || "—"}، {L(selectedCity?.name)}
              </p>
              <div className="mt-2 text-lg font-extrabold text-brand-700">
                {form.price ? formatPrice(Number(form.price), lang) : "—"}{" "}
                <span className="text-xs font-semibold text-ink-500">{t("common.mad")}</span>
              </div>
              <div className="mt-2 flex gap-3 text-xs text-ink-500">
                <span>{form.bedrooms || 0} {t("common.bedroomsShort")}</span>
                <span>{form.bathrooms || 0} {t("common.bathroomsShort")}</span>
                <span>{form.surface || 0} {t("common.sar")}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

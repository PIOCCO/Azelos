import { useLocale } from "../lib/useLocale";
import { owners } from "../data/owners";
import OwnerCard from "../components/OwnerCard";

export default function AgentsPage() {
  const { t } = useLocale();
  const sorted = [...owners].sort((a, b) => b.rating - a.rating);
  return (
    <div className="container-page py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-ink-900">{t("home.verifiedOwners")}</h1>
        <p className="mt-2 text-ink-500">{t("home.verifiedOwnersSub")}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {sorted.map((o) => (
          <OwnerCard key={o.id} owner={o} />
        ))}
      </div>
    </div>
  );
}

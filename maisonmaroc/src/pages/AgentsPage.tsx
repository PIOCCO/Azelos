import { useLocale } from "../lib/useLocale";
import { useListings } from "../context/ListingsContext";
import OwnerCard from "../components/OwnerCard";
import PageHeader from "../components/PageHeader";

export default function AgentsPage() {
  const { t } = useLocale();
  const { owners } = useListings();
  const sorted = [...owners].sort((a, b) => b.rating - a.rating);

  return (
    <div className="page-shell">
      <div className="container-page">
        <PageHeader
          title={t("home.verifiedOwners")}
          description={t("home.verifiedOwnersSub")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sorted.map((o) => (
            <OwnerCard key={o.id} owner={o} />
          ))}
        </div>
      </div>
    </div>
  );
}

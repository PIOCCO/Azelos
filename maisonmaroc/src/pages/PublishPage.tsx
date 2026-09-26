import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import EmptyState from "../components/EmptyState";
import PageMeta from "../components/PageMeta";

export default function PublishPage() {
  const { t } = useLocale();

  return (
    <div className="page-shell">
      <PageMeta title={t("publish.title")} description={t("publish.emptyDescription")} path="/publish" />
      <div className="container-page py-12">
        <EmptyState
          icon={<Building2 size={48} strokeWidth={1.25} />}
          title={t("publish.emptyTitle")}
          description={t("publish.emptyDescription")}
          action={
            <Link to="/contact" className="btn-primary">
              {t("publish.contactCta")}
            </Link>
          }
        />
      </div>
    </div>
  );
}

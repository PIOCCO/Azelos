import { FormEvent, useState } from "react";
import { createBusinessFunction } from "../../api/dora";
import type { BusinessFunction } from "../../api/types";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge, toneFromLevel } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { can, isReadOnlyAuditor } from "../../lib/permissions";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";
import { useTranslation } from "../../i18n/LocaleContext";

export function BusinessFunctionsPage() {
  const { t, translateStatus } = useTranslation();
  const { session } = useAuth();
  const { data, page, setPage, isLoading, refetch, error } = usePaginatedResource<BusinessFunction>(
    "business-functions",
    "/api/v1/business-functions",
  );
  const canWrite = can(session?.role, "org.admin") && !isReadOnlyAuditor(session?.role);
  const [formOpen, setFormOpen] = useState(false);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createBusinessFunction({
      name: String(fd.get("name")),
      function_identifier: String(fd.get("function_identifier")),
      critical_or_important: String(fd.get("critical_or_important")),
    });
    setFormOpen(false);
    refetch();
  }

  return (
    <ModuleGate
      item={{ label: "Business Functions", labelKey: "pages.businessFunctions.title", moduleKey: "ASSET_MANAGEMENT" }}
    >
      <PageHeader
        title={t("pages.businessFunctions.title")}
        subtitle={t("pages.businessFunctions.subtitle")}
        actions={
          canWrite ? (
            <Button onClick={() => setFormOpen(!formOpen)}>
              {formOpen ? t("common.cancel") : t("pages.businessFunctions.new")}
            </Button>
          ) : null
        }
      />
      {formOpen ? (
        <form
          onSubmit={onCreate}
          className="mb-6 grid max-w-2xl gap-3 rounded-lg border bg-surface p-5 shadow-card md:grid-cols-2"
        >
          <input
            name="name"
            placeholder={t("pages.businessFunctions.colName")}
            required
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="function_identifier"
            placeholder={t("pages.businessFunctions.colIdentifier")}
            required
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select name="critical_or_important" className="rounded-lg border px-3 py-2 text-sm md:col-span-2">
            <option value="critical">{translateStatus("critical")}</option>
            <option value="important">{translateStatus("important")}</option>
            <option value="neither">{translateStatus("neither")}</option>
          </select>
          <Button type="submit" className="w-fit">
            {t("common.create")}
          </Button>
        </form>
      ) : null}
      <DataTable
        title={t("pages.businessFunctions.table")}
        columns={[
          { key: "name", header: t("pages.businessFunctions.colName"), render: (r) => r.name },
          {
            key: "id",
            header: t("pages.businessFunctions.colIdentifier"),
            render: (r) => r.function_identifier,
          },
          {
            key: "crit",
            header: t("pages.businessFunctions.colCritical"),
            render: (r) => (
              <StatusBadge tone={toneFromLevel(r.critical_or_important)}>
                {translateStatus(r.critical_or_important)}
              </StatusBadge>
            ),
          },
          {
            key: "status",
            header: t("pages.businessFunctions.colStatus"),
            render: (r) => translateStatus(r.status),
          },
        ]}
        data={data}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
      />
    </ModuleGate>
  );
}

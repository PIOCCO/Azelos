import { useLocale } from "../../lib/useLocale";

const styles: Record<string, string> = {
  draft: "bg-ink-100 text-ink-700",
  pending: "bg-amber-50 text-amber-800",
  published: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-800",
  archived: "bg-stone-200 text-stone-700",
};

export default function ProjectStatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const key = status in styles ? status : "draft";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${styles[key]}`}>
      {t(`ownerPortal.projectStatus.${key}`)}
    </span>
  );
}

import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";

const SECTIONS = [
  {
    title: "DORA configuration",
    description: "Enable DORA modules and align platform scope with your regulatory profile.",
    to: "/settings/dora",
  },
  {
    title: "Users & access",
    description: "Invite users and assign roles using the existing RBAC model.",
    to: "/settings/access",
  },
  {
    title: "Integrations",
    description: "Connect optional external systems (PostgreSQL, HTTP APIs) for hosted SaaS operation.",
    to: "/settings/integrations",
  },
  {
    title: "Cloud environment",
    description: "Azure accounts and discovered resources for resilience and ICT inventory views.",
    to: "/settings/cloud",
  },
  {
    title: "Custom fields",
    description: "Extend supported entity registers with organization-specific field definitions.",
    to: "/settings/custom-fields",
  },
] as const;

export function SettingsOverviewPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Organization identity and regulatory classification are managed under{" "}
        <Link to="/organization/profile" className="text-primary underline">
          Organization profile
        </Link>
        . Operational audit events are under{" "}
        <Link to="/audit-log" className="text-primary underline">
          Audit log
        </Link>
        .
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link key={s.to} to={s.to} className="block transition hover:opacity-90">
            <Card title={s.title}>
              <p className="text-sm text-gray-600">{s.description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-primary">Open →</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

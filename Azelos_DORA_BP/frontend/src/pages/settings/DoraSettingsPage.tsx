import { Link } from "react-router-dom";
import { ModulesConfigPage } from "../config/ModulesConfigPage";
import { Card } from "../../components/ui/Card";

/** DORA module toggles + pointer to applicability (read-only outcome). */
export function DoraSettingsPage() {
  return (
    <div className="space-y-6">
      <Card title="Module applicability">
        <p className="text-sm text-gray-600">
          Applicability is computed from your{" "}
          <Link to="/organization/profile" className="text-primary underline">
            regulatory profile
          </Link>
          . Review the effective modules and matched rules (read-only).
        </p>
        <Link
          to="/onboarding/applicability"
          className="mt-3 inline-block text-sm font-medium text-primary underline"
        >
          View applicability
        </Link>
      </Card>
      <ModulesConfigPage embedded />
    </div>
  );
}

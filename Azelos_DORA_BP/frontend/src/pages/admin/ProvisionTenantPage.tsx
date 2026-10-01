import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import { provisionTenant } from "../../api/dora";
import { useAuth } from "../../contexts/AuthContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/States";

/** Platform operator: create a new customer organization and org admin (SUPER_ADMIN only). */
export function ProvisionTenantPage() {
  const { session, establishSession } = useAuth();
  const navigate = useNavigate();
  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("DE");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session?.role !== "SUPER_ADMIN") {
    return (
      <ErrorState
        title="Platform administration"
        message="Only a super administrator can provision new customer organizations."
      />
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await provisionTenant({
        legal_name: legalName,
        country_code: country,
        admin_email: adminEmail,
        admin_password: adminPassword,
      });
      establishSession(
        {
          access_token: res.access_token,
          token_type: "bearer",
          organization_id: res.organization_id,
          role: "ORG_ADMIN",
        },
        adminEmail,
      );
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Provisioning failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Provision customer organization"
        subtitle="Creates a new tenant, org admin user, and baseline DORA configuration."
      />
      <Card>
        <form className="max-w-lg space-y-4 text-sm" onSubmit={onSubmit}>
          <label className="block">
            Legal name
            <input
              required
              className="mt-1 w-full rounded border px-2 py-1"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
            />
          </label>
          <label className="block">
            Country (ISO2)
            <input
              required
              maxLength={2}
              className="mt-1 w-20 rounded border px-2 py-1"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
            />
          </label>
          <label className="block">
            Org admin email
            <input
              type="email"
              required
              className="mt-1 w-full rounded border px-2 py-1"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </label>
          <label className="block">
            Org admin password (min 12 chars)
            <input
              type="password"
              required
              minLength={12}
              className="mt-1 w-full rounded border px-2 py-1"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </label>
          {error ? <ErrorState title="Error" message={error} /> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Provisioning…" : "Create organization"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

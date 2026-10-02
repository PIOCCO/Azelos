import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { AcceptInvitePage } from "./pages/AcceptInvitePage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ApplicabilityPage } from "./pages/ApplicabilityPage";
import { RequirementsPage } from "./pages/RequirementsPage";
import { IncidentsPage } from "./pages/entity/IncidentsPage";
import { IncidentDetailPage } from "./pages/entity/IncidentDetailPage";
import { ProviderDetailPage } from "./pages/entity/ProviderDetailPage";
import { AuditLogPage } from "./pages/admin/AuditLogPage";
import { BusinessFunctionsPage } from "./pages/entity/BusinessFunctionsPage";
import { ICTAssetsPage } from "./pages/entity/ICTAssetsPage";
import { SimpleListPage } from "./pages/entity/SimpleListPage";
import { OperationalListPage } from "./pages/entity/OperationalListPage";
import { ControlsPage } from "./pages/entity/ControlsPage";
import { ProvidersPage } from "./pages/entity/ProvidersPage";
import { ContractsPage } from "./pages/entity/ContractsPage";
import { ContractDetailPage } from "./pages/entity/ContractDetailPage";
import { ICTServicesPage } from "./pages/entity/ICTServicesPage";
import { ICTServiceDetailPage } from "./pages/entity/ICTServiceDetailPage";
import { SubOutsourcingPage } from "./pages/entity/SubOutsourcingPage";
import { ProvisionTenantPage } from "./pages/admin/ProvisionTenantPage";
import { RisksPage } from "./pages/entity/RisksPage";
import { RiskDetailPage } from "./pages/entity/RiskDetailPage";
import { ModulesConfigPage } from "./pages/config/ModulesConfigPage";
import { CustomFieldsPage } from "./pages/config/CustomFieldsPage";
import { IntegrationsConfigPage } from "./pages/config/IntegrationsConfigPage";
import type { InformationAsset } from "./api/types";
import { BusinessServicesPage } from "./pages/resilience/BusinessServicesPage";
import { CloudEnvironmentPage } from "./pages/resilience/CloudEnvironmentPage";
import { DoraHubPage } from "./pages/resilience/DoraHubPage";
import { RelationshipMapPage } from "./pages/dora/RelationshipMapPage";
import { ResilienceHubPage } from "./pages/resilience/ResilienceHubPage";
import { SimpleResilienceListPage } from "./pages/resilience/SimpleResilienceListPage";
import { ReportsPage } from "./pages/resilience/ReportsPage";
import { EvidencePage } from "./pages/entity/EvidencePage";
import { BiaPage } from "./pages/entity/BiaPage";
import { MembersPage } from "./pages/admin/MembersPage";
import { OnboardingWizardPage } from "./pages/onboarding/OnboardingWizardPage";
import { DependenciesPage } from "./pages/entity/DependenciesPage";
import { useState } from "react";

function ResilienceTestsRoute() {
  const [testKind, setTestKind] = useState("scenario");
  return (
    <OperationalListPage<{ id: string; title: string; status: string; test_kind: string }>
      pageTitle="Resilience tests"
      path="/api/v1/resilience-tests"
      queryKey="resilience-tests"
      createLabel="New resilience test"
      buildCreateBody={(title) => ({ title, test_kind: testKind })}
      moduleItem={{ label: "Resilience testing", moduleKey: "RESILIENCE_TESTING" }}
      extraCreateFields={
        <label className="block text-sm">
          <span className="text-gray-600">Test kind</span>
          <select
            className="mt-1 rounded border px-2 py-1"
            value={testKind}
            onChange={(e) => setTestKind(e.target.value)}
          >
            <option value="scenario">Scenario</option>
            <option value="business_continuity">Business continuity</option>
            <option value="disaster_recovery">Disaster recovery</option>
            <option value="penetration_test">Penetration test</option>
            <option value="tlpt">TLPT</option>
          </select>
        </label>
      }
      columns={[
        { key: "title", header: "Title", render: (r) => r.title },
        { key: "kind", header: "Kind", render: (r) => r.test_kind },
        { key: "status", header: "Status", render: (r) => r.status },
      ]}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="business-services" element={<BusinessServicesPage />} />
          <Route path="cloud-environment" element={<CloudEnvironmentPage />} />
          <Route path="resilience" element={<ResilienceHubPage />} />
          <Route path="dora" element={<Navigate to="/dora/overview" replace />} />
          <Route path="dora/overview" element={<DoraHubPage />} />
          <Route path="dora/relationship-map" element={<RelationshipMapPage />} />
          <Route
            path="findings"
            element={
              <SimpleResilienceListPage<{ id: string; title: string; severity: string; status: string }>
                title="Findings"
                path="/api/v1/resilience/findings"
                queryKey="findings"
                columns={[
                  { key: "title", header: "Title", render: (r) => r.title },
                  { key: "severity", header: "Severity", render: (r) => r.severity },
                  { key: "status", header: "Status", render: (r) => r.status },
                ]}
              />
            }
          />
          <Route
            path="remediation"
            element={
              <SimpleResilienceListPage<{
                id: string;
                title: string;
                status: string;
                owner?: string | null;
              }>
                title="Remediation"
                path="/api/v1/resilience/remediation"
                queryKey="remediation"
                columns={[
                  { key: "title", header: "Action", render: (r) => r.title },
                  { key: "status", header: "Status", render: (r) => r.status },
                  { key: "owner", header: "Owner", render: (r) => r.owner ?? "—" },
                ]}
              />
            }
          />
          <Route
            path="resilience-evidence"
            element={
              <SimpleResilienceListPage<{
                id: string;
                title: string;
                source_kind: string;
                provenance: string;
              }>
                title="Resilience evidence"
                path="/api/v1/resilience/evidence"
                queryKey="resilience-evidence"
                columns={[
                  { key: "title", header: "Title", render: (r) => r.title },
                  { key: "source", header: "Source", render: (r) => r.source_kind },
                  { key: "prov", header: "Provenance", render: (r) => r.provenance },
                ]}
              />
            }
          />
          <Route
            path="recovery-tests"
            element={
              <SimpleResilienceListPage<{
                id: string;
                scenario: string;
                outcome: string;
                target_rto_minutes?: number | null;
              }>
                title="Recovery tests"
                path="/api/v1/resilience/recovery-tests"
                queryKey="recovery-tests"
                columns={[
                  { key: "scenario", header: "Scenario", render: (r) => r.scenario },
                  { key: "outcome", header: "Outcome", render: (r) => r.outcome },
                  { key: "rto", header: "Target RTO", render: (r) => r.target_rto_minutes ?? "—" },
                ]}
              />
            }
          />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="onboarding" element={<OnboardingWizardPage />} />
          <Route path="onboarding/profile" element={<ProfilePage />} />
          <Route path="dependencies" element={<DependenciesPage />} />
          <Route path="onboarding/applicability" element={<ApplicabilityPage />} />
          <Route path="requirements" element={<RequirementsPage />} />
          <Route path="business-functions" element={<BusinessFunctionsPage />} />
          <Route
            path="information-assets"
            element={
              <SimpleListPage<InformationAsset>
                title="Information assets"
                path="/api/v1/information-assets"
                queryKey="information-assets"
                moduleItem={{ label: "Information assets", moduleKey: "ASSET_MANAGEMENT" }}
                columns={[
                  { key: "name", header: "Name", render: (r) => r.name },
                  { key: "id", header: "Identifier", render: (r) => r.asset_identifier },
                ]}
              />
            }
          />
          <Route path="ict-assets" element={<ICTAssetsPage />} />
          <Route path="ict-providers" element={<ProvidersPage />} />
          <Route path="ict-providers/:providerId" element={<ProviderDetailPage />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="contracts/:contractId" element={<ContractDetailPage />} />
          <Route path="ict-services" element={<ICTServicesPage />} />
          <Route path="ict-services/:serviceId" element={<ICTServiceDetailPage />} />
          <Route path="sub-outsourcing" element={<SubOutsourcingPage />} />
          <Route path="risks" element={<RisksPage />} />
          <Route path="risks/:riskId" element={<RiskDetailPage />} />
          <Route path="controls" element={<ControlsPage />} />
          <Route path="evidence" element={<EvidencePage />} />
          <Route path="bia" element={<BiaPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="incidents/:incidentId" element={<IncidentDetailPage />} />
          <Route
            path="business-continuity"
            element={
              <OperationalListPage<{ id: string; name: string; status: string; owner?: string | null }>
                pageTitle="Business continuity plans"
                path="/api/v1/business-continuity"
                queryKey="business-continuity"
                createLabel="New continuity plan"
                buildCreateBody={(name) => ({ name })}
                moduleItem={{ label: "Business continuity", moduleKey: "BUSINESS_CONTINUITY" }}
                columns={[
                  { key: "name", header: "Plan", render: (r) => r.name },
                  { key: "status", header: "Status", render: (r) => r.status },
                  { key: "owner", header: "Owner", render: (r) => r.owner ?? "—" },
                ]}
              />
            }
          />
          <Route
            path="disaster-recovery"
            element={
              <OperationalListPage<{ id: string; name: string; status: string; owner?: string | null }>
                pageTitle="Disaster recovery plans"
                path="/api/v1/disaster-recovery"
                queryKey="disaster-recovery"
                createLabel="New disaster recovery plan"
                buildCreateBody={(name) => ({ name })}
                moduleItem={{ label: "Disaster recovery", moduleKey: "DISASTER_RECOVERY" }}
                columns={[
                  { key: "name", header: "Plan", render: (r) => r.name },
                  { key: "status", header: "Status", render: (r) => r.status },
                  { key: "owner", header: "Owner", render: (r) => r.owner ?? "—" },
                ]}
              />
            }
          />
          <Route
            path="resilience-tests"
            element={
              <ResilienceTestsRoute />
            }
          />
          <Route
            path="tlpt"
            element={
              <OperationalListPage<{ id: string; name: string; status: string; owner?: string | null }>
                pageTitle="TLPT exercises"
                path="/api/v1/tlpt"
                queryKey="tlpt"
                createLabel="New TLPT exercise"
                buildCreateBody={(name) => ({ name })}
                moduleItem={{ label: "TLPT", moduleKey: "INCIDENT_MANAGEMENT" }}
                columns={[
                  { key: "name", header: "Exercise", render: (r) => r.name },
                  { key: "status", header: "Status", render: (r) => r.status },
                  { key: "owner", header: "Owner", render: (r) => r.owner ?? "—" },
                ]}
              />
            }
          />
          <Route path="admin/members" element={<MembersPage />} />
          <Route path="admin/provision" element={<ProvisionTenantPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="configuration/integrations" element={<IntegrationsConfigPage />} />
          <Route path="configuration/modules" element={<ModulesConfigPage />} />
          <Route path="configuration/custom-fields" element={<CustomFieldsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

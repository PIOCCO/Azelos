import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
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
import { ControlsPage } from "./pages/entity/ControlsPage";
import { ProvidersPage } from "./pages/entity/ProvidersPage";
import { RisksPage } from "./pages/entity/RisksPage";
import { RiskDetailPage } from "./pages/entity/RiskDetailPage";
import { ModulesConfigPage } from "./pages/config/ModulesConfigPage";
import { CustomFieldsPage } from "./pages/config/CustomFieldsPage";
import type {
  Contract,
  Evidence,
  ICTService,
  InformationAsset,
  SubOutsourcing,
} from "./api/types";
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
          <Route path="onboarding/profile" element={<ProfilePage />} />
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
          <Route
            path="contracts"
            element={
              <SimpleListPage<Contract>
                title="Contractual arrangements"
                path="/api/v1/contracts"
                queryKey="contracts"
                moduleItem={{ label: "Contracts", moduleKey: "THIRD_PARTY_RISK" }}
                columns={[
                  { key: "ref", header: "Reference", render: (r) => r.reference_number },
                  { key: "type", header: "Type", render: (r) => r.contract_type },
                  { key: "status", header: "Status", render: (r) => r.status },
                ]}
              />
            }
          />
          <Route
            path="ict-services"
            element={
              <SimpleListPage<ICTService>
                title="ICT services"
                path="/api/v1/ict-services"
                queryKey="ict-services"
                moduleItem={{ label: "ICT services", moduleKey: "THIRD_PARTY_RISK" }}
                columns={[
                  { key: "name", header: "Name", render: (r) => r.name },
                  { key: "crit", header: "Supports C/I", render: (r) => r.supports_critical_or_important },
                  { key: "status", header: "Status", render: (r) => r.status },
                ]}
              />
            }
          />
          <Route
            path="sub-outsourcing"
            element={
              <SimpleListPage<SubOutsourcing>
                title="Sub-outsourcing"
                path="/api/v1/sub-outsourcing"
                queryKey="sub-outsourcing"
                moduleItem={{ label: "Sub-outsourcing", moduleKey: "THIRD_PARTY_RISK" }}
                columns={[
                  { key: "name", header: "Legal name", render: (r) => r.legal_name },
                  { key: "depth", header: "Depth", render: (r) => r.depth_rank },
                  { key: "status", header: "Status", render: (r) => r.status },
                ]}
              />
            }
          />
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
              <SimpleListPage<{ id: string; name: string; status: string; owner?: string | null }>
                title="Business continuity plans"
                path="/api/v1/business-continuity"
                queryKey="business-continuity"
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
              <SimpleListPage<{ id: string; name: string; status: string; owner?: string | null }>
                title="Disaster recovery plans"
                path="/api/v1/disaster-recovery"
                queryKey="disaster-recovery"
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
              <SimpleListPage<{ id: string; title: string; status: string; test_kind: string }>
                title="Resilience tests"
                path="/api/v1/resilience-tests"
                queryKey="resilience-tests"
                moduleItem={{ label: "Resilience testing", moduleKey: "RESILIENCE_TESTING" }}
                columns={[
                  { key: "title", header: "Title", render: (r) => r.title },
                  { key: "kind", header: "Kind", render: (r) => r.test_kind },
                  { key: "status", header: "Status", render: (r) => r.status },
                ]}
              />
            }
          />
          <Route
            path="tlpt"
            element={
              <SimpleListPage<{ id: string; name: string; status: string; owner?: string | null }>
                title="TLPT exercises"
                path="/api/v1/tlpt"
                queryKey="tlpt"
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
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="configuration/modules" element={<ModulesConfigPage />} />
          <Route path="configuration/custom-fields" element={<CustomFieldsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

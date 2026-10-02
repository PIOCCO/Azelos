import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createHttpIntegration,
  createPostgresqlIntegration,
  disableIntegration,
  listIntegrations,
  testIntegration,
  updatePostgresqlIntegration,
} from "../../api/dora";
import type { TenantIntegration } from "../../api/types";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../lib/permissions";
import { Navigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ErrorPanel, LoadingPanel } from "../../components/ui/StatePanel";

function statusLabel(status: string) {
  switch (status) {
    case "connected":
      return "Connected";
    case "connection_failed":
      return "Connection failed";
    case "connecting":
      return "Connecting";
    case "disabled":
      return "Disabled";
    default:
      return "Not configured";
  }
}

function cfgStr(config: Record<string, unknown>, key: string, fallback = ""): string {
  const v = config[key];
  if (v === undefined || v === null) return fallback;
  return String(v);
}

function statusTone(status: string) {
  if (status === "connected") return "text-green-700 bg-green-50";
  if (status === "connection_failed") return "text-red-700 bg-red-50";
  if (status === "disabled") return "text-gray-600 bg-gray-100";
  return "text-amber-800 bg-amber-50";
}

export function IntegrationsConfigPage({ embedded = false }: { embedded?: boolean }) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["integrations"], queryFn: listIntegrations });

  const [pgHost, setPgHost] = useState("");
  const [pgPort, setPgPort] = useState("5432");
  const [pgDb, setPgDb] = useState("");
  const [pgUser, setPgUser] = useState("");
  const [pgPassword, setPgPassword] = useState("");
  const [pgSsl, setPgSsl] = useState("prefer");
  const [httpName, setHttpName] = useState("");
  const [httpUrl, setHttpUrl] = useState("");
  const [httpKey, setHttpKey] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const pgRow = (q.data ?? []).find((i) => i.integration_type === "postgresql");
  const httpRows = (q.data ?? []).filter((i) => i.integration_type === "http_api");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["integrations"] });

  const savePgM = useMutation({
    mutationFn: () =>
      pgRow
        ? updatePostgresqlIntegration(pgRow.id, {
            name: "PostgreSQL",
            host: pgHost,
            port: Number(pgPort),
            database: pgDb,
            username: pgUser,
            password: pgPassword || undefined,
            ssl_mode: pgSsl,
          })
        : createPostgresqlIntegration({
            name: "PostgreSQL",
            host: pgHost,
            port: Number(pgPort),
            database: pgDb,
            username: pgUser,
            password: pgPassword,
            ssl_mode: pgSsl,
          }),
    onSuccess: () => {
      setPgPassword("");
      setMsg("PostgreSQL settings saved.");
      invalidate();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const testM = useMutation({
    mutationFn: (id: string) => testIntegration(id),
    onSuccess: (res) => {
      setMsg(res.message);
      invalidate();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const saveHttpM = useMutation({
    mutationFn: () =>
      createHttpIntegration({
        name: httpName,
        base_url: httpUrl,
        auth_type: httpKey ? "bearer" : "none",
        api_key: httpKey || undefined,
      }),
    onSuccess: () => {
      setHttpKey("");
      setHttpName("");
      setHttpUrl("");
      setMsg("External system saved.");
      invalidate();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  if (!embedded && !can(session?.role, "org.admin")) {
    return <Navigate to="/" replace />;
  }
  if (q.isLoading) return <LoadingPanel />;
  if (q.error) return <ErrorPanel message={(q.error as Error).message} />;

  return (
    <div className="max-w-3xl space-y-6">
      {!embedded ? (
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
          <p className="mt-1 text-sm text-gray-600">
            Optional connections to external systems. Credentials are stored encrypted server-side and are never
            shown after save. Azure subscriptions are configured under Cloud environment.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Connect optional PostgreSQL or HTTP APIs. Tests run from the hosted service. For Azure, use{" "}
          <span className="font-medium">Settings → Cloud environment</span>.
        </p>
      )}

      <section className="rounded-lg border border-gray-200 bg-white shadow-card">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold">PostgreSQL</h2>
          {pgRow ? (
            <p className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${statusTone(pgRow.status)}`}>
              {statusLabel(pgRow.status)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">Status: Not configured</p>
          )}
          {pgRow?.last_test_at ? (
            <p className="mt-1 text-xs text-gray-500">
              Last test: {new Date(pgRow.last_test_at).toLocaleString()}
              {pgRow.last_test_message ? ` — ${pgRow.last_test_message}` : ""}
            </p>
          ) : null}
        </div>
        <form
          className="space-y-3 px-5 py-4 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            savePgM.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              Host
              <input
                required
                className="mt-1 w-full rounded border px-2 py-1"
                value={pgHost || (pgRow ? cfgStr(pgRow.config, "host") : "")}
                onChange={(e) => setPgHost(e.target.value)}
              />
            </label>
            <label className="block">
              Port
              <input
                required
                type="number"
                className="mt-1 w-full rounded border px-2 py-1"
                value={pgPort || (pgRow ? cfgStr(pgRow.config, "port", "5432") : "5432")}
                onChange={(e) => setPgPort(e.target.value)}
              />
            </label>
            <label className="block">
              Database
              <input
                required
                className="mt-1 w-full rounded border px-2 py-1"
                value={pgDb || (pgRow ? cfgStr(pgRow.config, "database") : "")}
                onChange={(e) => setPgDb(e.target.value)}
              />
            </label>
            <label className="block">
              Username
              <input
                required
                className="mt-1 w-full rounded border px-2 py-1"
                value={pgUser || (pgRow ? cfgStr(pgRow.config, "username") : "")}
                onChange={(e) => setPgUser(e.target.value)}
              />
            </label>
            <label className="block sm:col-span-2">
              Password
              <input
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded border px-2 py-1"
                placeholder={pgRow ? "Leave blank to keep existing password" : "Required"}
                value={pgPassword}
                onChange={(e) => setPgPassword(e.target.value)}
              />
            </label>
            <label className="block">
              SSL mode
              <select
                className="mt-1 w-full rounded border px-2 py-1"
                value={pgSsl || (pgRow ? cfgStr(pgRow.config, "ssl_mode", "prefer") : "prefer")}
                onChange={(e) => setPgSsl(e.target.value)}
              >
                <option value="disable">disable</option>
                <option value="prefer">prefer</option>
                <option value="require">require</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={savePgM.isPending}>
              Save connection
            </Button>
            {pgRow ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={testM.isPending}
                  onClick={() => testM.mutate(pgRow.id)}
                >
                  Test connection
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => disableIntegration(pgRow.id).then(invalidate)}
                >
                  Disable
                </Button>
              </>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-card">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold">External systems (HTTP API)</h2>
        </div>
        <ul className="divide-y divide-gray-100 px-5 text-sm">
          {httpRows.length === 0 ? (
            <li className="py-3 text-gray-500">No external HTTP integrations configured.</li>
          ) : (
            httpRows.map((row: TenantIntegration) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-gray-500">{cfgStr(row.config, "base_url")}</p>
                  <span className={`text-xs ${statusTone(row.status)} rounded px-1.5 py-0.5`}>
                    {statusLabel(row.status)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button type="button" variant="secondary" className="text-xs" onClick={() => testM.mutate(row.id)}>
                    Test
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => disableIntegration(row.id).then(invalidate)}
                  >
                    Disable
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
        <form
          className="space-y-3 border-t border-gray-100 px-5 py-4 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            saveHttpM.mutate();
          }}
        >
          <p className="font-medium">Add external system</p>
          <label className="block">
            System name
            <input
              required
              className="mt-1 w-full rounded border px-2 py-1"
              value={httpName}
              onChange={(e) => setHttpName(e.target.value)}
            />
          </label>
          <label className="block">
            Endpoint (base URL)
            <input
              required
              type="url"
              className="mt-1 w-full rounded border px-2 py-1"
              value={httpUrl}
              onChange={(e) => setHttpUrl(e.target.value)}
            />
          </label>
          <label className="block">
            API key (optional)
            <input
              type="password"
              className="mt-1 w-full rounded border px-2 py-1"
              value={httpKey}
              onChange={(e) => setHttpKey(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={saveHttpM.isPending}>
            Save
          </Button>
        </form>
      </section>

      {msg ? <p className="text-sm text-gray-700">{msg}</p> : null}
    </div>
  );
}

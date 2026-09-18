import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { clearSession } from "../api";

export default function Settings() {
  const { meta, session } = useApp();
  return (
    <>
      <PageHeader title="Settings" breadcrumb="Platform" />
      <div className="card">
        <p>Environment: {meta?.environment ?? "—"}</p>
        <p>Authentication: {meta?.auth_mode ?? "—"}</p>
        <p>Role: {session.role}</p>
        <button
          type="button"
          onClick={() => {
            clearSession();
            window.location.href = "/login";
          }}
        >
          Sign out
        </button>
      </div>
    </>
  );
}

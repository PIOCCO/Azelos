import { FormEvent, useState } from "react";
import { api, clearSession } from "../api";
import { PRODUCT_NAME } from "../brand";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    clearSession();
    try {
      const data = await api<{ access_token: string; tenant_id: string | null; role: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("atlas_token", data.access_token);
      localStorage.setItem("atlas_role", data.role);
      localStorage.setItem("atlas_tenant", data.tenant_id || "tenant-demo");
      onLogin();
      if (data.role === "CUSTOMER_ADMIN" || data.role === "CUSTOMER_VIEWER") {
        window.location.href = "/customer";
      }
    } catch {
      setError("Invalid credentials or access denied.");
    }
  };

  return (
    <form className="card login" onSubmit={submit}>
      <h2>{PRODUCT_NAME}</h2>
      <p className="muted">Sign in with your organization account</p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        autoComplete="current-password"
      />
      <p className="muted small">Local development uses seeded credentials documented in DEPLOYMENT.md only.</p>
      {error && <p className="bad">{error}</p>}
      <button type="submit">Sign in</button>
    </form>
  );
}

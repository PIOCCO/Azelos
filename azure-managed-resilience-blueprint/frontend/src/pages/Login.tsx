import { FormEvent, useState } from "react";
import { api } from "../api";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("provider@example.com");
  const [password, setPassword] = useState("Provider123!");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await api<{ access_token: string; tenant_id: string | null }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("amrf_token", data.access_token);
      localStorage.setItem("amrf_tenant", data.tenant_id || "tenant-demo");
      onLogin();
    } catch {
      setError("Login failed");
    }
  };

  return (
    <form className="card login" onSubmit={submit}>
      <h2>Provider / Admin login</h2>
      <p className="muted">Dev Entra ID stub — use seeded credentials</p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      {error && <p className="bad">{error}</p>}
      <button type="submit">Sign in</button>
    </form>
  );
}

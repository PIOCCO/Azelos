import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { acceptInvitation } from "../api/dora";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/States";

export function AcceptInvitePage() {
  const { establishSession } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tokenFromUrl = params.get("token") ?? "";
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await acceptInvitation(token, password, fullName || undefined);
      establishSession(res, emailHint || "team-member");
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not accept invitation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border bg-white p-6 shadow-card">
        <h1 className="text-xl font-semibold text-gray-900">Accept team invitation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Paste the invite token from your administrator and choose a password (12+ characters).
        </p>
        {error ? (
          <div className="mt-4">
            <ErrorState title="Invitation failed" message={error} />
          </div>
        ) : null}
        <label className="mt-4 block text-sm font-medium text-gray-700">
          Invite token
          <input
            required
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-gray-700">
          Your email (for display only)
          <input
            type="email"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            value={emailHint}
            onChange={(e) => setEmailHint(e.target.value)}
            placeholder="you@company.com"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-gray-700">
          Full name (optional)
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-gray-700">
          Password
          <input
            type="password"
            required
            minLength={12}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <Button type="submit" disabled={loading} className="mt-6 w-full">
          {loading ? "Creating account…" : "Join organization"}
        </Button>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

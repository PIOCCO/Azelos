import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../api/client";
import { getLoginOptions } from "../api/dora";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/States";
import {
  buildEntraAuthorizeUrl,
  parseIdTokenFromHash,
  storeOidcNonce,
} from "../lib/oidc";

export function LoginPage() {
  const { session, login, loginWithOidc } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("admin@demo.bank");
  const [password, setPassword] = useState("ChangeMeNow!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const optionsQ = useQuery({
    queryKey: ["login-options"],
    queryFn: getLoginOptions,
    staleTime: 60_000,
  });

  useEffect(() => {
    const idToken = parseIdTokenFromHash();
    if (!idToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        await loginWithOidc(idToken);
        if (!cancelled) navigate(from, { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Microsoft sign-in failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from, loginWithOidc, navigate]);

  if (session) return <Navigate to={from} replace />;

  const oidc = optionsQ.data;
  const canMicrosoft =
    oidc?.oidc_enabled && oidc.oidc_client_id && oidc.oidc_issuer_url;

  function startMicrosoftSignIn() {
    if (!canMicrosoft) return;
    const nonce = crypto.randomUUID();
    storeOidcNonce(nonce);
    const redirectUri = `${window.location.origin}/login`;
    window.location.href = buildEntraAuthorizeUrl(
      oidc!.oidc_issuer_url!,
      oidc!.oidc_client_id!,
      redirectUri,
      nonce,
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-sidebar p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-xl font-bold">D</div>
          <span className="text-xl font-semibold">DORA Blueprint</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">Business resilience & ICT risk</h1>
          <p className="mt-4 max-w-md text-gray-300">
            Organization profile, applicability, and DORA-aligned registers connected to your FastAPI backend.
          </p>
        </div>
        <p className="text-sm text-gray-400">© Azelos DORA Blueprint</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900">Sign in</h2>
          <p className="mt-1 text-sm text-gray-500">Use your organization credentials</p>
          {error ? (
            <div className="mt-4">
              <ErrorState title="Sign in failed" message={error} />
            </div>
          ) : null}
          {canMicrosoft ? (
            <>
              <Button
                type="button"
                variant="secondary"
                className="mt-6 w-full"
                disabled={loading}
                onClick={startMicrosoftSignIn}
              >
                Sign in with Microsoft
              </Button>
              <p className="my-4 text-center text-xs text-gray-400">or continue with email</p>
            </>
          ) : null}
          <label className="mt-2 block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-gray-700">
            Password
            <input
              type="password"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <Button type="submit" disabled={loading} className="mt-6 w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}

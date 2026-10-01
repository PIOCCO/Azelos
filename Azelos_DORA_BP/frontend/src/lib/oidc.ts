const NONCE_KEY = "dora.oidc.nonce";

export function storeOidcNonce(nonce: string) {
  sessionStorage.setItem(NONCE_KEY, nonce);
}

export function consumeOidcNonce(): string | null {
  const n = sessionStorage.getItem(NONCE_KEY);
  sessionStorage.removeItem(NONCE_KEY);
  return n;
}

export function parseIdTokenFromHash(): string | null {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return params.get("id_token");
}

export function buildEntraAuthorizeUrl(
  issuerUrl: string,
  clientId: string,
  redirectUri: string,
  nonce: string,
): string {
  const base = issuerUrl.replace(/\/$/, "");
  const url = new URL(`${base}/oauth2/v2.0/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "id_token");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("response_mode", "fragment");
  url.searchParams.set("nonce", nonce);
  return url.toString();
}

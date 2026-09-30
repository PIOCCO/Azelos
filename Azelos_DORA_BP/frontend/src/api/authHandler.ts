/** Global 401 handler — set from AuthProvider / router. */
let onUnauthorized: (() => void) | null = null;
let logoutScheduled = false;

export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export function notifyUnauthorized() {
  if (!onUnauthorized || logoutScheduled) return;
  logoutScheduled = true;
  globalThis.setTimeout(() => {
    logoutScheduled = false;
    onUnauthorized?.();
  }, 100);
}

export function clearUnauthorizedHandler() {
  onUnauthorized = null;
}

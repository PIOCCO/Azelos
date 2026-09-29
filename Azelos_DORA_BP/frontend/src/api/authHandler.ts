/** Global 401 handler — set from AuthProvider / router. */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export function notifyUnauthorized() {
  onUnauthorized?.();
}

export function clearUnauthorizedHandler() {
  onUnauthorized = null;
}

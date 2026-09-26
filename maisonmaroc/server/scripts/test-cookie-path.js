/**
 * Auth cookie Path scoping for /APIO deployments.
 */
import { resolveAuthCookiePath } from "../src/cookiePath.js";

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) {
    passed++;
    console.log(`OK  ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}`);
  }
}

function withEnv(overrides, fn) {
  const prev = {};
  for (const [k, v] of Object.entries(overrides)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

assert(
  "Default path when FRONTEND_URL has no pathname",
  withEnv({ COOKIE_PATH: undefined, FRONTEND_URL: "http://localhost:5173" }, () =>
    resolveAuthCookiePath() === "/",
  ),
);

assert(
  "Path derived from FRONTEND_URL /APIO",
  withEnv(
    { COOKIE_PATH: undefined, FRONTEND_URL: "https://dribex.ma/APIO" },
    () => resolveAuthCookiePath() === "/APIO",
  ),
);

assert(
  "COOKIE_PATH override",
  withEnv({ COOKIE_PATH: "/APIO", FRONTEND_URL: "https://example.com" }, () =>
    resolveAuthCookiePath() === "/APIO",
  ),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

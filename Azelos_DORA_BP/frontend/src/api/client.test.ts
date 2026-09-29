import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ApiError, apiRequest, setTokenProvider } from "./client";
import { clearUnauthorizedHandler, setUnauthorizedHandler } from "./authHandler";

describe("apiRequest", () => {
  beforeEach(() => {
    setTokenProvider(() => "test-token");
    clearUnauthorizedHandler();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearUnauthorizedHandler();
  });

  it("returns JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      }),
    );
    const data = await apiRequest<{ ok: boolean }>("/api/v1/test");
    expect(data.ok).toBe(true);
  });

  it("maps 403 to ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () =>
          JSON.stringify({ error: { code: "FORBIDDEN", message: "Permission denied" } }),
      }),
    );
    await expect(apiRequest("/x")).rejects.toMatchObject({
      status: 403,
      message: "Permission denied",
    } satisfies Partial<ApiError>);
  });

  it("maps 422 validation detail string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        statusText: "Unprocessable",
        text: async () => JSON.stringify({ detail: "Invalid field" }),
      }),
    );
    await expect(apiRequest("/x")).rejects.toMatchObject({ status: 422, message: "Invalid field" });
  });

  it("calls unauthorized handler on 401", async () => {
    const fn = vi.fn();
    setUnauthorizedHandler(fn);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => JSON.stringify({ detail: "Invalid token" }),
      }),
    );
    await expect(apiRequest("/x")).rejects.toMatchObject({ status: 401 });
    expect(fn).toHaveBeenCalledOnce();
  });

  it("maps 500 to ApiError without leaking stack", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Error",
        text: async () => JSON.stringify({ error: { message: "Internal server error" } }),
      }),
    );
    await expect(apiRequest("/x")).rejects.toMatchObject({ status: 500 });
  });
});

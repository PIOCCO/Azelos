import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ApiError, apiRequest, setTokenProvider } from "./client";

describe("apiRequest", () => {
  beforeEach(() => {
    setTokenProvider(() => "test-token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
});

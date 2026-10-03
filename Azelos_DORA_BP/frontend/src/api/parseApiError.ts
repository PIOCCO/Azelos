import type { ApiErrorBody } from "./types";

export type ParsedApiError = {
  message: string;
  code?: string;
};

/** FastAPI may return detail as a string or structured object (e.g. policy gate). */
export function parseApiErrorBody(
  body: ApiErrorBody | undefined,
  statusText: string,
): ParsedApiError {
  if (body?.error?.message) {
    return { message: body.error.message, code: body.error.code };
  }
  const detail = body?.detail;
  if (typeof detail === "string") {
    return { message: detail };
  }
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const d = detail as { code?: string; message?: string };
    if (d.message || d.code) {
      return {
        message: d.message ?? statusText,
        code: d.code,
      };
    }
  }
  return { message: statusText || "Request failed" };
}

export function isPolicyAcceptanceRequired(code: string | undefined): boolean {
  return code === "POLICY_ACCEPTANCE_REQUIRED";
}

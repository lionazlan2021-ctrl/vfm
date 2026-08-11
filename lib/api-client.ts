import type { ApiErrorBody } from "@/types";

/**
 * Browser-side fetch wrapper.
 *
 * Every API route answers with `{ error, code }` on failure, so this turns a
 * non-2xx response into a thrown `ApiRequestError` carrying the message the
 * server intended the user to see. Callers previously read `data.id` straight
 * off failed responses and wrote `undefined` into component state.
 *
 * Safe to import from client components — no server-only dependencies.
 */

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiRequestError("Network error. Check your connection and try again.", 0);
  }

  // 204 and empty bodies are valid successes with nothing to parse.
  const text = await res.text();
  let body: unknown = undefined;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new ApiRequestError("The server returned an unreadable response.", res.status);
    }
  }

  if (!res.ok) {
    const err = (body ?? {}) as ApiErrorBody;
    throw new ApiRequestError(
      err.error || "Something went wrong. Please try again.",
      res.status,
      err.code
    );
  }

  return body as T;
}

/** Convenience for a write request with a JSON body. */
export function apiSend<T>(
  url: string,
  method: "POST" | "DELETE" | "PUT" | "PATCH",
  payload: unknown
) {
  return apiFetch<T>(url, { method, body: JSON.stringify(payload) });
}

export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (err instanceof ApiRequestError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

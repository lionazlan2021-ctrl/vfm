import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { ApiError, STATUS_BY_CODE, type ErrorCode } from "./errors";

/**
 * Every API route in this app answers with the same two shapes:
 *
 *   success -> whatever the route returns, as a plain JSON object
 *   failure -> { error: string, code: ErrorCode, details?: string[] }
 *
 * `error` is always safe to show a user directly. Internal messages and stack
 * traces never cross this boundary — they go to the server log instead.
 */

export { ApiError };
export type { ErrorCode };

export function apiError(
  code: ErrorCode,
  message: string,
  extra?: { details?: string[]; headers?: Record<string, string> }
) {
  return NextResponse.json(
    { error: message, code, ...(extra?.details ? { details: extra.details } : {}) },
    { status: STATUS_BY_CODE[code], headers: extra?.headers }
  );
}

/**
 * Reads and validates a JSON body. Rejects oversized payloads before parsing so
 * a large upload can't be used to exhaust memory.
 */
export async function readJson<T>(
  req: Request,
  schema: ZodSchema<T>,
  { maxBytes = 256 * 1024 }: { maxBytes?: number } = {}
): Promise<T> {
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > maxBytes) {
    throw new ApiError("payload_too_large", "That request is too large.");
  }

  const raw = await req.text();
  // content-length is client-supplied, so check the real thing too.
  if (raw.length > maxBytes) {
    throw new ApiError("payload_too_large", "That request is too large.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ApiError("bad_request", "Request body must be valid JSON.");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new ApiError("bad_request", firstIssue(result.error), issueList(result.error));
  }
  return result.data;
}

function firstIssue(err: ZodError): string {
  return err.issues[0]?.message || "Invalid input.";
}

function issueList(err: ZodError): string[] {
  return err.issues.map((i) => {
    const path = i.path.join(".");
    return path ? `${path}: ${i.message}` : i.message;
  });
}

/**
 * Wraps a route handler so no unexpected throw ever reaches the client as a
 * stack trace. Known failures (ApiError) keep their message; everything else
 * is logged server-side and reported as a generic 500.
 */
export function handle(
  routeName: string,
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  return fn().catch((err: unknown) => {
    if (err instanceof ApiError) {
      return apiError(err.code, err.message, { details: err.details });
    }
    console.error(`[${routeName}] unhandled error:`, err);
    return apiError("internal", "Something went wrong on our end. Please try again.");
  });
}

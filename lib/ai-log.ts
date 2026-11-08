import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { isMockMode } from "./ai";
import { costOf, emptyUsage, type AiUsage } from "./pricing";

/**
 * Records one paid AI request in the AiCall table, for the admin panel.
 *
 * Usage pattern in a route:
 *
 *   const call = startAiCall({ kind: "search", userId, plan, model, query });
 *   try {
 *     const result = await searchProducts({ ..., meter: call.usage });
 *     await call.succeeded();
 *   } catch (err) {
 *     await call.failed(err);
 *     throw err;
 *   }
 *
 * Logging must never break the request it describes, so every write swallows
 * its own errors (a missing table on a database that hasn't been migrated yet
 * included) and only reports them to the server log.
 */

export type AiCallKind = "search" | "chat";

export type AiCallInfo = {
  kind: AiCallKind;
  userId?: string | null;
  /** The plan id, or "anonymous" for visitors who aren't signed in. */
  plan: string;
  model: string;
  query?: string;
};

const MAX_QUERY_CHARS = 200;
const MAX_DETAIL_CHARS = 300;

export function startAiCall(info: AiCallInfo) {
  const usage: AiUsage = emptyUsage();
  const started = Date.now();
  let recorded = false;

  async function write(ok: boolean, errorCode?: string, errorDetail?: string) {
    if (recorded) return;
    recorded = true;
    // Sample mode makes no paid calls, so there is nothing to account for.
    if (isMockMode()) return;
    try {
      await prisma.aiCall.create({
        data: {
          kind: info.kind,
          userId: info.userId ?? null,
          plan: info.plan,
          model: info.model,
          query: info.query ? info.query.slice(0, MAX_QUERY_CHARS) : null,
          ...usage,
          costUsd: costOf(info.model, usage),
          ok,
          errorCode: errorCode ?? null,
          errorDetail: errorDetail ? errorDetail.slice(0, MAX_DETAIL_CHARS) : null,
          durationMs: Date.now() - started,
        },
      });
    } catch (err) {
      console.error("[ai-log] could not record AI call:", err);
    }
  }

  return {
    /** Pass as `meter` to searchProducts / askFollowUp. */
    usage,
    succeeded: () => write(true),
    failed: (err: unknown) => {
      if (err instanceof ApiError) {
        return write(false, err.code, err.internal ?? err.message);
      }
      return write(false, "internal", err instanceof Error ? err.message : String(err));
    },
  };
}

-- A log of every paid AI request (search or chat), signed in or not, succeeded
-- or failed. Purely additive: a new table, nothing existing is touched.

CREATE TABLE "AiCall" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "userId" TEXT,
    "plan" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "query" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "webSearches" INTEGER NOT NULL DEFAULT 0,
    "apiCalls" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ok" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "errorDetail" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiCall_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiCall_createdAt_idx" ON "AiCall"("createdAt");
CREATE INDEX "AiCall_userId_createdAt_idx" ON "AiCall"("userId", "createdAt");

-- SET NULL rather than CASCADE: deleting an account must not erase the record
-- of what its searches cost.
ALTER TABLE "AiCall" ADD CONSTRAINT "AiCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

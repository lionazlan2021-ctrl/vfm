-- Google sign-in and admin roles.
--
-- passwordHash becomes nullable because accounts created through Google never
-- have one. Existing rows already have a hash, so dropping NOT NULL is safe and
-- non-destructive — no data is rewritten.

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN "image" TEXT;

-- Defaults to 'user' so every existing account stays non-admin. Admins are
-- promoted deliberately (npm run role:set), never by default.
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- One Google account maps to exactly one user. Nulls don't collide in Postgres
-- unique indexes, so password-only accounts are unaffected.
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

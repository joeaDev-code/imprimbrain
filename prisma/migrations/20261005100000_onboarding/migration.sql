ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Existing accounts already passed their initial setup; only newly created accounts enter onboarding.
UPDATE "User" SET "onboardingCompleted" = true WHERE "createdAt" < CURRENT_TIMESTAMP;

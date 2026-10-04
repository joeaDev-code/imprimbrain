-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PENDING', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "orderId" DROP NOT NULL;
ALTER TABLE "Payment" ADD COLUMN "organizationId" UUID;
ALTER TABLE "Payment" ADD COLUMN "subscriptionId" UUID;
ALTER TABLE "Payment" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'XOF';
ALTER TABLE "Payment" ADD COLUMN "status" "PaymentStatus" NOT NULL DEFAULT 'PAID';
ALTER TABLE "Payment" ADD COLUMN "reference" TEXT;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");
CREATE INDEX "Payment_organizationId_paidAt_idx" ON "Payment"("organizationId", "paidAt");
CREATE INDEX "Payment_subscriptionId_paidAt_idx" ON "Payment"("subscriptionId", "paidAt");
CREATE INDEX "Subscription_organizationId_status_idx" ON "Subscription"("organizationId", "status");
CREATE INDEX "Subscription_expiresAt_idx" ON "Subscription"("expiresAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

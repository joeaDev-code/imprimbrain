CREATE TYPE "DebtAccountType" AS ENUM ('RECEIVABLE', 'PAYABLE');
CREATE TYPE "DebtAccountStatus" AS ENUM ('OPEN', 'PARTIAL', 'SETTLED', 'CANCELLED');
CREATE TYPE "DebtEntryKind" AS ENUM ('DEBT', 'PAYMENT', 'ADJUSTMENT');

ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'ACCOUNTS_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'ACCOUNTS_CREATE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'ACCOUNTS_UPDATE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'ACCOUNTS_PAY';

CREATE TABLE "DebtAccount" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "type" "DebtAccountType" NOT NULL,
  "status" "DebtAccountStatus" NOT NULL DEFAULT 'OPEN',
  "clientId" UUID,
  "orderId" UUID,
  "counterpartyName" TEXT NOT NULL,
  "counterpartyPhoneEncrypted" TEXT,
  "counterpartyPhoneBlindIndex" TEXT,
  "label" TEXT NOT NULL,
  "originalAmount" DECIMAL(14,2) NOT NULL,
  "balance" DECIMAL(14,2) NOT NULL,
  "dueAt" TIMESTAMP(3),
  "noteEncrypted" TEXT,
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DebtAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DebtEntry" (
  "id" UUID NOT NULL,
  "debtAccountId" UUID NOT NULL,
  "kind" "DebtEntryKind" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "method" "PaymentMethod",
  "noteEncrypted" TEXT,
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DebtEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DebtAccount_orderId_key" ON "DebtAccount"("orderId");
CREATE INDEX "DebtAccount_organizationId_type_status_idx" ON "DebtAccount"("organizationId", "type", "status");
CREATE INDEX "DebtAccount_organizationId_createdAt_idx" ON "DebtAccount"("organizationId", "createdAt");
CREATE INDEX "DebtAccount_organizationId_dueAt_idx" ON "DebtAccount"("organizationId", "dueAt");
CREATE INDEX "DebtAccount_organizationId_clientId_idx" ON "DebtAccount"("organizationId", "clientId");
CREATE INDEX "DebtEntry_debtAccountId_createdAt_idx" ON "DebtEntry"("debtAccountId", "createdAt");

ALTER TABLE "DebtAccount" ADD CONSTRAINT "DebtAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DebtAccount" ADD CONSTRAINT "DebtAccount_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DebtAccount" ADD CONSTRAINT "DebtAccount_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DebtAccount" ADD CONSTRAINT "DebtAccount_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DebtEntry" ADD CONSTRAINT "DebtEntry_debtAccountId_fkey" FOREIGN KEY ("debtAccountId") REFERENCES "DebtAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DebtEntry" ADD CONSTRAINT "DebtEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

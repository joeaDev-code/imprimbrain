-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OFFICER', 'SECRETARY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ORANGE_MONEY', 'MTN_MONEY', 'MOOV_MONEY', 'WAVE', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "StockMovementKind" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('DASHBOARD_VIEW', 'CLIENTS_VIEW', 'CLIENTS_CREATE', 'CLIENTS_UPDATE', 'CLIENTS_DELETE', 'SERVICES_VIEW', 'SERVICES_CREATE', 'SERVICES_UPDATE', 'SERVICES_DELETE', 'ORDERS_VIEW', 'ORDERS_CREATE', 'ORDERS_UPDATE', 'ORDERS_CANCEL', 'PAYMENTS_VIEW', 'PAYMENTS_CREATE', 'EXPENSES_VIEW', 'EXPENSES_CREATE', 'EXPENSES_UPDATE', 'STOCK_VIEW', 'STOCK_CREATE', 'STOCK_UPDATE', 'STOCK_ADJUST', 'STOCK_RESTOCK', 'EMPLOYEES_VIEW', 'EMPLOYEES_CREATE', 'EMPLOYEES_UPDATE', 'EMPLOYEES_DISABLE', 'SETTINGS_VIEW', 'SETTINGS_UPDATE', 'AUDIT_VIEW');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phoneEncrypted" TEXT,
    "phoneBlindIndex" TEXT,
    "emailEncrypted" TEXT,
    "emailBlindIndex" TEXT,
    "addressEncrypted" TEXT,
    "wrappedDataKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SECRETARY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "emailBlindIndex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "permission" "Permission" NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phoneEncrypted" TEXT,
    "phoneBlindIndex" TEXT,
    "whatsappEncrypted" TEXT,
    "whatsappBlindIndex" TEXT,
    "emailEncrypted" TEXT,
    "emailBlindIndex" TEXT,
    "cityEncrypted" TEXT,
    "notesEncrypted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'unité',
    "price" DECIMAL(14,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'unité',
    "quantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "minThreshold" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "packageUnit" TEXT,
    "packageQuantity" DECIMAL(14,3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumptionRule" (
    "id" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "stockItemId" UUID NOT NULL,
    "qtyPerUnit" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "ConsumptionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "clientId" UUID,
    "ref" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notesEncrypted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "serviceId" UUID,
    "label" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Divers',
    "amount" DECIMAL(14,2) NOT NULL,
    "spentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notesEncrypted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" UUID NOT NULL,
    "stockItemId" UUID NOT NULL,
    "orderId" UUID,
    "kind" "StockMovementKind" NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_role_idx" ON "User"("organizationId", "role");

-- CreateIndex
CREATE INDEX "User_organizationId_emailBlindIndex_idx" ON "User"("organizationId", "emailBlindIndex");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permission_key" ON "UserPermission"("userId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Client_organizationId_name_idx" ON "Client"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Client_organizationId_phoneBlindIndex_idx" ON "Client"("organizationId", "phoneBlindIndex");

-- CreateIndex
CREATE INDEX "Client_organizationId_whatsappBlindIndex_idx" ON "Client"("organizationId", "whatsappBlindIndex");

-- CreateIndex
CREATE INDEX "Service_organizationId_name_idx" ON "Service"("organizationId", "name");

-- CreateIndex
CREATE INDEX "StockItem_organizationId_name_idx" ON "StockItem"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_organizationId_barcode_key" ON "StockItem"("organizationId", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "ConsumptionRule_serviceId_stockItemId_key" ON "ConsumptionRule"("serviceId", "stockItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_ref_key" ON "Order"("ref");

-- CreateIndex
CREATE INDEX "Order_organizationId_createdAt_idx" ON "Order"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_organizationId_ref_idx" ON "Order"("organizationId", "ref");

-- CreateIndex
CREATE INDEX "Payment_orderId_paidAt_idx" ON "Payment"("orderId", "paidAt");

-- CreateIndex
CREATE INDEX "Expense_organizationId_spentAt_idx" ON "Expense"("organizationId", "spentAt");

-- CreateIndex
CREATE INDEX "StockMovement_stockItemId_createdAt_idx" ON "StockMovement"("stockItemId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionRule" ADD CONSTRAINT "ConsumptionRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionRule" ADD CONSTRAINT "ConsumptionRule_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

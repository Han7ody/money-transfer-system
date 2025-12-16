/*
  Warnings:

  - A unique constraint covering the columns `[pickup_code]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'OUT_OF_CASH', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('BANK_TRANSFER', 'CASH_PICKUP', 'MOBILE_MONEY');

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'READY_FOR_PICKUP';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "assigned_agent_id" INTEGER,
ADD COLUMN     "assigned_at" TIMESTAMP(3),
ADD COLUMN     "payout_method" "PayoutMethod",
ADD COLUMN     "pickup_city" TEXT,
ADD COLUMN     "pickup_code" TEXT,
ADD COLUMN     "pickup_verified_at" TIMESTAMP(3),
ADD COLUMN     "pickup_verified_by_agent_id" INTEGER;

-- CreateTable
CREATE TABLE "agents" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Sudan',
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "max_daily_amount" DECIMAL(15,2) NOT NULL,
    "current_daily_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "active_transactions" INTEGER NOT NULL DEFAULT 0,
    "total_transactions" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL DEFAULT 'general',
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_phone_key" ON "agents"("phone");

-- CreateIndex
CREATE INDEX "agents_city_idx" ON "agents"("city");

-- CreateIndex
CREATE INDEX "agents_status_idx" ON "agents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "idx_system_settings_category" ON "system_settings"("category");

-- CreateIndex
CREATE INDEX "idx_system_settings_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_pickup_code_key" ON "transactions"("pickup_code");

-- CreateIndex
CREATE INDEX "transactions_assigned_agent_id_idx" ON "transactions"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "transactions_pickup_city_idx" ON "transactions"("pickup_city");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pickup_verified_by_agent_id_fkey" FOREIGN KEY ("pickup_verified_by_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "fk_system_settings_updater" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

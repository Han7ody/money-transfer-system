-- Update AuditLog schema to new format

-- Step 1: Rename old columns
ALTER TABLE "audit_logs" RENAME COLUMN "user_id" TO "admin_id";

-- Step 2: Add new columns with defaults for existing data
ALTER TABLE "audit_logs" ADD COLUMN "entity" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "entity_id" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "old_value" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN "new_value" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN "user_agent" TEXT;

-- Step 3: Migrate existing data
UPDATE "audit_logs" SET
  "entity" = COALESCE("table_name", 'Unknown'),
  "entity_id" = CAST("record_id" AS TEXT),
  "new_value" = "details"
WHERE "entity" IS NULL;

-- Step 4: Make entity required
ALTER TABLE "audit_logs" ALTER COLUMN "entity" SET NOT NULL;

-- Step 5: Drop old columns
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "table_name";
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "record_id";
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "details";

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs"("entity");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");

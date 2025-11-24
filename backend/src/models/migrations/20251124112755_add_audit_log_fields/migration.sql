-- RenameForeignKey
ALTER TABLE "audit_logs" RENAME CONSTRAINT "audit_logs_user_id_fkey" TO "audit_logs_admin_id_fkey";

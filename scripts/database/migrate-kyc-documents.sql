-- Migrate kyc_documents table to new schema
-- This updates the old structure to match the Prisma schema

-- First, check if old columns exist and rename/add new ones
DO $$ 
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kyc_documents' AND column_name = 'document_type') THEN
        ALTER TABLE kyc_documents ADD COLUMN document_type VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kyc_documents' AND column_name = 'document_number') THEN
        ALTER TABLE kyc_documents ADD COLUMN document_number VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kyc_documents' AND column_name = 'front_image_url') THEN
        ALTER TABLE kyc_documents ADD COLUMN front_image_url VARCHAR(500);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kyc_documents' AND column_name = 'back_image_url') THEN
        ALTER TABLE kyc_documents ADD COLUMN back_image_url VARCHAR(500);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kyc_documents' AND column_name = 'uploaded_at') THEN
        ALTER TABLE kyc_documents ADD COLUMN uploaded_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Migrate data from old columns to new columns if old columns exist
DO $$ 
BEGIN
    -- Check if old 'type' column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'kyc_documents' AND column_name = 'type') THEN
        -- Copy type to document_type
        UPDATE kyc_documents 
        SET document_type = CASE 
            WHEN type = 'id_front' THEN 'NATIONAL_ID'
            WHEN type = 'id_back' THEN 'NATIONAL_ID'
            WHEN type = 'selfie' THEN 'SELFIE'
            ELSE 'NATIONAL_ID'
        END
        WHERE document_type IS NULL;
    END IF;

    -- Check if old 'file_path' column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'kyc_documents' AND column_name = 'file_path') THEN
        -- Copy file_path to front_image_url
        UPDATE kyc_documents 
        SET front_image_url = '/uploads/' || file_path
        WHERE front_image_url IS NULL AND file_path IS NOT NULL;
    END IF;
END $$;

-- Make document_type NOT NULL after migration
ALTER TABLE kyc_documents ALTER COLUMN document_type SET NOT NULL;

-- Drop old columns if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'kyc_documents' AND column_name = 'type') THEN
        ALTER TABLE kyc_documents DROP COLUMN type;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'kyc_documents' AND column_name = 'file_path') THEN
        ALTER TABLE kyc_documents DROP COLUMN file_path;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'kyc_documents' AND column_name = 'status') THEN
        ALTER TABLE kyc_documents DROP COLUMN status;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'kyc_documents' AND column_name = 'rejection_reason') THEN
        ALTER TABLE kyc_documents DROP COLUMN rejection_reason;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'kyc_documents' AND column_name = 'reviewed_at') THEN
        ALTER TABLE kyc_documents DROP COLUMN reviewed_at;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_kyc_document_user ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_document_type ON kyc_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_kyc_document_number ON kyc_documents(document_number);

-- Verify the migration
SELECT 'Migration completed successfully!' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kyc_documents'
ORDER BY ordinal_position;

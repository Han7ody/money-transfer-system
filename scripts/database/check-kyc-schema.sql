-- Check kyc_documents table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kyc_documents'
ORDER BY ordinal_position;

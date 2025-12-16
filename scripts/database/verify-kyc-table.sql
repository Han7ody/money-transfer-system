-- Verify kyc_documents table structure
\d kyc_documents

-- Show all columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'kyc_documents'
ORDER BY ordinal_position;

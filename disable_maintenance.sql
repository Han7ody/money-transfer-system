-- Disable maintenance mode
-- Run this SQL command in your PostgreSQL database

UPDATE system_settings 
SET value = 'false', updated_at = NOW() 
WHERE key = 'maintenance_mode';

-- Verify the update
SELECT * FROM system_settings WHERE key = 'maintenance_mode';

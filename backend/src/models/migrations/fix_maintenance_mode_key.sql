-- Ensure maintenance_mode exists in system_settings
-- This script ensures the maintenance_mode setting is properly initialized

-- First, delete the old incorrect key if it exists
DELETE FROM system_settings WHERE key = 'maintenanceMode';

-- Insert or update the correct maintenance_mode key
INSERT INTO system_settings (key, value, category, created_at, updated_at)
VALUES ('maintenance_mode', 'false', 'general', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET 
  value = 'false',
  updated_at = NOW()
WHERE system_settings.key = 'maintenance_mode';

-- Verify the record exists
SELECT * FROM system_settings WHERE key = 'maintenance_mode';

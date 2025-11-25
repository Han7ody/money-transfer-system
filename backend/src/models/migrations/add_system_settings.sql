-- Manual Migration for SystemSettings Table
-- Run this SQL in your PostgreSQL database

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general' NOT NULL,
    is_encrypted BOOLEAN DEFAULT FALSE NOT NULL,
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_system_settings_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

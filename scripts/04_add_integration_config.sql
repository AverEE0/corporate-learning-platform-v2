-- Migration: Add Integration Configuration Tables

-- Create integration_settings table for storing external service configs
CREATE TABLE IF NOT EXISTS integration_settings (
  id SERIAL PRIMARY KEY,
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('telegram', 'bitrix24', 'email')),
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_type)
);

-- Insert default empty configs
INSERT INTO integration_settings (service_type, enabled) 
VALUES ('telegram', FALSE), ('bitrix24', FALSE), ('email', TRUE)
ON CONFLICT (service_type) DO NOTHING;


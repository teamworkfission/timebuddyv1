-- Migration: Add timezone support to businesses table
-- This stores resolved timezone information server-side to eliminate client lookups

-- Add timezone-related columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS timezone_resolved_at TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS businesses_timezone_idx ON businesses (timezone);
CREATE INDEX IF NOT EXISTS businesses_coordinates_idx ON businesses (latitude, longitude);

-- Add comment for documentation
COMMENT ON COLUMN businesses.timezone IS 'IANA timezone identifier (e.g., America/Chicago)';
COMMENT ON COLUMN businesses.latitude IS 'Resolved latitude for timezone detection';
COMMENT ON COLUMN businesses.longitude IS 'Resolved longitude for timezone detection';
COMMENT ON COLUMN businesses.timezone_resolved_at IS 'When timezone was last resolved/updated';

-- Update existing businesses to null (will be resolved on next update)
-- This is safe since we have fallback logic
UPDATE businesses 
SET 
  timezone = NULL,
  timezone_resolved_at = NULL
WHERE timezone IS NULL;

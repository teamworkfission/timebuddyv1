-- Migration: Add new business types to businesses table
-- Date: 2025-10-02
-- Description: Expands business types from 12 to 26 types to support more industries

-- Drop the existing CHECK constraint
ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS businesses_type_check;

-- Add new CHECK constraint with all 26 business types
ALTER TABLE businesses 
ADD CONSTRAINT businesses_type_check 
CHECK (type::text = ANY (ARRAY[
  'restaurant'::character varying,
  'gas_station'::character varying,
  'retail_store'::character varying,
  'grocery_store'::character varying,
  'convenience_store'::character varying,
  'pharmacy'::character varying,
  'coffee_shop'::character varying,
  'fast_food'::character varying,
  'delivery_service'::character varying,
  'warehouse'::character varying,
  'office'::character varying,
  'liquor_store'::character varying,
  'smoke_vape_shop'::character varying,
  'salon_barber'::character varying,
  'nail_beauty_spa'::character varying,
  'cleaning_services'::character varying,
  'event_staffing'::character varying,
  'childcare_daycare'::character varying,
  'senior_care'::character varying,
  'hospitality'::character varying,
  'construction'::character varying,
  'landscaping'::character varying,
  'moving_storage'::character varying,
  'car_wash_detailing'::character varying,
  'security_services'::character varying,
  'other'::character varying
]::text[]));

-- Add comment
COMMENT ON CONSTRAINT businesses_type_check ON businesses IS 
'Allowed business types: includes restaurant, retail, services, healthcare, and other industries';


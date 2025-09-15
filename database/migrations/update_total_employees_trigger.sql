-- Migration to add triggers for automatic total_employees calculation
-- This ensures the total_employees field is always up-to-date in real-time

-- Function to update total_employees count for a business
CREATE OR REPLACE FUNCTION update_business_employee_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE operations
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE businesses 
    SET total_employees = (
      SELECT COUNT(*) 
      FROM business_employees 
      WHERE business_id = NEW.business_id
    )
    WHERE business_id = NEW.business_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    UPDATE businesses 
    SET total_employees = (
      SELECT COUNT(*) 
      FROM business_employees 
      WHERE business_id = OLD.business_id
    )
    WHERE business_id = OLD.business_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for business_employees table
DROP TRIGGER IF EXISTS trigger_update_employee_count_insert ON business_employees;
DROP TRIGGER IF EXISTS trigger_update_employee_count_delete ON business_employees;

CREATE TRIGGER trigger_update_employee_count_insert
  AFTER INSERT ON business_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_business_employee_count();

CREATE TRIGGER trigger_update_employee_count_delete
  AFTER DELETE ON business_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_business_employee_count();

-- Initialize total_employees for existing businesses
-- This will set the correct count for all existing businesses
UPDATE businesses 
SET total_employees = (
  SELECT COUNT(*) 
  FROM business_employees 
  WHERE business_employees.business_id = businesses.business_id
);

-- Ensure new businesses start with 0 employees by default
ALTER TABLE businesses 
ALTER COLUMN total_employees SET DEFAULT 0;

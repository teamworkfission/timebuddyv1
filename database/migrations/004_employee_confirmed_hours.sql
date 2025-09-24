-- =====================================================
-- EMPLOYEE CONFIRMED HOURS SYSTEM
-- =====================================================
-- Purpose: Allow employees to input/confirm actual hours worked
-- Integration: Works alongside existing schedule calculations
-- Security: RLS policies ensure employee data privacy

-- =====================================================
-- 1. EMPLOYEE CONFIRMED HOURS TABLE
-- =====================================================
CREATE TABLE employee_confirmed_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  
  -- Daily hour entries (0 = Sunday, 6 = Saturday)
  -- Using individual columns for easy UI binding and validation
  sunday_hours DECIMAL(4,2) DEFAULT 0 CHECK (sunday_hours >= 0 AND sunday_hours <= 24),
  monday_hours DECIMAL(4,2) DEFAULT 0 CHECK (monday_hours >= 0 AND monday_hours <= 24),
  tuesday_hours DECIMAL(4,2) DEFAULT 0 CHECK (tuesday_hours >= 0 AND tuesday_hours <= 24),
  wednesday_hours DECIMAL(4,2) DEFAULT 0 CHECK (wednesday_hours >= 0 AND wednesday_hours <= 24),
  thursday_hours DECIMAL(4,2) DEFAULT 0 CHECK (thursday_hours >= 0 AND thursday_hours <= 24),
  friday_hours DECIMAL(4,2) DEFAULT 0 CHECK (friday_hours >= 0 AND friday_hours <= 24),
  saturday_hours DECIMAL(4,2) DEFAULT 0 CHECK (saturday_hours >= 0 AND saturday_hours <= 24),
  
  -- Computed total (automatically maintained)
  total_hours DECIMAL(5,2) GENERATED ALWAYS AS 
    (sunday_hours + monday_hours + tuesday_hours + wednesday_hours + 
     thursday_hours + friday_hours + saturday_hours) STORED,
  
  -- Status workflow: draft -> submitted -> approved
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Notes and metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(employee_id, business_id, week_start_date),
  CHECK (EXTRACT(dow FROM week_start_date) = 0), -- Ensure Sunday start
  CHECK (submitted_at IS NULL OR status != 'draft'), -- Can't submit draft
  CHECK (approved_at IS NULL OR status = 'approved') -- Can't approve non-approved
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_confirmed_hours_employee_business 
  ON employee_confirmed_hours(employee_id, business_id);
  
CREATE INDEX idx_confirmed_hours_week_status 
  ON employee_confirmed_hours(week_start_date, status);
  
CREATE INDEX idx_confirmed_hours_business_status 
  ON employee_confirmed_hours(business_id, status) 
  WHERE status IN ('submitted', 'approved');

-- =====================================================
-- 3. TRIGGERS FOR AUDIT TRAIL
-- =====================================================
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_confirmed_hours_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Auto-set timestamps based on status changes
  IF OLD.status = 'draft' AND NEW.status = 'submitted' THEN
    NEW.submitted_at = NOW();
  END IF;
  
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    NEW.approved_at = NOW();
    -- approved_by should be set by application
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_confirmed_hours_update
  BEFORE UPDATE ON employee_confirmed_hours
  FOR EACH ROW EXECUTE FUNCTION update_confirmed_hours_timestamp();

-- =====================================================
-- 4. BUSINESS LOGIC FUNCTIONS
-- =====================================================
-- Function to get scheduled hours for prefilling
CREATE OR REPLACE FUNCTION get_scheduled_hours_for_week(
  p_employee_id UUID,
  p_business_id UUID,
  p_week_start DATE
) RETURNS JSONB AS $$
DECLARE
  result JSONB := '{
    "sunday_hours": 0, "monday_hours": 0, "tuesday_hours": 0, 
    "wednesday_hours": 0, "thursday_hours": 0, "friday_hours": 0, "saturday_hours": 0
  }'::JSONB;
  shift_record RECORD;
BEGIN
  -- Get all shifts for the week from posted schedules
  FOR shift_record IN
    SELECT 
      s.day_of_week,
      ROUND(((s.end_min - s.start_min) / 60.0)::NUMERIC, 2) as hours
    FROM shifts s
    JOIN weekly_schedules ws ON s.schedule_id = ws.id
    WHERE ws.business_id = p_business_id
      AND s.employee_id = p_employee_id 
      AND ws.week_start_date = p_week_start
      AND ws.status = 'posted'
  LOOP
    -- Map day_of_week to JSON key
    CASE shift_record.day_of_week
      WHEN 0 THEN result := jsonb_set(result, '{sunday_hours}', to_jsonb(
        (result->>'sunday_hours')::NUMERIC + shift_record.hours
      ));
      WHEN 1 THEN result := jsonb_set(result, '{monday_hours}', to_jsonb(
        (result->>'monday_hours')::NUMERIC + shift_record.hours
      ));
      WHEN 2 THEN result := jsonb_set(result, '{tuesday_hours}', to_jsonb(
        (result->>'tuesday_hours')::NUMERIC + shift_record.hours
      ));
      WHEN 3 THEN result := jsonb_set(result, '{wednesday_hours}', to_jsonb(
        (result->>'wednesday_hours')::NUMERIC + shift_record.hours
      ));
      WHEN 4 THEN result := jsonb_set(result, '{thursday_hours}', to_jsonb(
        (result->>'thursday_hours')::NUMERIC + shift_record.hours
      ));
      WHEN 5 THEN result := jsonb_set(result, '{friday_hours}', to_jsonb(
        (result->>'friday_hours')::NUMERIC + shift_record.hours
      ));
      WHEN 6 THEN result := jsonb_set(result, '{saturday_hours}', to_jsonb(
        (result->>'saturday_hours')::NUMERIC + shift_record.hours
      ));
    END CASE;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
ALTER TABLE employee_confirmed_hours ENABLE ROW LEVEL SECURITY;

-- Employees can only see/edit their own hours
CREATE POLICY confirmed_hours_employee_access
  ON employee_confirmed_hours
  FOR ALL
  TO authenticated
  USING (
    employee_id IN (
      SELECT e.id FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );

-- Employers can see submitted/approved hours for their businesses
CREATE POLICY confirmed_hours_employer_read
  ON employee_confirmed_hours
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT b.business_id FROM businesses b 
      WHERE b.employer_id = auth.uid()
    )
    AND status IN ('submitted', 'approved')
  );

-- Employers can approve submitted hours
CREATE POLICY confirmed_hours_employer_approve
  ON employee_confirmed_hours
  FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT b.business_id FROM businesses b 
      WHERE b.employer_id = auth.uid()
    )
    AND status = 'submitted'
  )
  WITH CHECK (
    status = 'approved' AND
    approved_by = auth.uid()
  );

-- =====================================================
-- 6. COMMENTS AND DOCUMENTATION
-- =====================================================
COMMENT ON TABLE employee_confirmed_hours IS 
  'Employee-confirmed actual hours worked per week. Integrates with existing schedule and payment systems.';

COMMENT ON COLUMN employee_confirmed_hours.week_start_date IS 
  'Sunday date for the work week (matches weekly_schedules.week_start_date format)';

COMMENT ON COLUMN employee_confirmed_hours.total_hours IS 
  'Automatically calculated sum of all daily hours. Used for payroll integration.';

COMMENT ON COLUMN employee_confirmed_hours.status IS 
  'Workflow: draft (employee editing) -> submitted (pending approval) -> approved (ready for payroll)';

COMMENT ON FUNCTION get_scheduled_hours_for_week(UUID, UUID, DATE) IS 
  'Returns JSON with scheduled hours by day for prefilling employee input form';

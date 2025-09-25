-- =====================================================
-- ADD REJECTION FUNCTIONALITY TO CONFIRMED HOURS
-- =====================================================
-- Purpose: Allow employers to reject submitted hours with reasons
-- Integration: Extends existing confirmed hours workflow
-- Security: Updates RLS policies for rejection handling

-- =====================================================
-- 1. ADD REJECTION FIELDS TO CONFIRMED HOURS TABLE
-- =====================================================

-- Add rejection_reason field for storing why hours were rejected
ALTER TABLE employee_confirmed_hours 
ADD COLUMN rejection_reason TEXT;

-- Add rejected_at timestamp
ALTER TABLE employee_confirmed_hours 
ADD COLUMN rejected_at TIMESTAMPTZ;

-- Add rejected_by field to track who rejected the hours
ALTER TABLE employee_confirmed_hours 
ADD COLUMN rejected_by UUID REFERENCES auth.users(id);

-- Update status check constraint to include 'rejected'
ALTER TABLE employee_confirmed_hours 
DROP CONSTRAINT employee_confirmed_hours_status_check;

ALTER TABLE employee_confirmed_hours 
ADD CONSTRAINT employee_confirmed_hours_status_check 
CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));

-- Add constraints for rejection fields
ALTER TABLE employee_confirmed_hours 
ADD CONSTRAINT check_rejected_fields 
CHECK (
  (status = 'rejected' AND rejection_reason IS NOT NULL AND rejected_at IS NOT NULL AND rejected_by IS NOT NULL) OR
  (status != 'rejected' AND rejection_reason IS NULL AND rejected_at IS NULL AND rejected_by IS NULL)
);

-- =====================================================
-- 2. UPDATE TRIGGERS FOR REJECTION WORKFLOW
-- =====================================================

-- Update the existing trigger function to handle rejection status
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
  
  -- Handle rejection status change
  IF OLD.status != 'rejected' AND NEW.status = 'rejected' THEN
    NEW.rejected_at = NOW();
    -- rejected_by should be set by application
    -- rejection_reason should be provided by application
  END IF;
  
  -- Clear rejection fields when status changes from rejected to other states
  IF OLD.status = 'rejected' AND NEW.status != 'rejected' THEN
    NEW.rejected_at = NULL;
    NEW.rejected_by = NULL;
    NEW.rejection_reason = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. UPDATE RLS POLICIES FOR REJECTION HANDLING
-- =====================================================

-- Drop existing employer update policy to replace with more comprehensive one
DROP POLICY confirmed_hours_employer_approve ON employee_confirmed_hours;

-- New comprehensive employer policy for approve AND reject actions
CREATE POLICY confirmed_hours_employer_actions
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
    (
      -- Allow approval
      (status = 'approved' AND approved_by = auth.uid()) OR
      -- Allow rejection 
      (status = 'rejected' AND rejected_by = auth.uid() AND rejection_reason IS NOT NULL)
    )
  );

-- =====================================================
-- 4. CREATE INDEX FOR PERFORMANCE
-- =====================================================

-- Add index for rejected hours queries
CREATE INDEX idx_confirmed_hours_rejected_status 
  ON employee_confirmed_hours(business_id, status, rejected_at) 
  WHERE status = 'rejected';

-- =====================================================
-- 5. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN employee_confirmed_hours.rejection_reason IS 
  'Reason provided by employer when rejecting submitted hours. Required when status is rejected.';

COMMENT ON COLUMN employee_confirmed_hours.rejected_at IS 
  'Timestamp when hours were rejected by employer. Auto-set by trigger.';

COMMENT ON COLUMN employee_confirmed_hours.rejected_by IS 
  'User ID of employer who rejected the hours. Must match business owner.';

COMMENT ON CONSTRAINT check_rejected_fields ON employee_confirmed_hours IS 
  'Ensures rejection fields are properly set when status is rejected, and null otherwise.';

-- =====================================================
-- ATOMIC CONFIRMED HOURS UPDATE FUNCTION
-- =====================================================
-- Purpose: Fix constraint violation when updating rejected hours
-- Issue: check_rejected_fields constraint fails during status transitions
-- Solution: Atomic update function that handles constraint properly

-- =====================================================
-- 1. CREATE ATOMIC UPDATE FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_confirmed_hours_atomic(
  p_id UUID,
  p_employee_id UUID,
  p_update_data JSONB,
  p_allowed_statuses TEXT[]
)
RETURNS TABLE (
  id UUID,
  employee_id UUID,
  business_id UUID,
  week_start_date DATE,
  sunday_hours DECIMAL(4,2),
  monday_hours DECIMAL(4,2),
  tuesday_hours DECIMAL(4,2),
  wednesday_hours DECIMAL(4,2),
  thursday_hours DECIMAL(4,2),
  friday_hours DECIMAL(4,2),
  saturday_hours DECIMAL(4,2),
  total_hours DECIMAL(5,2),
  status TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_record employee_confirmed_hours%ROWTYPE;
  update_statement TEXT;
  set_clauses TEXT[] := ARRAY[]::TEXT[];
  key TEXT;
  value TEXT;
BEGIN
  -- Get current record with row lock
  SELECT * INTO current_record
  FROM employee_confirmed_hours
  WHERE employee_confirmed_hours.id = p_id 
    AND employee_confirmed_hours.employee_id = p_employee_id
    AND employee_confirmed_hours.status = ANY(p_allowed_statuses)
  FOR UPDATE;

  -- Check if record exists and is editable
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Confirmed hours record not found or not editable';
  END IF;

  -- Build dynamic UPDATE statement to handle constraint properly
  -- Special handling for status transitions from 'rejected' to 'draft'
  IF current_record.status = 'rejected' AND (p_update_data->>'status') = 'draft' THEN
    -- For rejected -> draft transition, we need to clear rejection fields atomically
    set_clauses := set_clauses || 'status = ''draft''';
    set_clauses := set_clauses || 'rejection_reason = NULL';
    set_clauses := set_clauses || 'rejected_at = NULL';
    set_clauses := set_clauses || 'rejected_by = NULL';
    set_clauses := set_clauses || 'updated_at = NOW()';
    
    -- Add other fields from update_data (except status and rejection fields)
    FOR key IN SELECT jsonb_object_keys(p_update_data)
    LOOP
      IF key NOT IN ('status', 'rejection_reason', 'rejected_at', 'rejected_by') THEN
        value := p_update_data->>key;
        IF value IS NOT NULL THEN
          set_clauses := set_clauses || format('%I = %L', key, value);
        ELSE
          set_clauses := set_clauses || format('%I = NULL', key);
        END IF;
      END IF;
    END LOOP;
  ELSE
    -- Regular update for non-rejected records
    set_clauses := set_clauses || 'updated_at = NOW()';
    
    FOR key IN SELECT jsonb_object_keys(p_update_data)
    LOOP
      value := p_update_data->>key;
      IF value IS NOT NULL THEN
        set_clauses := set_clauses || format('%I = %L', key, value);
      ELSE
        set_clauses := set_clauses || format('%I = NULL', key);
      END IF;
    END LOOP;
  END IF;

  -- Execute the update
  update_statement := format(
    'UPDATE employee_confirmed_hours SET %s WHERE id = %L AND employee_id = %L RETURNING *',
    array_to_string(set_clauses, ', '),
    p_id,
    p_employee_id
  );

  RETURN QUERY EXECUTE update_statement;
END;
$$;

-- =====================================================
-- 2. GRANT PERMISSIONS
-- =====================================================
-- Grant execute permission to authenticated users (matches existing RLS policies)
GRANT EXECUTE ON FUNCTION update_confirmed_hours_atomic TO authenticated;

-- =====================================================
-- 3. COMMENTS
-- =====================================================
COMMENT ON FUNCTION update_confirmed_hours_atomic IS 
  'Atomically updates employee confirmed hours while respecting check_rejected_fields constraint. Handles status transitions from rejected to draft properly.';

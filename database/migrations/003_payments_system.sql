-- =====================================================
-- PAYMENTS SYSTEM DATABASE MIGRATION
-- Applied: Phase 1 Implementation
-- =====================================================

-- =====================================================
-- 1. EMPLOYEE RATES TABLE
-- =====================================================
CREATE TABLE employee_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(8,2) NOT NULL CHECK (hourly_rate >= 0),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- AUDIT FIELDS
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id, employee_id, effective_from)
);

-- =====================================================
-- 2. PAYMENT RECORDS TABLE
-- =====================================================
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- PERIOD WITH VALIDATION
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period daterange GENERATED ALWAYS AS (daterange(period_start, period_end, '[]')) STORED,
  
  -- Hours and calculations (computed via trigger)
  total_hours DECIMAL(6,2) NOT NULL CHECK (total_hours >= 0),
  hourly_rate DECIMAL(8,2) NOT NULL CHECK (hourly_rate >= 0),
  gross_pay DECIMAL(10,2) NOT NULL CHECK (gross_pay >= 0),
  
  -- Adjustments
  advances DECIMAL(10,2) DEFAULT 0 CHECK (advances >= 0),
  bonuses DECIMAL(10,2) DEFAULT 0 CHECK (bonuses >= 0), 
  deductions DECIMAL(10,2) DEFAULT 0 CHECK (deductions >= 0),
  net_pay DECIMAL(10,2) NOT NULL,
  
  -- Status and metadata
  status TEXT NOT NULL DEFAULT 'calculated' CHECK (status IN ('calculated', 'paid')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'other')),
  notes TEXT,
  paid_at TIMESTAMPTZ,
  
  -- AUDIT FIELDS
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- DATE VALIDATION
  CONSTRAINT chk_period_valid CHECK (period_end >= period_start)
);

-- =====================================================
-- 3. AUTO-UPDATE TIMESTAMP TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  NEW.updated_by = auth.uid();
  RETURN NEW; 
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_payments BEFORE UPDATE ON payment_records
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_touch_rates BEFORE UPDATE ON employee_rates
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================
-- 4. PAYMENT CALCULATION TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION compute_pay() RETURNS trigger AS $$
BEGIN
  NEW.gross_pay := ROUND(COALESCE(NEW.total_hours,0) * COALESCE(NEW.hourly_rate,0), 2);
  NEW.net_pay   := ROUND(NEW.gross_pay
                      + COALESCE(NEW.bonuses,0)
                      - COALESCE(NEW.advances,0)
                      - COALESCE(NEW.deductions,0), 2);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_compute
  BEFORE INSERT OR UPDATE ON payment_records
  FOR EACH ROW EXECUTE FUNCTION compute_pay();

-- =====================================================
-- 5. PERFORMANCE INDEXES
-- =====================================================
CREATE INDEX ON employee_rates (business_id, employee_id, effective_from DESC);
CREATE INDEX ON payment_records (business_id, period_start, period_end);
CREATE INDEX ON payment_records (paid_at) WHERE status='paid';
CREATE INDEX ON payment_records USING GIST (period);

-- =====================================================
-- 6. BUSINESS LOGIC CONSTRAINTS
-- =====================================================
-- Prevent double-pay for same period
CREATE UNIQUE INDEX uniq_paid_period
  ON payment_records (business_id, employee_id, period_start, period_end)
  WHERE status = 'paid';

-- Prevent overlapping paid periods (using composite index approach)
CREATE INDEX idx_paid_periods_overlap
  ON payment_records (business_id, employee_id, period)
  WHERE status = 'paid';

-- =====================================================
-- 7. CURRENT RATES VIEW
-- =====================================================
CREATE VIEW v_current_employee_rates AS
SELECT DISTINCT ON (business_id, employee_id)
  business_id, employee_id, hourly_rate, effective_from
FROM employee_rates
WHERE effective_from <= CURRENT_DATE
ORDER BY business_id, employee_id, effective_from DESC;

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE employee_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Employers manage employee rates for their businesses
CREATE POLICY "Employers manage employee rates" ON employee_rates
  FOR ALL USING (business_id IN (
    SELECT business_id FROM businesses WHERE employer_id = auth.uid()
  ));

-- Employers manage payment records for their businesses  
CREATE POLICY "Employers manage payment records" ON payment_records
  FOR ALL USING (business_id IN (
    SELECT business_id FROM businesses WHERE employer_id = auth.uid()  
  ));

-- Grant access to the view
GRANT SELECT ON v_current_employee_rates TO authenticated;

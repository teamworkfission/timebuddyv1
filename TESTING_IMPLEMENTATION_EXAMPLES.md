# 🧪 TimeBuddy Testing Implementation - Code Examples

**Companion to**: PRODUCTION_TESTING_IMPLEMENTATION_PLAN.md  
**Purpose**: Actual test code that needs to be implemented

---

## 📁 **FILE STRUCTURE TO CREATE**

```
timebuddyv1/
├── backend/
│   ├── jest.config.js                    # ✨ NEW - Jest configuration
│   ├── test/
│   │   └── app.e2e-spec.ts              # ✨ NEW - E2E tests
│   └── src/
│       ├── auth/
│       │   └── auth.service.spec.ts     # ✨ NEW - Auth unit tests
│       ├── payments/
│       │   └── payments.service.spec.ts # ✨ NEW - Payment tests
│       ├── schedules/
│       │   └── schedules.service.spec.ts # ✨ NEW - Schedule tests
│       └── businesses/
│           └── businesses.service.spec.ts # ✨ NEW - Business tests
├── frontend/
│   ├── vitest.config.ts                 # 🔄 MODIFY - Add test config
│   ├── src/
│   │   ├── test/
│   │   │   └── setup.ts                 # ✨ NEW - Test setup
│   │   ├── components/
│   │   │   └── __tests__/               # ✨ NEW - Component tests
│   │   ├── contexts/
│   │   │   └── __tests__/               # ✨ NEW - Context tests
│   │   └── lib/
│   │       └── __tests__/               # ✨ NEW - API client tests
│   └── e2e/
│       ├── employee-journey.spec.ts     # ✨ NEW - E2E tests
│       └── employer-journey.spec.ts     # ✨ NEW - E2E tests
└── performance/
    ├── load-test.js                     # ✨ NEW - Load testing
    └── db-performance.sql               # ✨ NEW - DB benchmarks
```

---

## ⚙️ **CONFIGURATION FILES**

### **1. Backend Jest Configuration**
```javascript
// backend/jest.config.js - CREATE THIS FILE
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.module.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
};
```

### **2. Frontend Vitest Configuration**  
```typescript
// frontend/vitest.config.ts - MODIFY EXISTING FILE
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
})
```

### **3. Frontend Test Setup**
```typescript
// frontend/src/test/setup.ts - CREATE THIS FILE
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}))

// Mock environment variables
vi.mock('../lib/api', () => ({
  apiPost: vi.fn(),
  apiGet: vi.fn(),
}))

// Global test utilities
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

---

## 🔐 **AUTHENTICATION TESTS** (CRITICAL PRIORITY)

### **Backend Auth Service Tests**
```typescript
// backend/src/auth/auth.service.spec.ts - CREATE THIS FILE
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SupabaseService } from '../config/supabase.service';
import { EmployeesService } from '../employees/employees.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockSupabaseService: jest.Mocked<SupabaseService>;
  let mockEmployeesService: jest.Mocked<EmployeesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseService,
          useValue: {
            admin: {
              auth: {
                admin: {
                  listUsers: jest.fn(),
                },
              },
              from: jest.fn(() => ({
                select: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    maybeSingle: jest.fn(),
                    single: jest.fn(),
                  })),
                })),
                insert: jest.fn(() => ({
                  select: jest.fn(() => ({
                    single: jest.fn(),
                  })),
                })),
              })),
            },
            user: {
              auth: {
                getUser: jest.fn(),
              },
            },
          },
        },
        {
          provide: EmployeesService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockSupabaseService = module.get(SupabaseService);
    mockEmployeesService = module.get(EmployeesService);
  });

  describe('emailExists', () => {
    it('should return true for existing email in auth.users', async () => {
      // Arrange
      mockSupabaseService.admin.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [{ email: 'test@example.com' }],
        },
      });

      // Act
      const result = await service.emailExists('test@example.com');

      // Assert
      expect(result).toBe(true);
      expect(mockSupabaseService.admin.auth.admin.listUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: 1000,
      });
    });

    it('should handle case-insensitive email checking', async () => {
      // Arrange
      mockSupabaseService.admin.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [{ email: 'test@example.com' }],
        },
      });

      // Act
      const result = await service.emailExists('TEST@EXAMPLE.COM');

      // Assert
      expect(result).toBe(true);
    });

    it('should check profiles table as fallback', async () => {
      // Arrange
      mockSupabaseService.admin.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'user-123' },
          }),
        }),
      });
      mockSupabaseService.admin.from.mockReturnValue({ select: mockSelect } as any);

      // Act
      const result = await service.emailExists('test@example.com');

      // Assert
      expect(result).toBe(true);
      expect(mockSupabaseService.admin.from).toHaveBeenCalledWith('profiles');
    });
  });

  describe('verifyToken', () => {
    it('should handle new users without existing profiles', async () => {
      // Arrange
      const mockToken = 'valid-jwt-token';
      mockSupabaseService.user.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'newuser@example.com',
          },
        },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null, // No existing profile
            error: null,
          }),
        }),
      });
      mockSupabaseService.admin.from.mockReturnValue({ select: mockSelect } as any);

      // Act
      const result = await service.verifyToken(`Bearer ${mockToken}`);

      // Assert
      expect(result).toEqual({
        id: 'user-123',
        userId: 'user-123',
        email: 'newuser@example.com',
        role: undefined, // No profile yet
      });
    });

    it('should return existing user profile data', async () => {
      // Arrange
      const mockToken = 'valid-jwt-token';
      mockSupabaseService.user.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'existing@example.com',
          },
        },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: 'user-123',
              email: 'existing@example.com',
              role: 'employee',
            },
            error: null,
          }),
        }),
      });
      mockSupabaseService.admin.from.mockReturnValue({ select: mockSelect } as any);

      // Act
      const result = await service.verifyToken(`Bearer ${mockToken}`);

      // Assert
      expect(result).toEqual({
        id: 'user-123',
        userId: 'user-123',
        email: 'existing@example.com',
        role: 'employee',
      });
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      const invalidToken = 'invalid-token';
      mockSupabaseService.user.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT' },
      });

      // Act & Assert
      await expect(service.verifyToken(`Bearer ${invalidToken}`)).rejects.toThrow('Invalid token');
    });
  });

  describe('completeAuth - Race Condition Handling', () => {
    it('should handle concurrent profile creation gracefully', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'test@example.com';

      // Mock existing profile check (returns null - no existing profile)
      const mockExistingSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null }),
        }),
      });

      // Mock insert that fails with duplicate key error (race condition)
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({
            code: '23505', // PostgreSQL unique constraint violation
            message: 'duplicate key value violates unique constraint "profiles_pkey"',
          }),
        }),
      });

      // Mock successful fetch of existing profile created by concurrent request
      const mockFetchExisting = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: userId,
              email: email,
              role: 'employee',
            },
          }),
        }),
      });

      mockSupabaseService.admin.from
        .mockReturnValueOnce({ select: mockExistingSelect } as any)
        .mockReturnValueOnce({ insert: mockInsert } as any)
        .mockReturnValueOnce({ select: mockFetchExisting } as any);

      // Act
      const result = await service.completeAuth(userId, email, 'employee');

      // Assert
      expect(result).toEqual({
        id: userId,
        email: email,
        role: 'employee',
      });

      // Verify the race condition was handled properly
      expect(mockInsert).toHaveBeenCalled();
      expect(mockFetchExisting).toHaveBeenCalled();
    });

    it('should create employee record for employee role', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'employee@example.com';

      // Mock no existing profile
      const mockExistingSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null }),
        }),
      });

      // Mock successful profile creation
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: userId,
              email: email,
              role: 'employee',
            },
          }),
        }),
      });

      mockSupabaseService.admin.from
        .mockReturnValueOnce({ select: mockExistingSelect } as any)
        .mockReturnValueOnce({ insert: mockInsert } as any);

      mockEmployeesService.create.mockResolvedValue({
        id: userId,
        gid: 'GID-ABCDEF',
        email: email,
      } as any);

      // Act
      const result = await service.completeAuth(userId, email, 'employee');

      // Assert
      expect(result.role).toBe('employee');
      expect(mockEmployeesService.create).toHaveBeenCalledWith(userId, {
        full_name: '',
        phone: '',
        email: email,
        state: '',
        city: '',
      });
    });

    it('should not create employee record for employer role', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'employer@example.com';

      // Mock no existing profile
      const mockExistingSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null }),
        }),
      });

      // Mock successful profile creation
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: userId,
              email: email,
              role: 'employer',
            },
          }),
        }),
      });

      mockSupabaseService.admin.from
        .mockReturnValueOnce({ select: mockExistingSelect } as any)
        .mockReturnValueOnce({ insert: mockInsert } as any);

      // Act
      const result = await service.completeAuth(userId, email, 'employer');

      // Assert
      expect(result.role).toBe('employer');
      expect(mockEmployeesService.create).not.toHaveBeenCalled();
    });
  });
});
```

---

## 💰 **PAYMENT CALCULATION TESTS** (CRITICAL PRIORITY)

```typescript
// backend/src/payments/payments.service.spec.ts - CREATE THIS FILE
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { SupabaseService } from '../config/supabase.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockSupabaseService: jest.Mocked<SupabaseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: SupabaseService,
          useValue: {
            admin: {
              from: jest.fn(),
              rpc: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    mockSupabaseService = module.get(SupabaseService);
  });

  describe('calculatePayroll', () => {
    it('should calculate gross pay correctly (hours × rate)', async () => {
      // Arrange
      const businessId = 'business-123';
      const employeeId = 'employee-123';
      const periodStart = '2024-01-01';
      const periodEnd = '2024-01-07';
      
      const mockScheduleData = [
        { employee_id: employeeId, total_hours: 40.0 },
      ];
      
      const mockRateData = [
        { employee_id: employeeId, hourly_rate: 15.50 },
      ];

      // Mock schedule hours query
      const mockScheduleSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockResolvedValue({
              data: mockScheduleData,
            }),
          }),
        }),
      });

      // Mock current rates query
      const mockRatesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockRateData,
        }),
      });

      mockSupabaseService.admin.from
        .mockReturnValueOnce({ select: mockScheduleSelect } as any)
        .mockReturnValueOnce({ select: mockRatesSelect } as any);

      // Act
      const result = await service.calculatePayroll(businessId, periodStart, periodEnd);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        employee_id: employeeId,
        total_hours: 40.0,
        hourly_rate: 15.50,
        gross_pay: 620.00, // 40 * 15.50
        net_pay: 620.00, // No deductions
      });
    });

    it('should handle net pay calculation with adjustments', async () => {
      // Arrange
      const businessId = 'business-123';
      const paymentData = {
        employee_id: 'employee-123',
        business_id: businessId,
        period_start: '2024-01-01',
        period_end: '2024-01-07',
        total_hours: 40.0,
        hourly_rate: 15.50,
        advances: 100.00,
        bonuses: 50.00,
        deductions: 25.00,
      };

      // Mock payment record insertion (triggers will calculate pay)
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              ...paymentData,
              gross_pay: 620.00, // Calculated by DB trigger
              net_pay: 545.00, // 620 - 100 + 50 - 25 = 545
            },
          }),
        }),
      });

      mockSupabaseService.admin.from.mockReturnValue({ insert: mockInsert } as any);

      // Act
      const result = await service.createPaymentRecord(paymentData);

      // Assert
      expect(result.gross_pay).toBe(620.00);
      expect(result.net_pay).toBe(545.00);
    });

    it('should prevent negative net pay', async () => {
      // Arrange
      const paymentData = {
        employee_id: 'employee-123',
        business_id: 'business-123',
        period_start: '2024-01-01',
        period_end: '2024-01-07',
        total_hours: 10.0,
        hourly_rate: 15.00,
        advances: 200.00, // More than gross pay (150)
        bonuses: 0,
        deductions: 0,
      };

      // Mock database constraint violation
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({
            code: '23514', // PostgreSQL check constraint violation
            message: 'new row for relation "payment_records" violates check constraint "payment_records_net_pay_check"',
          }),
        }),
      });

      mockSupabaseService.admin.from.mockReturnValue({ insert: mockInsert } as any);

      // Act & Assert
      await expect(service.createPaymentRecord(paymentData))
        .rejects
        .toThrow(/constraint/i);
    });
  });

  describe('Payment Business Logic', () => {
    it('should prevent double payment for same period', async () => {
      // Arrange
      const paymentData = {
        employee_id: 'employee-123',
        business_id: 'business-123',
        period_start: '2024-01-01',
        period_end: '2024-01-07',
        total_hours: 40.0,
        hourly_rate: 15.50,
        status: 'paid',
      };

      // Mock existing paid payment for same period
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({
            code: '23505', // Unique constraint violation
            constraint: 'uniq_paid_period',
            message: 'duplicate key value violates unique constraint "uniq_paid_period"',
          }),
        }),
      });

      mockSupabaseService.admin.from.mockReturnValue({ insert: mockInsert } as any);

      // Act & Assert
      await expect(service.createPaymentRecord(paymentData))
        .rejects
        .toThrow(/duplicate.*payment/i);
    });

    it('should validate payment date ranges', async () => {
      // Arrange
      const invalidPaymentData = {
        employee_id: 'employee-123',
        business_id: 'business-123',
        period_start: '2024-01-07', // End before start
        period_end: '2024-01-01',
        total_hours: 40.0,
        hourly_rate: 15.50,
      };

      // Mock date constraint violation
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({
            code: '23514', // Check constraint violation
            constraint: 'chk_period_valid',
            message: 'new row violates check constraint "chk_period_valid"',
          }),
        }),
      });

      mockSupabaseService.admin.from.mockReturnValue({ insert: mockInsert } as any);

      // Act & Assert
      await expect(service.createPaymentRecord(invalidPaymentData))
        .rejects
        .toThrow(/period.*valid/i);
    });
  });

  describe('Employee Rate Management', () => {
    it('should use most recent effective rate', async () => {
      // Arrange
      const businessId = 'business-123';
      const employeeId = 'employee-123';

      // Mock rate history (multiple rates for same employee)
      const mockRateHistory = [
        { 
          employee_id: employeeId,
          hourly_rate: 14.00,
          effective_from: '2023-12-01', // Older rate
        },
        {
          employee_id: employeeId,
          hourly_rate: 15.50,
          effective_from: '2024-01-01', // Current rate
        },
        {
          employee_id: employeeId,
          hourly_rate: 16.00,
          effective_from: '2024-02-01', // Future rate
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          lte: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [mockRateHistory[1]], // Should return current rate only
              }),
            }),
          }),
        }),
      });

      mockSupabaseService.admin.from.mockReturnValue({ select: mockSelect } as any);

      // Act
      const currentRate = await service.getCurrentEmployeeRate(businessId, employeeId, '2024-01-15');

      // Assert
      expect(currentRate.hourly_rate).toBe(15.50);
      expect(currentRate.effective_from).toBe('2024-01-01');
    });
  });
});
```

---

## 📅 **SCHEDULE MANAGEMENT TESTS** (HIGH PRIORITY)

```typescript
// backend/src/schedules/schedules.service.spec.ts - CREATE THIS FILE
import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesService } from './schedules.service';
import { SupabaseService } from '../config/supabase.service';
import { parse12hToMinutes, minutesToAmPm } from '../utils/time-parser';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let mockSupabaseService: jest.Mocked<SupabaseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: SupabaseService,
          useValue: {
            admin: {
              from: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
    mockSupabaseService = module.get(SupabaseService);
  });

  describe('Time Parsing Functions', () => {
    describe('parse12hToMinutes', () => {
      it('should parse standard AM times correctly', () => {
        expect(parse12hToMinutes('9:00 AM')).toBe(540); // 9 * 60
        expect(parse12hToMinutes('12:00 AM')).toBe(0);   // Midnight
        expect(parse12hToMinutes('12:30 AM')).toBe(30);  // 30 minutes past midnight
      });

      it('should parse standard PM times correctly', () => {
        expect(parse12hToMinutes('1:00 PM')).toBe(780);  // 13 * 60
        expect(parse12hToMinutes('12:00 PM')).toBe(720); // Noon
        expect(parse12hToMinutes('11:59 PM')).toBe(1439); // 23:59
      });

      it('should handle various input formats', () => {
        expect(parse12hToMinutes('9am')).toBe(540);
        expect(parse12hToMinutes('9 AM')).toBe(540);
        expect(parse12hToMinutes('09:00 AM')).toBe(540);
        expect(parse12hToMinutes('9:30 PM')).toBe(1350); // 21:30
      });

      it('should throw error for invalid times', () => {
        expect(() => parse12hToMinutes('13:00 PM')).toThrow();
        expect(() => parse12hToMinutes('25:00 AM')).toThrow();
        expect(() => parse12hToMinutes('9:60 AM')).toThrow();
        expect(() => parse12hToMinutes('invalid')).toThrow();
      });
    });

    describe('minutesToAmPm', () => {
      it('should convert minutes to AM/PM format correctly', () => {
        expect(minutesToAmPm(0)).toBe('12:00 AM');     // Midnight
        expect(minutesToAmPm(540)).toBe('9:00 AM');    // 9 AM
        expect(minutesToAmPm(720)).toBe('12:00 PM');   // Noon
        expect(minutesToAmPm(1080)).toBe('6:00 PM');   // 6 PM
        expect(minutesToAmPm(1439)).toBe('11:59 PM');  // 11:59 PM
      });

      it('should handle fractional hours', () => {
        expect(minutesToAmPm(570)).toBe('9:30 AM');    // 9:30 AM
        expect(minutesToAmPm(1350)).toBe('9:30 PM');   // 9:30 PM
      });
    });
  });

  describe('Shift Management', () => {
    it('should create shift with proper time parsing', async () => {
      // Arrange
      const shiftData = {
        business_id: 'business-123',
        employee_id: 'employee-123',
        week_start_date: '2024-01-07', // Sunday
        day_of_week: 1, // Monday
        start_label: '9:00 AM',
        end_label: '5:00 PM',
      };

      const expectedShiftWithCalculations = {
        ...shiftData,
        start_min: 540,  // 9:00 AM in minutes
        end_min: 1020,   // 5:00 PM in minutes  
        duration_hours: 8.00, // 8 hours
      };

      // Mock database insertion
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: expectedShiftWithCalculations,
          }),
        }),
      });

      mockSupabaseService.admin.from.mockReturnValue({ insert: mockInsert } as any);

      // Act
      const result = await service.createShift(shiftData);

      // Assert
      expect(result.start_min).toBe(540);
      expect(result.end_min).toBe(1020);
      expect(result.duration_hours).toBe(8.00);
      expect(result.start_label).toBe('9:00 AM');
      expect(result.end_label).toBe('5:00 PM');
    });

    it('should handle overnight shifts correctly', async () => {
      // Arrange - Night shift: 11 PM to 7 AM next day
      const nightShiftData = {
        business_id: 'business-123',
        employee_id: 'employee-123',
        week_start_date: '2024-01-07',
        day_of_week: 1,
        start_label: '11:00 PM',
        end_label: '7:00 AM',
      };

      const expectedNightShift = {
        ...nightShiftData,
        start_min: 1380, // 11:00 PM = 23 * 60
        end_min: 420,    // 7:00 AM = 7 * 60
        duration_hours: 8.00, // Calculated as overnight shift
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: expectedNightShift,
          }),
        }),
      });

      mockSupabaseService.admin.from.mockReturnValue({ insert: mockInsert } as any);

      // Act
      const result = await service.createShift(nightShiftData);

      // Assert
      expect(result.start_min).toBe(1380); // 11 PM
      expect(result.end_min).toBe(420);    // 7 AM
      expect(result.duration_hours).toBe(8.00);
    });

    it('should enforce Sunday week start constraint', async () => {
      // Arrange - Invalid week start (Monday instead of Sunday)
      const invalidWeekData = {
        business_id: 'business-123',
        employee_id: 'employee-123',
        week_start_date: '2024-01-08', // Monday - NOT ALLOWED
        day_of_week: 1,
        start_label: '9:00 AM',
        end_label: '5:00 PM',
      };

      // Mock database constraint violation
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({
            code: '23514', // Check constraint violation
            constraint: 'chk_week_start_sunday',
            message: 'Week start date must be a Sunday',
          }),
        }),
      });

      mockSupabaseService.admin.from.mockReturnValue({ insert: mockInsert } as any);

      // Act & Assert
      await expect(service.createShift(invalidWeekData))
        .rejects
        .toThrow(/sunday/i);
    });
  });

  describe('Schedule Queries', () => {
    it('should get weekly schedule with proper time formatting', async () => {
      // Arrange
      const businessId = 'business-123';
      const weekStart = '2024-01-07'; // Sunday

      const mockScheduleData = [
        {
          employee_id: 'emp-1',
          full_name: 'John Doe',
          day_of_week: 1,
          start_min: 540,  // 9:00 AM
          end_min: 1020,   // 5:00 PM  
          start_label: '9:00 AM',
          end_label: '5:00 PM',
          duration_hours: 8.00,
        },
        {
          employee_id: 'emp-1',
          full_name: 'John Doe',
          day_of_week: 2,
          start_min: 600,  // 10:00 AM
          end_min: 1080,   // 6:00 PM
          start_label: '10:00 AM',
          end_label: '6:00 PM',
          duration_hours: 8.00,
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockScheduleData,
            }),
          }),
        }),
      });

      mockSupabaseService.admin.from.mockReturnValue({ select: mockSelect } as any);

      // Act
      const result = await service.getWeeklySchedule(businessId, weekStart);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].start_label).toBe('9:00 AM');
      expect(result[0].end_label).toBe('5:00 PM');
      expect(result[1].start_label).toBe('10:00 AM');
      expect(result[1].end_label).toBe('6:00 PM');
    });
  });
});
```

---

## ⚡ **FRONTEND COMPONENT TESTS** (MEDIUM PRIORITY)

```typescript
// frontend/src/contexts/__tests__/AuthProvider.test.tsx - CREATE THIS FILE
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthProvider';
import { supabase } from '../../lib/supabase';
import { vi } from 'vitest';

// Mock the supabase client
vi.mock('../../lib/supabase');

// Test component to access auth context
function TestComponent() {
  const { user, profile, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user?.email || 'No User'}</div>
      <div data-testid="profile">{profile?.role || 'No Profile'}</div>
    </div>
  );
}

function renderWithRouter(component: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    // Arrange
    const mockSession = { user: null };
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession }
    });
    
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });

    // Act
    renderWithRouter(<TestComponent />);

    // Assert
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
  });

  it('should handle successful authentication', async () => {
    // Arrange
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };
    
    const mockSession = { user: mockUser };
    
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession }
    });
    
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });

    // Mock successful profile fetch
    const mockApiPost = vi.fn().mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      role: 'employee',
    });
    
    vi.mocked(require('../../lib/api').apiPost).mockImplementation(mockApiPost);

    // Act
    renderWithRouter(<TestComponent />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('profile')).toHaveTextContent('employee');
    });
  });

  it('should handle authentication race condition gracefully', async () => {
    // Arrange
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = { user: mockUser };
    
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession }
    });
    
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });

    // Mock race condition error followed by success
    const mockApiPost = vi.fn()
      .mockRejectedValueOnce(new Error('Profile already exists'))
      .mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        role: 'employee',
      });
    
    vi.mocked(require('../../lib/api').apiPost).mockImplementation(mockApiPost);

    // Act
    renderWithRouter(<TestComponent />);

    // Assert - Should still complete successfully
    await waitFor(() => {
      expect(screen.getByTestId('profile')).toHaveTextContent('employee');
    });
  });

  it('should handle signout correctly', async () => {
    // Arrange
    const mockSignOut = vi.fn().mockResolvedValue({ error: null });
    (supabase.auth.signOut as any).mockImplementation(mockSignOut);
    
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null }
    });
    
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });

    // Act
    renderWithRouter(<TestComponent />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('profile')).toHaveTextContent('No Profile');
    });
  });
});
```

---

## 🔄 **PROGRESS TRACKING COMMANDS**

### **Commands to Run During Implementation**

```bash
# Backend Test Commands
cd backend

# Run specific test suites
npm run test auth.service.spec.ts           # Auth tests
npm run test payments.service.spec.ts       # Payment tests
npm run test schedules.service.spec.ts      # Schedule tests

# Run all tests with coverage
npm run test:cov                            # Generate coverage report

# Watch mode during development
npm run test:watch                          # Run tests on file changes

# Frontend Test Commands  
cd frontend

# Run specific test suites
npm run test AuthProvider                   # Auth context tests
npm run test PaymentsTab                    # Payment component tests

# Run all tests with coverage
npm run test --coverage                     # Generate coverage report

# Watch mode during development
npm run test --watch                        # Run tests on file changes

# E2E Test Commands
npx playwright test                         # Run all E2E tests
npx playwright test --headed                # Run with browser visible
npx playwright test --debug                 # Run with debugger

# Performance Test Commands
cd performance
k6 run load-test.js                        # Run load tests
artillery run load-test.yaml               # Alternative load testing
```

### **Coverage Requirements**

```bash
# Minimum Coverage Targets
Auth Module:        ≥ 90% (Critical business logic)
Payment Module:     ≥ 90% (Financial calculations)
Schedule Module:    ≥ 85% (Complex time logic)
Business Module:    ≥ 80% (CRUD operations)
Other Modules:      ≥ 75% (General functionality)

Overall Target:     ≥ 80% code coverage
```

### **Progress Tracking Files**

```bash
# Generated Reports (Review These)
backend/coverage/lcov-report/index.html     # Backend coverage report
frontend/coverage/index.html                # Frontend coverage report
test-results/                               # E2E test results
performance/results/                        # Load test results

# CI/CD Integration
.github/workflows/test.yml                  # GitHub Actions (to be created)
```

---

## 📁 **FILES THAT CAN BE DELETED AFTER TESTING**

### **✅ Safe to Delete (Temporary Artifacts)**

```bash
# Test Artifacts (Generated during testing)
/coverage/                                  # Coverage reports (regenerated)
/test-results/                             # Test execution results  
/screenshots/                              # Failed test screenshots
/videos/                                   # Test execution videos
/performance/temp/                         # Temporary load test files

# Development Database Files
test_database_dump.sql                     # Test data snapshots
test_migration_rollback.sql                # Migration test files
.env.test.local                           # Local test environment

# Temporary Configuration
docker-compose.test.yml                    # Test container setup
playwright-report/                         # Playwright HTML reports
```

### **❌ DO NOT Delete (Permanent Test Assets)**

```bash
# Test Code (Part of codebase)
**/*.spec.ts                               # Backend unit tests
**/*.test.tsx                              # Frontend component tests
**/e2e/                                    # E2E test suites
jest.config.js                            # Test configuration
vitest.config.ts                          # Frontend test config

# Production Cleanup (Replace debug with structured logging)
Replace all console.log/error/warn          # 206+ instances across codebase
```

---

## 🎯 **SUCCESS CRITERIA CHECKLIST**

### **Week 1: Infrastructure ✅**
- [ ] All testing frameworks installed and configured
- [ ] First test passing on backend and frontend
- [ ] Test database setup with sample data
- [ ] Coverage reporting working

### **Week 2-3: Core Tests ✅**
- [ ] Authentication tests (15+ scenarios)
- [ ] Payment calculation tests (12+ scenarios)  
- [ ] Schedule management tests (10+ scenarios)
- [ ] 80%+ coverage on critical modules

### **Week 4-5: Integration & E2E ✅**  
- [ ] All API endpoints tested
- [ ] Database constraints verified
- [ ] Complete user journeys tested
- [ ] Mobile responsiveness validated

### **Week 6: Performance & Cleanup ✅**
- [ ] Load testing completed (100+ users)
- [ ] Performance benchmarks established
- [ ] All 206 debug statements cleaned up
- [ ] Production monitoring implemented

**🚀 READY FOR PRODUCTION DEPLOYMENT! 🚀**

---

**Next Steps**: Start with Phase 1 infrastructure setup and begin implementing the test files shown above. Each test file contains specific, implementable code that directly addresses your application's critical business logic and production readiness gaps.

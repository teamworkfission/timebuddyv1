# Employee Management System - Business-Level Onboarding

## 🎯 Overview

The Employee Management System provides a secure, user-friendly way for businesses to onboard employees through a unique GID-based invitation system. This MVP implementation ensures that only valid employees can be added to businesses while maintaining data privacy and requiring employee consent.

## ✨ Key Features

### 🆔 Auto-Generated Employee GID System
- **Format**: `GID-XXXXXX` (6 random alphanumeric characters)
- **Uniqueness**: Database-level constraints ensure no duplicates
- **Auto-Generation**: Automatically assigned when employee creates profile
- **Example**: `GID-TIJNHO`, `GID-4A9C7K`

### 🤝 Business-Employee Onboarding Flow
1. **Employer Action**: Click "Add Employee" on business card
2. **GID Input**: Enter employee's 6-character GID using intuitive input boxes
3. **Join Request**: System sends invitation to employee
4. **Employee Response**: Employee accepts/declines on their dashboard
5. **Association**: Acceptance creates confirmed business-employee relationship

### 🔐 Security & Privacy
- **Consent-Based**: Employees must accept invitations
- **Role Validation**: Only business owners can add employees
- **Data Protection**: Row Level Security (RLS) policies
- **Input Validation**: Comprehensive GID format validation

## 🗄️ Database Schema

### New Tables Created

#### `business_employee_requests`
Tracks pending invitations from employers to employees.

```sql
CREATE TABLE business_employee_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(business_id),
    employee_gid VARCHAR(10) NOT NULL REFERENCES employees(employee_gid),
    employer_id UUID NOT NULL REFERENCES profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, employee_gid)
);
```

#### `business_employees`
Stores confirmed employee-business associations.

```sql
CREATE TABLE business_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(business_id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'supervisor')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, employee_id)
);
```

#### Enhanced `employees` Table
Added GID field with auto-generation.

```sql
ALTER TABLE employees ADD COLUMN employee_gid VARCHAR(10) UNIQUE NOT NULL;

-- Auto-generation function and trigger
CREATE OR REPLACE FUNCTION generate_employee_gid() RETURNS VARCHAR(10);
CREATE TRIGGER trigger_set_employee_gid BEFORE INSERT ON employees;
```

## 🔧 Backend API Endpoints

### Join Requests Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `POST` | `/join-requests` | Send join request to employee | Employer |
| `GET` | `/join-requests/sent` | Get requests sent by employer | Employer |
| `GET` | `/join-requests/received` | Get requests for employee | Employee |
| `PATCH` | `/join-requests/:id/respond` | Accept/decline request | Employee |
| `DELETE` | `/join-requests/:id` | Cancel request | Employer |

### Business Employee Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `GET` | `/businesses/:id/employees` | Get business employees | Owner |
| `DELETE` | `/businesses/:businessId/employees/:employeeId` | Remove employee | Owner |
| `PATCH` | `/businesses/:businessId/employees/:employeeId/role` | Update role | Owner |

### Request/Response Examples

#### Send Join Request
```json
POST /join-requests
{
  "business_id": "uuid",
  "employee_gid": "GID-TIJNHO",
  "message": "Welcome to our team!"
}
```

#### Respond to Request
```json
PATCH /join-requests/:id/respond
{
  "status": "accepted"
}
```

## 🎨 Frontend Components

### Enhanced Business Management

#### `AddEmployeeModal.tsx`
- **6-Box GID Input**: Separate input boxes for each character
- **Auto-Focus**: Automatically moves to next box when typing
- **Paste Support**: Ctrl+V pastes full GID across boxes
- **Validation**: Real-time format validation
- **User-Friendly**: Clear visual feedback and error messages

```tsx
// Usage
<AddEmployeeModal
  isOpen={showModal}
  onClose={handleClose}
  onSubmit={handleSubmit}
  businessName="Restaurant ABC"
  loading={false}
/>
```

#### `EmployeeList.tsx`
- **Employee Overview**: View all business employees
- **Role Management**: Update employee roles (employee/supervisor/manager)
- **Employee Removal**: Remove employees from business
- **Contact Information**: Access to employee details
- **Skills Display**: View employee skills and transportation

### Employee Dashboard Integration

#### `JoinRequests.tsx`
- **Pending Invitations**: Shows all pending business invitations
- **Business Details**: Display business name and invitation message
- **Accept/Decline**: Simple buttons for responding
- **Real-time Updates**: Automatic refresh of request status

## 🚀 User Experience Flow

### For Employers

1. **Navigate** to Business Management
2. **Click** "➕ Add Employee" on any business card
3. **Enter** employee's 6-character GID in separate boxes
   - Type each character (auto-advances to next box)
   - Or paste full GID with Ctrl+V
4. **Add Message** (optional) to personalize invitation
5. **Send** invitation and wait for employee response
6. **Manage** employees by clicking employee count on business card

### For Employees

1. **View** join requests on dashboard home page
2. **Review** business details and invitation message
3. **Accept** or **Decline** invitation
4. **Automatic** association created upon acceptance

## 🔍 Technical Implementation Details

### GID Generation Algorithm
```typescript
function generate_employee_gid(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GID-${result}`;
}
```

### Authentication Integration
- Uses existing `AuthService.verifyToken()` method
- Follows established authentication patterns
- No additional dependencies required

### Data Integrity Features
- **Unique Constraints**: Prevent duplicate requests/associations
- **Foreign Key Constraints**: Maintain referential integrity
- **Triggers**: Auto-update business employee counts
- **RLS Policies**: Secure data access

## 📱 Mobile Optimization

### Responsive Design
- **Touch-Friendly**: Large input boxes for mobile devices
- **Adaptive Layout**: Responsive grid for different screen sizes
- **Mobile-First**: Designed with mobile users in mind

### Input Experience
- **Large Touch Targets**: Easy to tap on mobile
- **Visual Feedback**: Clear focus states and validation
- **Error Handling**: User-friendly error messages

## 🧪 Testing Guide

### Test Data
Current employee in system:
- **Name**: Purna Chandra rao Mandalapu
- **GID**: `GID-TIJNHO`
- **Use this GID to test the invitation flow**

### Test Scenarios

1. **Happy Path**:
   - Employer sends invitation using `GID-TIJNHO`
   - Employee accepts invitation
   - Verify association created

2. **Validation Testing**:
   - Try invalid GID formats
   - Test with non-existent GIDs
   - Verify error messages

3. **Edge Cases**:
   - Duplicate invitations
   - Already associated employees
   - Cancelled requests

## 🔧 Development Setup

### Database Migrations Applied
```sql
-- Run these migrations in order:
1. employee_gid_and_business_associations_fixed.sql
2. employee_management_rls_policies.sql
```

### Backend Dependencies
No new dependencies required - uses existing:
- `@nestjs/common`
- `class-validator`
- `class-transformer`

### Frontend Dependencies
No new dependencies required - uses existing:
- `React`
- `TypeScript`
- `Tailwind CSS`

## 🚀 Deployment Notes

### Environment Variables
No new environment variables required.

### Database Considerations
- Ensure migrations are applied in production
- Verify RLS policies are active
- Check indexes are created for performance

### Performance Optimizations
- Indexes on `employee_gid`, `business_id`, `employee_id`
- Efficient queries with proper joins
- Pagination ready for large datasets

## 🎯 Future Enhancements

### Potential Improvements
1. **Bulk Employee Import**: CSV upload for multiple employees
2. **Employee Roles**: More granular permission system
3. **Notification System**: Email/SMS notifications for invitations
4. **Employee Search**: Search employees by skills, location
5. **Analytics**: Employee onboarding metrics

### Scalability Considerations
- Current design supports thousands of employees per business
- Database indexes optimize for common query patterns
- API endpoints designed for pagination

## 📞 Support & Troubleshooting

### Common Issues

#### "Employee not found with GID"
- Verify GID format is exactly `GID-XXXXXX`
- Ensure employee has created profile
- Check for typos in GID entry

#### "Join request already exists"
- Employee may have pending request
- Check employee dashboard for existing invitations
- Cancel existing request before sending new one

#### Backend 404 Errors
- Ensure backend server is running
- Verify all migrations are applied
- Check module imports in `app.module.ts`

### Debug Information
- Employee GID generation logs in database
- Request/response logging in browser network tab
- Backend console logs for API errors

---

## 📋 Summary

The Employee Management System successfully implements a secure, user-friendly business-level onboarding flow that:

✅ **Generates unique employee GIDs automatically**  
✅ **Provides intuitive 6-box GID input interface**  
✅ **Implements consent-based invitation system**  
✅ **Maintains data security with RLS policies**  
✅ **Offers comprehensive employee management tools**  
✅ **Works seamlessly on mobile and desktop**  

This MVP provides a solid foundation for employee-business relationships while maintaining security, usability, and scalability for future growth.

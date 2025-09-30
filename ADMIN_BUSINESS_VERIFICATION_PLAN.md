# Admin Business Verification System - Implementation Plan

## Overview
Simple manual business verification system where admins review business registrations and approve/reject them. No automated verification, no email notifications - just human review with approve/reject actions.

## Current State
- Employers can create businesses freely
- Business info collected: name, type, email, phone, location
- No verification system exists
- No admin access

## Target State
- Businesses start as "pending" status
- Admin login page (static credentials)
- Admin dashboard shows pending businesses for review  
- Admin can approve/reject with simple buttons
- Business cards show verification status
- Only approved businesses can post jobs

## Implementation Plan

### 1. Database Changes
**File**: `database/migrations/006_business_verification_system.sql`

```sql
-- Add verification fields to businesses table
ALTER TABLE businesses 
ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN verification_notes TEXT,
ADD COLUMN document_url TEXT,
ADD COLUMN verified_at TIMESTAMPTZ,
ADD COLUMN verified_by TEXT;

-- Add admin profiles (static for now)
INSERT INTO profiles (id, email, role, role_locked_at) VALUES 
('admin-user-id', 'admin@timebuddy.app', 'admin', NOW())
ON CONFLICT (id) DO NOTHING;
```

### 2. Backend Changes

#### A. Extend Business Creation
**Files to Modify**:
- `backend/src/businesses/dto/create-business.dto.ts`
- `backend/src/businesses/businesses.service.ts`

**Changes**:
- Add document upload field to CreateBusinessDto
- Store document URL when creating business
- Set default verification_status = 'pending'

#### B. Create Admin Module
**New Files**:
```
backend/src/admin/
├── admin.module.ts
├── admin.controller.ts  
├── admin.service.ts
├── dto/admin-login.dto.ts
├── dto/verify-business.dto.ts
└── guards/admin.guard.ts
```

**Admin Endpoints**:
- `POST /admin/login` - Static login (admin/admin)
- `GET /admin/businesses/pending` - List pending businesses
- `POST /admin/businesses/:id/approve` - Approve business
- `POST /admin/businesses/:id/reject` - Reject business with notes

#### C. Business Restrictions
**Files to Modify**:
- `backend/src/jobs/jobs.service.ts`
- `backend/src/businesses/businesses.service.ts`

**Changes**:
- Check business verification status before allowing job posts
- Only approved businesses can access employee features

### 3. Frontend Changes

#### A. Extend Business Form
**File**: `frontend/src/components/business/BusinessForm.tsx`

**Changes**:
- Add document upload field (PDF/images)
- Use existing document upload system
- Show "Verification pending..." message after creation

#### B. Business Card Status
**File**: `frontend/src/components/business/BusinessCard.tsx` (or equivalent)

**Changes**:
- Show verification status badge:
  - 🟡 "Verification Pending" 
  - ✅ "Verified Business"
  - ❌ "Verification Rejected"

#### C. Admin Login & Dashboard
**New Files**:
```
frontend/src/pages/admin/
├── AdminLoginPage.tsx
└── AdminDashboardPage.tsx

frontend/src/components/admin/
├── AdminLogin.tsx
├── BusinessReviewCard.tsx
└── BusinessVerificationPanel.tsx
```

**Admin Dashboard Features**:
- Static login form (admin/admin)
- List of pending businesses
- Each business shows:
  - Business name, type, location
  - Employer email, phone
  - Uploaded document (viewable)
  - Google Maps link for location verification
  - Approve/Reject buttons
  - Notes field for rejection

### 4. Document Management
**Existing System**: Use current `documents` module

**Changes Needed**:
- Extend document types to include 'business_license'
- Associate documents with businesses during creation
- Admin access to view business documents

## Data Flow

### Business Creation Flow
```
1. Employer fills business form + uploads document
2. System creates business with status='pending' 
3. Document stored via existing documents system
4. Business appears in admin dashboard
5. Business card shows "Verification Pending"
```

### Admin Review Flow  
```
1. Admin logs in (admin/admin)
2. Admin sees list of pending businesses
3. Admin clicks on business to review:
   - Views business info
   - Opens document
   - Checks location on Google Maps
   - Clicks "Approve" or "Reject" (with notes)
4. Business status updated
5. Business card updates to show new status
```

### Business Restrictions
```
- Pending/Rejected businesses: Cannot post jobs, limited features
- Approved businesses: Full access to all features
```

## Admin Interface Design

### Login Page
```
Simple form:
- Username: [admin]
- Password: [admin] 
- [Login] button
```

### Dashboard
```
📋 Pending Business Verifications (3)

┌─────────────────────────────────────────┐
│ 🏪 Joe's Pizza Restaurant               │
│ 📧 joe@joespizza.com | ☎️ (555) 123-4567│  
│ 📍 123 Main St, Birmingham, AL         │
│ 📄 [View Document] 🗺️ [Check Location]  │
│ [✅ Approve] [❌ Reject]                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⛽ Shell Gas Station                    │
│ 📧 manager@shell123.com | ☎️ (555) 987-65│
│ 📍 456 Oak Ave, Mobile, AL             │  
│ 📄 [View Document] 🗺️ [Check Location]  │
│ [✅ Approve] [❌ Reject]                │
└─────────────────────────────────────────┘
```

## Security Considerations
- Static admin credentials (admin/admin) for MVP only
- Admin routes protected by admin guard
- File upload validation (document types, size limits)
- Admin actions logged with timestamps

## Testing Plan
1. Create business with document → verify pending status
2. Login as admin → verify dashboard shows business  
3. View document → verify document displays correctly
4. Check Google Maps link → verify location opens correctly
5. Approve business → verify status changes to approved
6. Reject business → verify status changes and notes saved
7. Test job posting restrictions → verify only approved businesses can post

## Implementation Status

### ✅ COMPLETED: Database Setup
- **Profiles Table**: ✅ Admin role support added
- **Businesses Table**: ✅ Verification fields added (verification_status, verification_notes, document_url, verified_at, verified_by)
- **Storage Bucket**: ✅ business-documents bucket created (5MB, PDF/DOC/Images)
- **Storage Policies**: ✅ RLS policies for document access
- **Admin User**: ✅ Test admin user created (admin@timebuddy.app / admin)
- **Existing Data**: ✅ All 4 existing businesses set to 'pending' status
- **Migration Applied**: ✅ business_verification_system migration successful

### 🔄 REMAINING: Implementation Estimate  
- **Backend Admin Module**: 6-8 hours  
- **Business Form Extension**: 2-3 hours
- **Business Card Status**: 1-2 hours
- **Admin Frontend**: 8-10 hours
- **Testing & Integration**: 2-3 hours
- **Total Remaining**: ~19-26 hours

## Files Affected Summary

**New Files** (9):
- `database/migrations/006_business_verification_system.sql`
- `backend/src/admin/*` (6 files)
- `frontend/src/pages/admin/*` (2 files)  
- `frontend/src/components/admin/*` (3 files)

**Modified Files** (6):
- `backend/src/businesses/dto/create-business.dto.ts`
- `backend/src/businesses/businesses.service.ts`
- `backend/src/jobs/jobs.service.ts`
- `frontend/src/components/business/BusinessForm.tsx`
- `frontend/src/components/business/BusinessCard.tsx`
- `backend/src/app.module.ts` (import AdminModule)

**No Complex Features**:
- ❌ Email notifications  
- ❌ Automated verification
- ❌ Complex admin user management
- ❌ Advanced document processing
- ❌ Real-time updates

**Simple & Surgical**:
- ✅ Static admin login
- ✅ Manual review process  
- ✅ Basic approve/reject actions
- ✅ Document viewing
- ✅ Status display on business cards
- ✅ Business posting restrictions

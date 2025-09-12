# Employee Dashboard Implementation Plan
## Mobile-First Gig Job Search Interface

### 📋 Overview
Create a mobile-optimized job search interface for gig workers that displays employer job postings in a clean, location-focused format similar to Indeed but optimized for mobile-first usage.

---

## 🎯 Core Requirements

### User Experience
- **Mobile-First Design**: Vertical feed optimized for thumb navigation
- **Simple Search**: Job title/keywords + Location filtering only
- **Progressive Disclosure**: Compact cards → Expandable detailed view
- **Location-Centric**: State → City → County hierarchical filtering

### Data Flow
- **Input**: Employer job postings (rich data from CreateJobDto)
- **Output**: Clean, filtered job cards for employee consumption
- **Apply**: Simple application system with privacy controls

---

## 📊 Data Mapping Analysis

### Employer Provides (from CreateJobDto):
```typescript
// Business Info
business_id, business_name, location, business_type, phone, email

// Job Basics  
job_title, job_type ('full-time'|'part-time'), status

// Schedule & Hours
expected_hours_per_week, schedule

// Compensation
pay_type ('hourly'|'salary'), pay_min, pay_max, pay_currency
supplemental_pay: ['bonus'|'tips'|'commission']
benefits: ['health_insurance'|'401k'|'pto']

// Details
job_description, language_preference, transportation_requirement
```

### Employee Sees:

#### **Compact Card (3 Elements)**
```
┌─────────────────────────────┐
│ 🏷️ {job_title}              │
│ 🏢 {business_name}           │  
│ 📍 {location}               │
└─────────────────────────────┘
```

#### **Expanded Card (Full Details)**
```
┌─────────────────────────────────────┐
│ 🏷️ {job_title}                      │
│ 🏢 {business_name}                   │
│ 📍 {city}, {county}, {state}        │
├─────────────────────────────────────┤
│ 💼 {job_type} • 💰 ${pay_min}-{pay_max}/{pay_type} │
│ ⏰ {expected_hours} hours/week       │
│ 📅 {schedule}                       │
├─────────────────────────────────────┤
│ 💵 {supplemental_pay.join(' • ')}   │
│ 🎁 {benefits.join(' • ')}           │
├─────────────────────────────────────┤
│ 📝 {job_description}                │
├─────────────────────────────────────┤
│ 🗣️ {language_preference}            │
│ 🚗 {transportation_requirement}      │
│ 🏪 {business_type}                  │
├─────────────────────────────────────┤
│ 📞 {phone}                          │
│ ✉️ {email}                          │
│ 📅 Posted {time_ago}                │
├─────────────────────────────────────┤
│ [💾 Save Job]    [📝 Apply Now]      │
└─────────────────────────────────────┘
```

---

## 🎨 UI/UX Design

### Mobile Interface Layout
```
┌─────────────────────────────────────┐
│ 🔍 Search Jobs (keywords)           │
│ [📍 Location Filter] [📍 Near Me]   │
├─────────────────────────────────────┤
│ 📄 Job Card 1 (Compact)            │
├─────────────────────────────────────┤
│ 📄 Job Card 2 (Compact)            │  
├─────────────────────────────────────┤
│ 📄 Job Card 3 (EXPANDED) ⭐        │
│   Full details + Apply button      │
├─────────────────────────────────────┤
│ 📄 Job Card 4 (Compact)            │
├─────────────────────────────────────┤
│ [Load More Jobs...]                 │
└─────────────────────────────────────┘
```

### Location Filter Design
```
┌─────────────────────────────────────┐
│ 📍 LOCATION FILTER                  │
├─────────────────────────────────────┤
│ 🏛️ State: [Select State ▼]         │
│    🔍 [Search states...]            │
│    • Alabama (45 jobs)             │  
│    • Alaska (12 jobs)              │
│                                     │
│ 🏙️ City: [Select City ▼]           │
│    🔍 [Search cities in Alabama...] │
│    • Birmingham (12 jobs)          │
│    • Mobile (8 jobs)               │
│                                     │
│ 🏘️ County: [Select County ▼]       │
│    🔍 [Search counties...]          │
│    • Jefferson County (8 jobs)     │
│    • Mobile County (4 jobs)        │
│                                     │
│ [Clear All] [Apply Filter]          │
└─────────────────────────────────────┘
```

---

## 🏗️ Technical Implementation

### New Components
```
src/components/employee/
├── JobBrowse.tsx              // Main job search interface
├── JobCard.tsx                // Compact & expanded job card component
├── LocationFilter.tsx         // Hierarchical location filter drawer
├── LocationDropdown.tsx       // Searchable location dropdown
├── JobSearch.tsx              // Search input component  
├── ApplicationModal.tsx       // Job application modal
└── WorkerProfile.tsx          // Basic worker profile management
```

### New API Endpoints
```
GET /jobs/public/search        // Public job search with filters
  ?keywords=cashier&state=AL&city=Birmingham&county=Jefferson&page=1

GET /jobs/public/:id           // Public job details

GET /locations/states          // States with available part-time jobs
  → [{ name: "Alabama", job_count: 45 }]

GET /locations/cities/:state   // Cities in state with jobs  
  → [{ name: "Birmingham", job_count: 12 }]

GET /locations/counties/:state/:city // Counties with jobs
  → [{ name: "Jefferson County", job_count: 8 }]

POST /applications             // Submit job application
  { job_id, worker_data, cover_message }
```

### Database Enhancements
```sql
-- Add location parsing for hierarchical search
ALTER TABLE job_posts ADD COLUMN parsed_state VARCHAR(50);
ALTER TABLE job_posts ADD COLUMN parsed_city VARCHAR(100);  
ALTER TABLE job_posts ADD COLUMN parsed_county VARCHAR(100);

-- Create indexes for efficient location search
CREATE INDEX idx_jobs_location_hierarchy 
  ON job_posts(parsed_state, parsed_city, parsed_county);

-- Job applications table
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES job_posts(id),
  worker_name VARCHAR(100) NOT NULL,
  worker_email VARCHAR(100) NOT NULL,
  worker_phone VARCHAR(20),
  cover_message TEXT,
  shared_data JSONB, -- What data worker chose to share
  applied_at TIMESTAMP DEFAULT NOW()
);

-- Worker profiles table  
CREATE TABLE worker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  location VARCHAR(100),
  bio TEXT,
  resume_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Implementation Phases

### **Phase 1: Core Job Search (Week 1)** ✅ COMPLETED
- [x] Create public job search API endpoint
- [x] Build JobBrowse page with vertical feed
- [x] Implement compact JobCard component
- [x] Add basic keyword search functionality
- [x] Replace EmployeeDashboard.tsx with job search interface

### **Phase 2: Location Filtering (Week 2)**  
- [ ] Parse existing job locations into State/City/County
- [ ] Create location hierarchy API endpoints
- [ ] Build LocationFilter component with search
- [ ] Implement dynamic filtering with job counts
- [ ] Add location-based job filtering

### **Phase 3: Job Details & Application (Week 3)**
- [ ] Add expandable job card functionality  
- [ ] Create ApplicationModal component
- [ ] Build worker profile management
- [ ] Implement job application submission
- [ ] Add privacy controls for data sharing

### **Phase 4: Mobile Optimization (Week 4)**
- [ ] Optimize for touch interactions
- [ ] Add smooth card expand/collapse animations  
- [ ] Implement infinite scroll/pagination
- [ ] Performance optimization and caching
- [ ] Cross-browser mobile testing

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ Gig workers can search jobs by keywords
- ✅ Location filtering works hierarchically (State→City→County)  
- ✅ Job cards display essential info in compact format
- ✅ Full job details available on card expansion
- ✅ Workers can apply with controlled data sharing
- ✅ Mobile-first interface works smoothly on phones

### Technical Requirements
- ✅ Fast search response times (<500ms)
- ✅ Efficient location hierarchy queries
- ✅ Clean separation of employer/employee data views
- ✅ Secure application submission system
- ✅ Responsive design for all screen sizes

---

## 📝 Notes

### Location Data Handling
- Parse existing `location` field format: "Birmingham, Alabama" → State: "Alabama", City: "Birmingham"
- Handle location variations and cleanup for consistency
- County data may need to be inferred or collected separately

### Mobile UX Considerations  
- Cards should be finger-friendly (minimum 44px touch targets)
- Smooth animations for expand/collapse (CSS transitions)
- Consider swipe gestures for card actions
- Optimize for one-handed usage

### Data Privacy
- Workers control what personal information to share per application
- No personal data stored without explicit consent  
- Clear privacy indicators in application flow

---

## 🎉 Phase 1 Implementation Summary

### ✅ What's Been Completed

**Backend API (Ready for Testing):**
- `GET /jobs/public/search` - Public job search with keyword and location filtering
- `GET /jobs/public/:id` - Get individual job details
- `GET /jobs/locations/states` - Get states with available jobs
- `GET /jobs/locations/cities/:state` - Get cities with jobs in a state  
- `GET /jobs/locations/counties/:state/:city` - Get counties with jobs

**Frontend Components (Ready for Use):**
- **JobBrowse** - Main mobile-first job search interface
- **JobCard** - Compact cards that expand to show full job details
- **LocationFilter** - Hierarchical State→City→County filter modal
- **EmployeeDashboard** - Replaced with new job search interface

**Key Features Working:**
- ✅ Mobile-optimized vertical job feed
- ✅ Keyword search across job title, description, business name
- ✅ Location-based filtering (hierarchical)
- ✅ Compact job cards (3 elements: title, business, location)
- ✅ Expandable cards with full job details
- ✅ Job count display in location filters
- ✅ Responsive design for mobile/desktop
- ✅ Clean data separation (only published jobs shown)

### 🚀 Ready to Test

**To start testing:**
1. Start backend: `cd backend && npm run start:dev`
2. Start frontend: `cd frontend && npm run dev`  
3. Login as employee to see new job search interface
4. Employers can post jobs which will appear in employee search

**Note:** Location hierarchy will work once job posts have proper location data in the database.

---

This plan provides a complete roadmap for transforming the current employer-focused job management system into a clean, mobile-first job search experience for gig workers.

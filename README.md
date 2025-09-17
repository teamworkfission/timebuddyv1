# PTimeBuddy - Local Gig Work Platform

## 🎯 Overview

PTimeBuddy is a comprehensive platform connecting local businesses with part-time employees. The platform provides secure user authentication, business management, job posting capabilities, and a revolutionary employee management system with GID-based onboarding.

## ✨ Key Features

### 🔐 Authentication System
- **Dual Role Support**: Employee and Employer accounts
- **Secure Authentication**: Supabase-powered auth with JWT tokens
- **Role-Based Access**: Different dashboards and permissions per role
- **Profile Management**: Complete user profile system

### 🏢 Business Management
- **Multi-Business Support**: Employers can manage multiple businesses
- **Business Profiles**: Complete business information and contact details
- **Google Places Integration**: Address autocomplete and validation
- **Business Analytics**: Employee counts and business statistics

### 💼 Job Posting & Applications
- **Comprehensive Job Posts**: Full job details with pay, schedule, benefits
- **Application Management**: Track applications through hiring pipeline
- **Status Workflow**: Draft → Published → Closed job lifecycle
- **Application Tracking**: Applied → Reviewed → Interviewed → Hired/Rejected

### 👥 **Employee Management System** ⭐ *NEW*
- **Auto-Generated GIDs**: Unique `GID-XXXXXX` employee identifiers
- **6-Box GID Input**: Intuitive separate input boxes for each character
- **Join Request Workflow**: Secure invitation and acceptance system
- **Employee Dashboard**: View and manage business associations
- **Role Management**: Employee, Supervisor, Manager roles

### 💰 **Payments & Reports System** ⭐ *NEW*
- **Payroll Calculation**: Auto-calculate pay from schedule hours
- **Rate Management**: Set and track hourly rates with history
- **Payment Tracking**: Record payments with advances, bonuses, deductions
- **Business Logic Protection**: Prevent double payments and calculation errors
- **Spending Reports**: Visual analytics and CSV export capabilities

### 🔍 Job Search & Discovery
- **Location-Based Search**: Find jobs by state, city, county
- **Keyword Search**: Search by job title, skills, description
- **Advanced Filters**: Filter by job type, pay range, benefits
- **Mobile-Optimized**: Responsive design for all devices

## 🏗️ Architecture

### Backend (NestJS + Supabase)
```
backend/
├── src/
│   ├── auth/                 # Authentication module
│   ├── businesses/           # Business management
│   ├── employees/            # Employee profiles & GID system
│   ├── jobs/                 # Job posting system
│   ├── job-applications/     # Application management
│   ├── join-requests/        # Employee invitation system ⭐ NEW
│   ├── documents/            # File upload handling
│   └── config/               # Supabase configuration
```

### Frontend (React + TypeScript + Tailwind)
```
frontend/
├── src/
│   ├── components/
│   │   ├── business/         # Business management UI
│   │   │   ├── AddEmployeeModal.tsx    # 6-box GID input ⭐ NEW
│   │   │   ├── EmployeeList.tsx        # Employee management ⭐ NEW
│   │   │   └── BusinessTile.tsx        # Enhanced with employee actions
│   │   ├── employee/         # Employee dashboard
│   │   │   ├── JoinRequests.tsx        # Business invitations ⭐ NEW
│   │   │   └── EmployeeHome.tsx        # Job search interface
│   │   ├── jobs/             # Job posting & applications
│   │   └── ui/               # Reusable UI components
│   ├── lib/                  # API clients
│   └── pages/                # Main application pages
```

### Database (Supabase PostgreSQL)
```sql
-- Core Tables
profiles              # User accounts (employee/employer)
employees             # Employee profiles with GIDs ⭐ ENHANCED
businesses            # Business information
job_posts             # Job postings
employee_job_application  # Job applications

-- Employee Management Tables ⭐ NEW
business_employee_requests   # Pending invitations
business_employees          # Confirmed associations
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Google Maps API key (for address autocomplete)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/teamworkfission/timebuddyv1.git
cd timebuddyv1
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Configure your Supabase credentials in .env
npm run build
npm run start:dev
```

3. **Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env
# Configure your API URLs and Google Maps key
npm run dev
```

4. **Database Setup**
```bash
# Run migrations in Supabase SQL Editor
# 1. Copy content from database/migrations/001_profiles.sql
# 2. Apply employee management migrations (see EMPLOYEE_MANAGEMENT_SYSTEM.md)
```

### Environment Variables

#### Backend (.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
PORT=3001
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 📚 Documentation

### Feature Documentation
- **[Employee Management System](./EMPLOYEE_MANAGEMENT_SYSTEM.md)** ⭐ *Complete guide to the new GID-based onboarding system*
- **[Business Module Implementation](./BUSINESS_MODULE_IMPLEMENTATION.md)** - Business management features
- **[Job Posting Guide](./EMPLOYER_JOB_POSTING_GUIDE.md)** - Job posting and application management
- **[Employee Dashboard Plan](./EMPLOYEE_DASHBOARD_IMPLEMENTATION_PLAN.md)** - Employee interface design
- **[Payments & Reports Implementation](./PAYMENTS_AND_REPORTS_IMPLEMENTATION.md)** - Complete payroll management system

### Technical Documentation
- **[Database Setup](./database/README.md)** - Database schema and migrations
- **[Frontend Setup](./frontend/SETUP.md)** - Frontend development guide
- **[Authentication Status](./AUTH_MODULE_STATUS.md)** - Auth system implementation

## 🎮 Usage Guide

### For Employers

1. **Register** as an employer and complete profile
2. **Create Business** with complete details and location
3. **Post Jobs** with detailed requirements and compensation
4. **Add Employees** using their 6-character GID codes ⭐ NEW
   - Click "Add Employee" on business cards
   - Enter GID in separate input boxes (e.g., T-I-J-N-H-O)
   - Send personalized invitation message
5. **Manage Applications** through the hiring pipeline
6. **View Employee List** and manage roles ⭐ NEW

### For Employees

1. **Register** as an employee and complete profile
2. **Receive Employee GID** automatically (format: GID-XXXXXX) ⭐ NEW
3. **Search Jobs** by location, keywords, and filters
4. **Apply to Jobs** with cover letters and resume
5. **Accept Business Invitations** from join requests ⭐ NEW
6. **Track Applications** through hiring status

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile

### Business Management
- `GET /businesses` - Get employer's businesses
- `POST /businesses` - Create new business
- `GET /businesses/:id/employees` - Get business employees ⭐ NEW
- `DELETE /businesses/:id/employees/:empId` - Remove employee ⭐ NEW

### Employee Management ⭐ NEW
- `POST /join-requests` - Send employee invitation
- `GET /join-requests/received` - Get employee's invitations
- `PATCH /join-requests/:id/respond` - Accept/decline invitation

### Job Management
- `GET /jobs` - Search jobs with filters
- `POST /jobs` - Create job post
- `POST /job-applications` - Apply to job
- `GET /job-applications` - Get applications

## 🧪 Testing

### Test Data
- **Employee GID**: `GID-TIJNHO` (use this to test employee invitations)
- **Test Business**: Restaurant with ID from database
- **Test Flow**: Employer invites employee → Employee accepts → Association created

### Testing Scenarios
1. **Employee Onboarding**: Test complete GID invitation flow
2. **Job Application**: Apply to jobs and track status
3. **Business Management**: Create businesses and manage employees
4. **Authentication**: Test role-based access control

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Supabase RLS policies enabled
- [ ] Google Maps API key configured
- [ ] SSL certificates installed
- [ ] Backend health checks working
- [ ] Frontend build optimized

### Deployment Platforms
- **Backend**: Railway, Heroku, DigitalOcean
- **Frontend**: Vercel, Netlify, AWS S3
- **Database**: Supabase (managed PostgreSQL)

## 🔒 Security Features

### Data Protection
- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive validation on all inputs
- **CORS Configuration**: Proper cross-origin request handling

### Privacy Controls
- **Consent-Based**: Employees must accept business invitations
- **Role Isolation**: Strict separation between employer/employee data
- **Secure File Upload**: Protected document storage
- **Audit Trails**: Comprehensive logging of user actions

## 🎯 Roadmap

### ✅ Recently Completed
- [x] **Payments & Reports System**: Complete payroll management with bulletproof business logic
- [x] **Schedule Integration**: Leverage existing schedule data for hour calculations
- [x] **Visual Analytics**: Charts and reporting with CSV export capabilities

### Upcoming Features
- [ ] **Bulk Employee Import**: CSV upload for multiple employees
- [ ] **Advanced Notifications**: Email/SMS for invitations and updates
- [ ] **Employee Analytics**: Performance metrics and insights
- [ ] **Advanced Payment Features**: Multi-period rates, payment reversals, bulk operations
- [ ] **Mobile Apps**: Native iOS and Android applications

### Performance Improvements
- [ ] **Caching Layer**: Redis for improved response times
- [ ] **Database Optimization**: Query optimization and indexing
- [ ] **CDN Integration**: Asset delivery optimization
- [ ] **Real-time Updates**: WebSocket integration for live updates

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting
- **Testing**: Unit and integration tests required

## 📞 Support

### Getting Help
- **Documentation**: Check feature-specific documentation files
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions

### Common Issues
- **Backend 404 Errors**: Ensure server is running and migrations applied
- **GID Not Found**: Verify employee has created profile and GID format
- **Authentication Errors**: Check Supabase configuration and tokens

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - Backend-as-a-Service platform
- **NestJS** - Progressive Node.js framework
- **React** - Frontend library
- **Tailwind CSS** - Utility-first CSS framework
- **Google Maps API** - Address autocomplete and validation

---

## 🎊 Latest Updates

### Employee Management System v1.0 ⭐ NEW
- ✅ Auto-generated employee GID system
- ✅ 6-box GID input interface for better UX
- ✅ Secure business-employee invitation workflow
- ✅ Employee dashboard with join request management
- ✅ Comprehensive employee management for employers
- ✅ Mobile-responsive design throughout

**Ready for production use!** 🚀

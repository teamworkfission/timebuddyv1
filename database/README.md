# Database Setup

## Local Development
1. Create Supabase project: https://supabase.com/dashboard
2. Run migration: Copy `001_profiles.sql` content to SQL Editor
3. Set environment variables in backend/.env

## Environment Variables
- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret)
- `SUPABASE_ANON_KEY`: Anonymous public key (frontend)

## Database Schema

### profiles table
- **id**: UUID, primary key, references auth.users(id)
- **email**: Case-insensitive text, unique
- **role**: Text, constrained to 'employee' or 'employer'
- **role_locked_at**: Timestamp when role was first set (prevents changes)
- **created_at/updated_at**: Audit timestamps

### Security Features
- **Row Level Security (RLS)**: Users can only access their own profile
- **Role Constraints**: Database-level validation of role values
- **Audit Trail**: Automatic timestamp management
- **Email Normalization**: Case-insensitive email handling

### Migration Notes
- The migration is idempotent (safe to run multiple times)
- Extensions are created with "if not exists" for safety
- All policies and functions use "create or replace" where applicable
- The trigger automatically updates `updated_at` on any profile changes

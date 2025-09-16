import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    @Inject(forwardRef(() => EmployeesService))
    private readonly employeesService: EmployeesService
  ) {}

  async emailExists(emailRaw: string): Promise<boolean> {
    const email = emailRaw.toLowerCase().trim();
    
    // Check auth.users first
    const { data: authUser } = await this.supabase.admin.auth.admin
      .listUsers({ page: 1, perPage: 1000 });
    
    // Filter for the specific email
    const userExists = authUser?.users?.some((user: any) => 
      user.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (userExists) return true;

    // Check profiles table as fallback
    const { data: profile } = await this.supabase.admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    return !!profile;
  }

  async verifyToken(bearer?: string) {
    console.log('🔐 Backend: Token verification started', {
      hasBearerHeader: !!bearer,
      bearerLength: bearer?.length
    });

    if (!bearer) throw new Error('Missing authorization header');
    
    const token = bearer.replace('Bearer ', '');
    console.log('🔑 Backend: Extracted token', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      tokenEnd: '...' + token.substring(token.length - 20)
    });
    
    try {
      // Use Supabase user client to verify the token (same as frontend)
      console.log('🔍 Backend: Calling Supabase user.auth.getUser...');
      const { data: user, error } = await this.supabase.user.auth.getUser(token);
      
      console.log('📊 Backend: Supabase getUser result', {
        hasUser: !!user?.user,
        userId: user?.user?.id,
        userEmail: user?.user?.email,
        error: error ? {
          message: error.message,
          status: error.status,
          code: error.code
        } : null
      });
      
      if (error || !user?.user) {
        console.error('❌ Backend: Token verification failed', error);
        throw new Error('Invalid token');
      }
      
      // Fetch user profile to get role information (if exists)
      const { data: profile, error: profileError } = await this.supabase.admin
        .from('profiles')
        .select('id, email, role')
        .eq('id', user.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      // For /auth/complete endpoint, profile may not exist yet (new users)
      // Return user data regardless of profile existence
      console.log('🔍 Backend: Profile lookup result', {
        profileExists: !!profile,
        profileId: profile?.id,
        profileRole: profile?.role
      });
      
      return {
        id: profile?.id || user.user.id, // Use auth ID if no profile yet
        userId: user.user.id,
        email: profile?.email || user.user.email || undefined,
        role: profile?.role, // undefined for new users (will be set during completion)
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  async completeAuth(
    userId: string,
    email: string | undefined,
    intendedRole?: 'employee' | 'employer'
  ) {
    const normalizedEmail = (email ?? '').toLowerCase().trim();
    console.log('🔐 Backend: Profile completion started', {
      userId,
      email: normalizedEmail,
      intendedRole,
      timestamp: new Date().toISOString()
    });

    // Check if profile already exists
    const { data: existing } = await this.supabase.admin
      .from('profiles')
      .select('id, email, role, role_locked_at')
      .eq('id', userId)
      .maybeSingle();

    console.log('🔍 Backend: Existing profile check result:', existing);

    if (existing) {
      // Return existing profile (role is locked)
      console.log('✅ Backend: Returning existing profile');
      return { 
        id: existing.id, 
        email: existing.email, 
        role: existing.role 
      };
    }

    // Create new profile with role lock - handle race conditions
    const role = intendedRole ?? 'employee';
    console.log('🚀 Backend: Creating new profile', {
      userId,
      email: normalizedEmail,
      role,
      timestamp: new Date().toISOString()
    });
    
    const { data: newProfile, error } = await this.supabase.admin
      .from('profiles')
      .insert({
        id: userId,
        email: normalizedEmail,
        role,
        role_locked_at: new Date().toISOString(),
      })
      .select('id, email, role')
      .single();

    console.log('📊 Backend: Profile creation result', {
      success: !error,
      data: newProfile,
      error: error
    });

    // Handle race condition: if profile was created by concurrent request
    if (error) {
      // Check if error is due to unique constraint violation (profile already exists)
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        // Profile was created by concurrent request, fetch and return it
        console.log('Profile creation race condition detected, fetching existing profile');
        const { data: existingProfile, error: fetchError } = await this.supabase.admin
          .from('profiles')
          .select('id, email, role')
          .eq('id', userId)
          .single();

        if (fetchError) {
          throw new Error(`Failed to fetch existing profile after race condition: ${fetchError.message}`);
        }

        return existingProfile;
      }
      
      // For other database errors, throw as before
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    // Automatically create employee record for employee role
    if (newProfile.role === 'employee') {
      try {
        console.log('🆔 Backend: Creating employee record for new employee user', {
          userId: newProfile.id,
          email: newProfile.email
        });

        // Create minimal employee record - GID will be auto-generated by database trigger
        await this.employeesService.create(newProfile.id, {
          full_name: '', // Will be filled later when user completes profile
          phone: '',
          email: newProfile.email,
          state: '',
          city: ''
        });

        console.log('✅ Backend: Employee record created successfully');
      } catch (error) {
        // Don't fail auth completion if employee record creation fails
        // User can complete profile later
        console.error('⚠️ Backend: Failed to create employee record (non-fatal):', error);
      }
    }

    return newProfile;
  }
}

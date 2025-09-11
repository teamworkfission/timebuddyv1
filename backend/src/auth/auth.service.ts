import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

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
    if (!bearer) throw new Error('Missing authorization header');
    
    const token = bearer.replace('Bearer ', '');
    
    try {
      // Use Supabase client to verify the token
      const { data: user, error } = await this.supabase.admin.auth.getUser(token);
      
      if (error || !user?.user) {
        throw new Error('Invalid token');
      }
      
      // Fetch user profile to get role information
      const { data: profile, error: profileError } = await this.supabase.admin
        .from('profiles')
        .select('id, email, role')
        .eq('id', user.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      if (!profile) {
        throw new Error('User profile not found');
      }
      
      return {
        id: profile.id,
        userId: user.user.id,
        email: profile.email || user.user.email || undefined,
        role: profile.role,
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

    // Check if profile already exists
    const { data: existing } = await this.supabase.admin
      .from('profiles')
      .select('id, email, role, role_locked_at')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      // Return existing profile (role is locked)
      return { 
        id: existing.id, 
        email: existing.email, 
        role: existing.role 
      };
    }

    // Create new profile with role lock - handle race conditions
    const role = intendedRole ?? 'employee';
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

    return newProfile;
  }
}

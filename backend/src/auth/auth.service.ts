import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import * as jose from 'jose';

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
    const jwks = jose.createRemoteJWKSet(
      new URL(`${process.env.SUPABASE_URL}/auth/v1/keys`)
    );
    
    try {
      const { payload } = await jose.jwtVerify(token, jwks);
      return {
        userId: payload.sub as string,
        email: (payload as any).email as string | undefined,
      };
    } catch (error) {
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

    // Create new profile with role lock
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

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    return newProfile;
  }
}

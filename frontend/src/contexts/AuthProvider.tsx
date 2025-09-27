import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { completeAuth } from '../lib/api';
import { AccountMismatchModal } from '../components/AccountMismatchModal';
import { clearAuthStorage, normalizeEmail } from '../lib/auth-utils';

interface Profile {
  id: string;
  email: string;
  role: 'employee' | 'employer';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  processingAuth: boolean;
  authError: string | null;
  retryAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mismatch, setMismatch] = useState<{
    typed: string;
    actual: string;
  } | null>(null);
  const [processingAuth, setProcessingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setAuthError(null);
    clearAuthStorage();
    navigate('/');
  };

  const retryAuth = async () => {
    if (!user) return;
    
    setAuthError(null);
    setProcessingAuth(true);
    
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        setAuthError('Session expired. Please sign in again.');
        setProcessingAuth(false);
        return;
      }

      const intendedRole = sessionStorage.getItem('intendedRole') as 'employee' | 'employer' | null;
      console.log('🔄 Retrying auth completion:', {
        userId: session.data.session.user.id,
        intendedRole
      });
      
      const profileData = await completeAuth(session.data.session.access_token, intendedRole || undefined);
      console.log('✅ Retry successful:', profileData);
      
      setProfile(profileData);
      setAuthError(null);
      
      // Clear auth storage
      clearAuthStorage();
      
      // Update last chosen role for UX
      localStorage.setItem('lastChosenRole', profileData.role);
      
      // Navigate to appropriate dashboard
      const dashboardPath = profileData.role === 'employer' ? '/app/employer' : '/app/employee';
      navigate(dashboardPath, { replace: true });
      
    } catch (error: unknown) {
      console.error('❌ Retry failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Invalid or expired token') || errorMessage.includes('Unauthorized')) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setAuthError(null);
        clearAuthStorage();
        navigate('/', { replace: true });
      } else {
        setAuthError('Failed to complete authentication. Please check your connection and try again.');
      }
    } finally {
      setProcessingAuth(false);
    }
  };

  // Auth guard: redirect authenticated users away from auth pages
  useEffect(() => {
    if (user && profile && ['/signin', '/signup'].includes(location.pathname)) {
      const dashboardPath = profile.role === 'employer' ? '/app/employer' : '/app/employee';
      navigate(dashboardPath, { replace: true });
    }
  }, [user, profile, location.pathname, navigate]);

  // Auth listener: set up once and handle all auth state changes
  useEffect(() => {
    const handleAuthCallback = async (session: any) => {
      if (!session) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        setProcessingAuth(false);
        return;
      }

      // Prevent duplicate processing
      if (processingAuth) {
        console.log('Auth processing already in progress, skipping...');
        return;
      }

      setProcessingAuth(true);
      
      // If we already have a user and profile, don't reprocess (prevents race conditions)
      if (user && profile && session.user.id === user.id) {
        console.log('User already authenticated with profile, skipping reprocessing');
        setLoading(false);
        setProcessingAuth(false);
        return;
      }

      setUser(session.user);

      // Check for email mismatch
      const typedEmail = sessionStorage.getItem('verifiedEmail');
      const actualEmail = normalizeEmail(session.user.email || '');
      
      if (typedEmail && actualEmail && typedEmail !== actualEmail) {
        setMismatch({ typed: typedEmail, actual: actualEmail });
        setLoading(false);
        setProcessingAuth(false);
        return;
      }

      try {
        const intendedRole = sessionStorage.getItem('intendedRole') as 'employee' | 'employer' | null;
        console.log('🔐 Auth completion started:', {
          userId: session.user.id,
          email: session.user.email,
          intendedRole,
          accessToken: session.access_token ? 'Present' : 'Missing'
        });
        
        const profileData = await completeAuth(session.access_token, intendedRole || undefined);
        console.log('✅ Profile creation successful:', profileData);
        
        setProfile(profileData);
        
        // Clear auth storage
        clearAuthStorage();
        
        // Update last chosen role for UX
        localStorage.setItem('lastChosenRole', profileData.role);
        
        // Navigate to appropriate dashboard
        const dashboardPath = profileData.role === 'employer' ? '/app/employer' : '/app/employee';
        console.log('🚀 Navigating to dashboard:', dashboardPath);
        navigate(dashboardPath, { replace: true });
        
      } catch (error) {
        console.error('❌ Auth completion failed:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          userId: session.user?.id,
          email: session.user?.email
        });
        
        // Only sign out for actual auth errors, not network errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Invalid or expired token') || errorMessage.includes('Unauthorized')) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setAuthError(null);
          clearAuthStorage();
          navigate('/', { replace: true });
        } else {
          // For network/timeout errors, set error state but keep session
          console.warn('Non-auth error during completion, retaining session:', errorMessage);
          let userFriendlyError = 'Failed to complete authentication. Please try again.';
          
          if (errorMessage.includes('timeout')) {
            userFriendlyError = 'Connection timeout. Please check your network and try again.';
          } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
            userFriendlyError = 'Network error. Please check your connection and try again.';
          }
          
          setAuthError(userFriendlyError);
        }
      }
      
      setLoading(false);
      setProcessingAuth(false);
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthCallback(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          handleAuthCallback(session);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
          setProcessingAuth(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // Empty dependencies - this should only run once on mount

  const handleContinueAs = async () => {
    if (!user || !mismatch || processingAuth) return;
    
    setProcessingAuth(true);
    
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        setProcessingAuth(false);
        return;
      }

      const intendedRole = sessionStorage.getItem('intendedRole') as 'employee' | 'employer' | null;
      const profileData = await completeAuth(session.data.session.access_token, intendedRole || undefined);
      
      setProfile(profileData);
      setMismatch(null);
      
      // Clear auth storage
      clearAuthStorage();
      
      // Update last chosen role for UX
      localStorage.setItem('lastChosenRole', profileData.role);
      
      // Navigate to appropriate dashboard
      const dashboardPath = profileData.role === 'employer' ? '/app/employer' : '/app/employee';
      navigate(dashboardPath, { replace: true });
      
    } catch (error) {
      console.error('Auth completion failed:', error);
      
      // Only sign out for actual auth errors, not network errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Invalid or expired token') || errorMessage.includes('Unauthorized')) {
        setMismatch(null);
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setAuthError(null);
        clearAuthStorage();
        navigate('/', { replace: true });
      } else {
        // For network/timeout errors, set error state but keep session
        console.warn('Non-auth error during completion, retaining session:', errorMessage);
        let userFriendlyError = 'Failed to complete authentication. Please try again.';
        
        if (errorMessage.includes('timeout')) {
          userFriendlyError = 'Connection timeout. Please check your network and try again.';
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
          userFriendlyError = 'Network error. Please check your connection and try again.';
        }
        
        setAuthError(userFriendlyError);
      }
    } finally {
      setProcessingAuth(false);
    }
  };

  const handleSwitchAccount = async () => {
    setMismatch(null);
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, processingAuth, authError, retryAuth, logout }}>
      {children}
      
      <AccountMismatchModal
        isOpen={!!mismatch}
        typedEmail={mismatch?.typed || ''}
        actualEmail={mismatch?.actual || ''}
        onContinueAs={handleContinueAs}
        onSwitchAccount={handleSwitchAccount}
      />
    </AuthContext.Provider>
  );
}

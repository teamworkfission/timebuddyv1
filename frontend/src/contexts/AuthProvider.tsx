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

  const navigate = useNavigate();
  const location = useLocation();

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    clearAuthStorage();
    navigate('/');
  };

  useEffect(() => {
    // Auth guard: redirect authenticated users away from auth pages
    if (user && profile && ['/signin', '/signup'].includes(location.pathname)) {
      const dashboardPath = profile.role === 'employer' ? '/app/employer' : '/app/employee';
      navigate(dashboardPath, { replace: true });
      return;
    }

    const handleAuthCallback = async (session: any) => {
      if (!session) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Check for email mismatch
      const typedEmail = sessionStorage.getItem('verifiedEmail');
      const actualEmail = normalizeEmail(session.user.email || '');
      
      if (typedEmail && actualEmail && typedEmail !== actualEmail) {
        setMismatch({ typed: typedEmail, actual: actualEmail });
        setLoading(false);
        return;
      }

      try {
        const intendedRole = sessionStorage.getItem('intendedRole') as 'employee' | 'employer' | null;
        const profileData = await completeAuth(session.access_token, intendedRole || undefined);
        
        setProfile(profileData);
        
        // Clear auth storage
        clearAuthStorage();
        
        // Update last chosen role for UX
        localStorage.setItem('lastChosenRole', profileData.role);
        
        // Navigate to appropriate dashboard
        const dashboardPath = profileData.role === 'employer' ? '/app/employer' : '/app/employee';
        navigate(dashboardPath, { replace: true });
        
      } catch (error) {
        console.error('Auth completion failed:', error);
        // Clean signout on any auth failure to prevent broken state
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        clearAuthStorage();
        navigate('/', { replace: true });
      }
      
      setLoading(false);
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
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname, user, profile]);

  const handleContinueAs = async () => {
    if (!user || !mismatch) return;
    
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

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
      // Clean signout on any auth failure to prevent broken state
      setMismatch(null);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      clearAuthStorage();
      navigate('/', { replace: true });
    }
  };

  const handleSwitchAccount = async () => {
    setMismatch(null);
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
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

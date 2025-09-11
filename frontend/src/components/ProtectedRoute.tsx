import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'employee' | 'employer';
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/" replace />;
  }

  if (requireRole && profile.role !== requireRole) {
    // Redirect to their actual role dashboard
    const redirectPath = profile.role === 'employer' ? '/app/employer' : '/app/employee';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

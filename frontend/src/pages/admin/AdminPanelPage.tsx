import { useState, useEffect } from 'react';
import { AdminLogin } from '../../components/admin/AdminLogin';
import { BusinessVerificationPanel } from '../../components/admin/BusinessVerificationPanel';
import { isAdminLoggedIn } from '../../lib/admin-api';

export function AdminPanelPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in
    setIsLoggedIn(isAdminLoggedIn());
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <BusinessVerificationPanel />;
}

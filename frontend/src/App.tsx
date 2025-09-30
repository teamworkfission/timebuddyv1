import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { EmployerDashboard } from './pages/EmployerDashboard';
import { AdminPanelPage } from './pages/admin/AdminPanelPage';

// Wrapper component that provides AuthProvider inside Router context
function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AuthLayout />}>
      {/* Public Routes */}
      <Route index element={<LandingPage />} />
      
      {/* Protected Routes */}
      <Route 
        path="app/employee" 
        element={
          <ProtectedRoute requireRole="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="app/employer" 
        element={
          <ProtectedRoute requireRole="employer">
            <EmployerDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes - No authentication required as it has its own login */}
      <Route path="admin" element={<AdminPanelPage />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

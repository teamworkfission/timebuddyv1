import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoadingFallback } from './components/ui/PageLoadingFallback';
import { 
  LandingPageLazy, 
  EmployeeDashboardLazy, 
  EmployerDashboardLazy, 
  AdminPanelPageLazy 
} from './pages/LazyPages';

// Wrapper component that provides AuthProvider inside Router context
function AuthLayout() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoadingFallback />}>
        <Outlet />
      </Suspense>
    </AuthProvider>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AuthLayout />}>
      {/* Public Routes */}
      <Route index element={<LandingPageLazy />} />
      
      {/* Protected Routes */}
      <Route 
        path="app/employee" 
        element={
          <ProtectedRoute requireRole="employee">
            <EmployeeDashboardLazy />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="app/employer" 
        element={
          <ProtectedRoute requireRole="employer">
            <EmployerDashboardLazy />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes - No authentication required as it has its own login */}
      <Route path="admin" element={<AdminPanelPageLazy />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

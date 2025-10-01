/**
 * Lazy-loaded page components for code splitting
 * This enables loading pages on-demand to reduce initial bundle size
 */
import { lazy } from 'react';

// Lazy load all main page components
// Note: Using named imports since components export as named exports, not default
export const LandingPageLazy = lazy(() => import('./LandingPage').then(module => ({ default: module.LandingPage })));
export const EmployeeDashboardLazy = lazy(() => import('./EmployeeDashboard').then(module => ({ default: module.EmployeeDashboard }))); 
export const EmployerDashboardLazy = lazy(() => import('./EmployerDashboard').then(module => ({ default: module.EmployerDashboard })));
export const AdminPanelPageLazy = lazy(() => import('./admin/AdminPanelPage').then(module => ({ default: module.AdminPanelPage })));


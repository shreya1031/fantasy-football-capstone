import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/authStore';
import { LoadingState } from '../design/primitives/States';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <LoadingState message="AUTH CHECK" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <LoadingState message="AUTH CHECK" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <LoadingState message="AUTH CHECK" />;
  if (isAuthenticated) {
    const redirect = (location.state as { from?: string })?.from ?? '/dashboard';
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}

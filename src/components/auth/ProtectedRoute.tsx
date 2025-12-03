import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';
import type { ModuleName, PermissionType } from '@/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredModule?: ModuleName;
  requiredPermission?: PermissionType;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requiredModule,
  requiredPermission = 'read',
  adminOnly = false,
}) => {
  const { user, isLoading: authLoading, hasRole, isAdmin } = useAuth();
  const { canAccess, isLoading: permLoading } = usePermissions();
  const location = useLocation();

  const isLoading = authLoading || permLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check admin-only routes
  if (adminOnly && !isAdmin) {
    return <Navigate to="/acces-refuse" replace />;
  }

  // Check required role
  if (requiredRole && !hasRole(requiredRole) && !isAdmin) {
    return <Navigate to="/acces-refuse" replace />;
  }

  // Check module-level permission
  if (requiredModule && !canAccess(requiredModule, requiredPermission)) {
    return <Navigate to="/acces-refuse" replace />;
  }

  return <>{children}</>;
};

import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSecurityLogger } from '@/hooks/useSecurityLogger';
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
  const { canAccess, isLoading: permLoading, permissions } = usePermissions();
  const { logBlockedAction } = useSecurityLogger();
  const location = useLocation();
  const hasLoggedRef = useRef(false);

  const isLoading = authLoading || permLoading;

  // Log blocked route access when user is denied
  useEffect(() => {
    if (!isLoading && user && !hasLoggedRef.current) {
      const isDenied = (adminOnly && !isAdmin) || 
        (requiredRole && !hasRole(requiredRole) && !isAdmin) ||
        (requiredModule && !canAccess(requiredModule, requiredPermission));
      
      if (isDenied) {
        hasLoggedRef.current = true;
        const modulePerms = requiredModule ? permissions[requiredModule] : null;
        const heldPermissions = modulePerms 
          ? Object.entries(modulePerms).filter(([_, v]) => v).map(([k]) => k)
          : [];

        logBlockedAction({
          module: requiredModule || 'securite' as ModuleName,
          actionAttempted: requiredPermission,
          blockSource: 'url_forced',
          permissionsHeld: heldPermissions,
          additionalContext: { attemptedUrl: location.pathname, adminOnly, requiredRole },
        });
      }
    }
  }, [isLoading, user, adminOnly, isAdmin, requiredRole, requiredModule, requiredPermission, hasRole, canAccess, permissions, logBlockedAction, location.pathname]);

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

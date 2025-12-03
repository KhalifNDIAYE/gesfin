import { useCallback, useEffect, useRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { useSecurityLogger } from "@/hooks/useSecurityLogger";
import type { ModuleName, PermissionType } from "@/types/database";

interface PermissionButtonProps extends ButtonProps {
  module: ModuleName;
  permission: PermissionType;
  fallback?: React.ReactNode;
  resourceType?: string;
  resourceId?: string;
  logAttempt?: boolean; // Whether to log when button is hidden (default: false)
}

/**
 * A button that only renders if the user has the required permission.
 * This enforces the permissions matrix at the UI level.
 * Set logAttempt=true to log when a user without permission sees a hidden button.
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  module,
  permission,
  fallback = null,
  resourceType,
  resourceId,
  logAttempt = false, // Don't log by default - hidden buttons aren't "attempts"
  children,
  onClick,
  ...buttonProps
}) => {
  const { canAccess, isLoading, permissions } = usePermissions();
  const { logBlockedAction } = useSecurityLogger();
  const hasLoggedRef = useRef(false);

  const hasPermission = canAccess(module, permission);

  // Only log if logAttempt is explicitly enabled
  useEffect(() => {
    if (!isLoading && !hasPermission && logAttempt && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      
      const modulePerms = permissions[module];
      const heldPermissions = modulePerms 
        ? Object.entries(modulePerms)
            .filter(([_, value]) => value)
            .map(([key]) => key)
        : [];

      logBlockedAction({
        module,
        actionAttempted: permission,
        resourceType,
        resourceId,
        blockSource: 'ui',
        permissionsHeld: heldPermissions,
      });
    }
  }, [isLoading, hasPermission, logAttempt, module, permission, resourceType, resourceId, logBlockedAction, permissions]);

  useEffect(() => {
    return () => {
      hasLoggedRef.current = false;
    };
  }, [module, permission]);

  if (isLoading) {
    return null;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <Button onClick={onClick} {...buttonProps}>{children}</Button>;
};

/**
 * A wrapper component that conditionally renders children based on permissions.
 * Useful for wrapping any UI element, not just buttons.
 * Does NOT log blocked attempts by default (use logAttempt=true to enable).
 */
interface PermissionGateProps {
  module: ModuleName;
  permission: PermissionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  resourceType?: string;
  resourceId?: string;
  logAttempt?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  permission,
  children,
  fallback = null,
  resourceType,
  resourceId,
  logAttempt = false,
}) => {
  const { canAccess, isLoading, permissions } = usePermissions();
  const { logBlockedAction } = useSecurityLogger();
  const hasLoggedRef = useRef(false);

  const hasPermission = canAccess(module, permission);

  useEffect(() => {
    if (!isLoading && !hasPermission && logAttempt && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      
      const modulePerms = permissions[module];
      const heldPermissions = modulePerms 
        ? Object.entries(modulePerms)
            .filter(([_, value]) => value)
            .map(([key]) => key)
        : [];

      logBlockedAction({
        module,
        actionAttempted: permission,
        resourceType,
        resourceId,
        blockSource: 'ui',
        permissionsHeld: heldPermissions,
      });
    }
  }, [isLoading, hasPermission, logAttempt, module, permission, resourceType, resourceId, logBlockedAction, permissions]);

  useEffect(() => {
    return () => {
      hasLoggedRef.current = false;
    };
  }, [module, permission]);

  if (isLoading) {
    return null;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook to check multiple permissions at once.
 * Useful for complex permission logic.
 */
export const useModulePermissions = (module: ModuleName) => {
  const { canAccess, isLoading } = usePermissions();

  return {
    isLoading,
    canRead: canAccess(module, 'read'),
    canCreate: canAccess(module, 'create'),
    canUpdate: canAccess(module, 'update'),
    canDelete: canAccess(module, 'delete'),
    canValidate: canAccess(module, 'validate'),
    canExport: canAccess(module, 'export'),
  };
};

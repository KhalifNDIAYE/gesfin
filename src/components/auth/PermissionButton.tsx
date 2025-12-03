import { Button, ButtonProps } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import type { ModuleName, PermissionType } from "@/types/database";

interface PermissionButtonProps extends ButtonProps {
  module: ModuleName;
  permission: PermissionType;
  fallback?: React.ReactNode;
}

/**
 * A button that only renders if the user has the required permission.
 * This enforces the permissions matrix at the UI level.
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  module,
  permission,
  fallback = null,
  children,
  ...buttonProps
}) => {
  const { canAccess, isLoading } = usePermissions();

  // Don't render while loading to avoid flicker
  if (isLoading) {
    return null;
  }

  // Check if user has the required permission
  if (!canAccess(module, permission)) {
    return <>{fallback}</>;
  }

  return <Button {...buttonProps}>{children}</Button>;
};

/**
 * A wrapper component that conditionally renders children based on permissions.
 * Useful for wrapping any UI element, not just buttons.
 */
interface PermissionGateProps {
  module: ModuleName;
  permission: PermissionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  permission,
  children,
  fallback = null,
}) => {
  const { canAccess, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!canAccess(module, permission)) {
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

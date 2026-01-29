import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { ModuleName, PermissionType } from '@/types/database';

interface UserPermissions {
  [module: string]: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    validate: boolean;
    export: boolean;
  };
}

export const usePermissions = () => {
  const { user, isAdmin, roles, isLoading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      // Wait for auth to finish loading before checking permissions
      if (authLoading) {
        return;
      }

      if (!user) {
        setPermissions({});
        setIsLoading(false);
        return;
      }

      // Admin has all permissions - check roles array directly for reliability
      const userIsAdmin = isAdmin || roles.some(role => role.name === 'admin');
      
      if (userIsAdmin) {
        const allPerms = { read: true, create: true, update: true, delete: true, validate: true, export: true };
        const allPermissions: UserPermissions = {
          dashboard: allPerms,
          projets: allPerms,
          comptabilite: allPerms,
          bailleurs: allPerms,
          conventions: allPerms,
          immobilisations: allPerms,
          marches: allPerms,
          decaissements: allPerms,
          rapports: allPerms,
          utilisateurs: allPerms,
          securite: allPerms,
          parametres: allPerms,
        };
        setPermissions(allPermissions);
        setIsLoading(false);
        return;
      }

      // Fetch user permissions from database
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles!inner (
            id,
            role_permissions (
              permission_id,
              permissions!inner (
                module,
                permission
              )
            )
          )
        `)
        .eq('user_id', user.id);

      if (error || !data) {
        setPermissions({});
        setIsLoading(false);
        return;
      }

      // Build permissions map
      const permMap: UserPermissions = {};
      
      data.forEach((userRole: any) => {
        const rolePerms = userRole.roles?.role_permissions || [];
        rolePerms.forEach((rp: any) => {
          const module = rp.permissions?.module;
          const perm = rp.permissions?.permission;
          
          if (module && perm) {
            if (!permMap[module]) {
              permMap[module] = { read: false, create: false, update: false, delete: false, validate: false, export: false };
            }
            permMap[module][perm as PermissionType] = true;
          }
        });
      });

      setPermissions(permMap);
      setIsLoading(false);
    };

    fetchPermissions();
  }, [user, isAdmin, roles, authLoading]);

  const canAccess = useCallback((module: ModuleName, permission: PermissionType = 'read'): boolean => {
    // Check both isAdmin from context and roles array for reliability
    const userIsAdmin = isAdmin || roles.some(role => role.name === 'admin');
    if (userIsAdmin) return true;
    return permissions[module]?.[permission] ?? false;
  }, [permissions, isAdmin, roles]);

  const canAccessAny = useCallback((modules: ModuleName[], permission: PermissionType = 'read'): boolean => {
    const userIsAdmin = isAdmin || roles.some(role => role.name === 'admin');
    if (userIsAdmin) return true;
    return modules.some(module => permissions[module]?.[permission] ?? false);
  }, [permissions, isAdmin, roles]);

  return {
    permissions,
    isLoading,
    canAccess,
    canAccessAny,
    isAdmin,
  };
};

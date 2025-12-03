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
  };
}

export const usePermissions = () => {
  const { user, isAdmin, roles } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions({});
        setIsLoading(false);
        return;
      }

      // Admin has all permissions
      if (isAdmin) {
        const allPermissions: UserPermissions = {
          dashboard: { read: true, create: true, update: true, delete: true },
          projets: { read: true, create: true, update: true, delete: true },
          comptabilite: { read: true, create: true, update: true, delete: true },
          bailleurs: { read: true, create: true, update: true, delete: true },
          conventions: { read: true, create: true, update: true, delete: true },
          immobilisations: { read: true, create: true, update: true, delete: true },
          marches: { read: true, create: true, update: true, delete: true },
          decaissements: { read: true, create: true, update: true, delete: true },
          rapports: { read: true, create: true, update: true, delete: true },
          utilisateurs: { read: true, create: true, update: true, delete: true },
          securite: { read: true, create: true, update: true, delete: true },
          parametres: { read: true, create: true, update: true, delete: true },
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
              permMap[module] = { read: false, create: false, update: false, delete: false };
            }
            permMap[module][perm as PermissionType] = true;
          }
        });
      });

      setPermissions(permMap);
      setIsLoading(false);
    };

    fetchPermissions();
  }, [user, isAdmin]);

  const canAccess = useCallback((module: ModuleName, permission: PermissionType = 'read'): boolean => {
    if (isAdmin) return true;
    return permissions[module]?.[permission] ?? false;
  }, [permissions, isAdmin]);

  const canAccessAny = useCallback((modules: ModuleName[], permission: PermissionType = 'read'): boolean => {
    if (isAdmin) return true;
    return modules.some(module => permissions[module]?.[permission] ?? false);
  }, [permissions, isAdmin]);

  return {
    permissions,
    isLoading,
    canAccess,
    canAccessAny,
    isAdmin,
  };
};

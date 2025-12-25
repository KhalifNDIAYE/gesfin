import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  module: string;
  permission: string;
  description: string | null;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Role[];
    },
  });
};

export const useRole = (roleId: string) => {
  return useQuery({
    queryKey: ['role', roleId],
    queryFn: async () => {
      const { data: role, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .maybeSingle();

      if (error) throw error;
      if (!role) return null;

      const { data: rolePermissions } = await supabase
        .from('role_permissions')
        .select(`
          permission_id,
          permissions (id, module, permission, description)
        `)
        .eq('role_id', roleId);

      return {
        ...role,
        permissions: rolePermissions?.map(rp => rp.permissions as unknown as Permission).filter(Boolean) || [],
      } as RoleWithPermissions;
    },
    enabled: !!roleId,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: role, error } = await supabase
        .from('roles')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rôle créé');
    },
    onError: () => {
      toast.error('Erreur lors de la création du rôle');
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, data }: { roleId: string; data: { name?: string; description?: string } }) => {
      const { error } = await supabase
        .from('roles')
        .update(data)
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rôle mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du rôle');
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rôle supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du rôle');
    },
  });
};

export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module')
        .order('permission');

      if (error) throw error;
      return data as Permission[];
    },
  });
};

export const useGrantPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      const { error } = await supabase
        .from('role_permissions')
        .insert({ role_id: roleId, permission_id: permissionId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role'] });
      toast.success('Permission accordée');
    },
    onError: () => {
      toast.error('Erreur lors de l\'attribution de la permission');
    },
  });
};

export const useRevokePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role'] });
      toast.success('Permission révoquée');
    },
    onError: () => {
      toast.error('Erreur lors de la révocation de la permission');
    },
  });
};

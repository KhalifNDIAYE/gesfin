import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function usePurgeData() {
  const { user, hasRole } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has admin role
  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data: userRoles, error } = await supabase
        .from("user_roles")
        .select(`
          role_id,
          roles (name, is_system)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const hasAdminRole = userRoles?.some((ur: any) =>
        ur.roles?.name?.toLowerCase() === "admin" ||
        ur.roles?.name?.toLowerCase() === "administrateur" ||
        ur.roles?.is_system === true
      );

      setIsAdmin(hasAdminRole || false);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAdmin,
    isLoading,
    checkAdminStatus,
    user,
  };
}

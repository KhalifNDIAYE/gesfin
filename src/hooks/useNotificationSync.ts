import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationType, NotificationSeverity } from './useNotifications';

interface BusinessAlert {
  type: NotificationType;
  severity: NotificationSeverity;
  module: string;
  entityType: string;
  entityId: string;
  entityName: string;
  title: string;
  message: string;
  directLink: string;
}

// Generate a unique key for each business alert to prevent duplicates
const generateAlertKey = (alert: BusinessAlert): string => {
  return `${alert.type}_${alert.entityType}_${alert.entityId}`;
};

export const useNotificationSync = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const syncInProgress = useRef(false);

  // Fetch existing notifications to check for duplicates
  const { data: existingNotifications } = useQuery({
    queryKey: ['existing-notification-keys', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, related_entity_type, related_entity_id')
        .not('status', 'eq', 'archived');
      
      if (error) throw error;
      
      // Create a set of existing notification keys
      const keys = new Set<string>();
      data?.forEach(n => {
        keys.add(`${n.type}_${n.related_entity_type}_${n.related_entity_id}`);
      });
      return keys;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Fetch business alerts from different modules
  const { data: businessAlerts } = useQuery({
    queryKey: ['business-alerts-detection'],
    queryFn: async (): Promise<BusinessAlert[]> => {
      const today = new Date().toISOString().split('T')[0];
      const alerts: BusinessAlert[] = [];

      // Fetch all data in parallel
      const [
        delayedProjects,
        budgetOverrunProjects,
        expiredConventions,
        overdrawnBudgetLines,
      ] = await Promise.all([
        // Delayed projects
        supabase
          .from('projects')
          .select('id, name, end_date')
          .lt('end_date', today)
          .not('status', 'in', '("completed","closed","cancelled")'),
        
        // Budget overrun projects
        supabase
          .from('projects')
          .select('id, name, total_budget, consumed_budget')
          .not('total_budget', 'is', null)
          .not('consumed_budget', 'is', null),
        
        // Expired conventions
        supabase
          .from('conventions')
          .select('id, name, closing_date, bailleur:bailleurs(name)')
          .lt('closing_date', today)
          .eq('status', 'active'),
        
        // Overdrawn budget lines
        supabase
          .from('budget_lines')
          .select(`
            id, 
            line_number, 
            description, 
            forecast_amount, 
            realized_amount,
            budget:budgets(id, name, project:projects(id, name))
          `)
          .not('forecast_amount', 'is', null)
          .gt('forecast_amount', 0),
      ]);

      // Process delayed projects
      if (delayedProjects.data) {
        for (const project of delayedProjects.data) {
          alerts.push({
            type: 'project_late',
            severity: 'warning',
            module: 'projets',
            entityType: 'project',
            entityId: project.id,
            entityName: project.name,
            title: 'Projet en retard',
            message: `Le projet "${project.name}" a dépassé sa date de fin prévue (${project.end_date})`,
            directLink: `/projets/${project.id}`,
          });
        }
      }

      // Process budget overrun projects
      if (budgetOverrunProjects.data) {
        for (const project of budgetOverrunProjects.data) {
          if (project.consumed_budget && project.total_budget && project.consumed_budget > project.total_budget) {
            const overrunPercent = Math.round(((project.consumed_budget - project.total_budget) / project.total_budget) * 100);
            alerts.push({
              type: 'budget_overrun',
              severity: overrunPercent > 20 ? 'critical' : 'warning',
              module: 'projets',
              entityType: 'project',
              entityId: project.id,
              entityName: project.name,
              title: 'Dépassement budget projet',
              message: `Le projet "${project.name}" a dépassé son budget de ${overrunPercent}%`,
              directLink: `/projets/${project.id}`,
            });
          }
        }
      }

      // Process expired conventions
      if (expiredConventions.data) {
        for (const convention of expiredConventions.data) {
          const bailleurName = (convention.bailleur as any)?.name || 'Inconnu';
          alerts.push({
            type: 'convention_expired',
            severity: 'warning',
            module: 'conventions',
            entityType: 'convention',
            entityId: convention.id,
            entityName: convention.name,
            title: 'Convention expirée',
            message: `La convention "${convention.name}" (${bailleurName}) est expirée depuis le ${convention.closing_date}`,
            directLink: `/conventions/${convention.id}`,
          });
        }
      }

      // Process overdrawn budget lines
      if (overdrawnBudgetLines.data) {
        for (const line of overdrawnBudgetLines.data) {
          if (line.realized_amount && line.forecast_amount && line.realized_amount > line.forecast_amount) {
            const budget = line.budget as any;
            const project = budget?.project;
            const overrunPercent = Math.round(((line.realized_amount - line.forecast_amount) / line.forecast_amount) * 100);
            
            alerts.push({
              type: 'budget_overrun',
              severity: overrunPercent > 20 ? 'critical' : 'warning',
              module: 'budget',
              entityType: 'budget_line',
              entityId: line.id,
              entityName: line.description || `Ligne ${line.line_number}`,
              title: 'Dépassement ligne budgétaire',
              message: `La ligne "${line.description || `Ligne ${line.line_number}`}" du budget "${budget?.name || 'N/A'}" a dépassé de ${overrunPercent}%`,
              directLink: budget?.id ? `/budget/${budget.id}` : '/budget',
            });
          }
        }
      }

      return alerts;
    },
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  // Mutation to create notifications
  const createNotifications = useMutation({
    mutationFn: async (alerts: BusinessAlert[]) => {
      if (!user?.id || alerts.length === 0) return;

      const notifications = alerts.map(alert => ({
        user_id: user.id,
        type: alert.type,
        severity: alert.severity,
        module: alert.module,
        title: alert.title,
        message: alert.message,
        related_entity_type: alert.entityType,
        related_entity_id: alert.entityId,
        related_entity_name: alert.entityName,
        direct_link: alert.directLink,
        status: 'unread',
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['existing-notification-keys'] });
      queryClient.invalidateQueries({ queryKey: ['unified-alerts'] });
    },
  });

  // Sync business alerts with notifications
  const syncNotifications = useCallback(async () => {
    if (!user || !businessAlerts || !existingNotifications || syncInProgress.current) return;

    syncInProgress.current = true;

    try {
      // Find new alerts that don't have corresponding notifications
      const newAlerts = businessAlerts.filter(alert => {
        const key = generateAlertKey(alert);
        return !existingNotifications.has(key);
      });

      if (newAlerts.length > 0) {
        await createNotifications.mutateAsync(newAlerts);
      }
    } finally {
      syncInProgress.current = false;
    }
  }, [user, businessAlerts, existingNotifications, createNotifications]);

  // Run sync on mount and when dependencies change
  useEffect(() => {
    if (user && businessAlerts && existingNotifications) {
      syncNotifications();
    }
  }, [user, businessAlerts, existingNotifications, syncNotifications]);

  return {
    syncNotifications,
    isLoading: createNotifications.isPending,
  };
};

// Hook to get unified alert counts from notifications table
export const useUnifiedAlertCounts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unified-alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, related_entity_type, related_entity_id, severity')
        .eq('status', 'unread');

      if (error) throw error;

      // Count unique alerts by type and entity
      const projectsLate = new Set<string>();
      const projectsBudgetOverrun = new Set<string>();
      const conventionsExpired = new Set<string>();
      const budgetLinesOverdrawn = new Set<string>();

      data?.forEach(n => {
        if (n.type === 'project_late' && n.related_entity_type === 'project') {
          projectsLate.add(n.related_entity_id!);
        }
        if (n.type === 'budget_overrun' && n.related_entity_type === 'project') {
          projectsBudgetOverrun.add(n.related_entity_id!);
        }
        if (n.type === 'convention_expired' && n.related_entity_type === 'convention') {
          conventionsExpired.add(n.related_entity_id!);
        }
        if (n.type === 'budget_overrun' && n.related_entity_type === 'budget_line') {
          budgetLinesOverdrawn.add(n.related_entity_id!);
        }
      });

      return {
        projetsEnRetard: projectsLate.size,
        projetsBudgetDepasse: projectsBudgetOverrun.size,
        conventionsExpirees: conventionsExpired.size,
        budgetsEnDepassement: budgetLinesOverdrawn.size,
        total: data?.length || 0,
      };
    },
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};

// Hook to resolve alerts when the issue is fixed
export const useResolveBusinessAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: string; entityId: string }) => {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .eq('related_entity_type', entityType)
        .eq('related_entity_id', entityId)
        .eq('status', 'unread');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['unified-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['existing-notification-keys'] });
    },
  });
};

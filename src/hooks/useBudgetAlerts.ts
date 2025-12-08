import { supabase } from '@/integrations/supabase/client';
import { createNotification } from './useNotifications';
import { sendAlertEmail } from './useEmailNotifications';

export type BudgetAlertLevel = 'preventive' | 'critical' | 'blocking';

export interface BudgetAlertThreshold {
  level: BudgetAlertLevel;
  percentage: number;
  label: string;
  severity: 'warning' | 'major' | 'critical';
  recipientRoles: string[];
}

export const BUDGET_ALERT_THRESHOLDS: BudgetAlertThreshold[] = [
  {
    level: 'preventive',
    percentage: 80,
    label: 'Alerte préventive (80%)',
    severity: 'warning',
    recipientRoles: ['comptable', 'daf'],
  },
  {
    level: 'critical',
    percentage: 90,
    label: 'Alerte critique (90%)',
    severity: 'major',
    recipientRoles: ['daf', 'dg'],
  },
  {
    level: 'blocking',
    percentage: 100,
    label: 'Blocage total (100%)',
    severity: 'critical',
    recipientRoles: ['admin', 'dg'],
  },
];

export interface BudgetConsumptionInfo {
  budgetLineId: string;
  budgetLineName: string;
  budgetId: string;
  budgetName: string;
  forecastAmount: number;
  consumedAmount: number; // committed + realized
  consumptionPercentage: number;
  remainingAmount: number;
}

/**
 * Calculate the consumption percentage for a budget line
 */
export function calculateBudgetConsumption(
  forecastAmount: number,
  committedAmount: number,
  realizedAmount: number
): { consumedAmount: number; consumptionPercentage: number; remainingAmount: number } {
  const consumedAmount = committedAmount + realizedAmount;
  const consumptionPercentage = forecastAmount > 0 ? (consumedAmount / forecastAmount) * 100 : 0;
  const remainingAmount = forecastAmount - consumedAmount;

  return { consumedAmount, consumptionPercentage, remainingAmount };
}

/**
 * Determine which alert level should be triggered based on consumption percentage
 */
export function determineAlertLevel(consumptionPercentage: number): BudgetAlertThreshold | null {
  // Sort by percentage descending to get the highest applicable threshold
  const sortedThresholds = [...BUDGET_ALERT_THRESHOLDS].sort((a, b) => b.percentage - a.percentage);
  
  for (const threshold of sortedThresholds) {
    if (consumptionPercentage >= threshold.percentage) {
      return threshold;
    }
  }
  
  return null;
}

/**
 * Get users by role names
 */
async function getUsersByRoles(roleNames: string[]): Promise<{ id: string; email: string; fullName: string }[]> {
  try {
    const { data: roles } = await supabase
      .from('roles')
      .select('id, name')
      .in('name', roleNames);

    if (!roles || roles.length === 0) return [];

    const roleIds = roles.map(r => r.id);

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('user_id, profiles!inner(id, email, full_name)')
      .in('role_id', roleIds);

    if (!userRoles) return [];

    // Remove duplicates based on user_id
    const uniqueUsers = new Map<string, { id: string; email: string; fullName: string }>();
    for (const ur of userRoles) {
      const profile = ur.profiles as any;
      if (profile && !uniqueUsers.has(profile.id)) {
        uniqueUsers.set(profile.id, {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name || profile.email,
        });
      }
    }

    return Array.from(uniqueUsers.values());
  } catch (error) {
    console.error('Failed to get users by roles:', error);
    return [];
  }
}

/**
 * Log budget alert to audit log
 */
async function logBudgetAlertToAudit(
  alertLevel: BudgetAlertLevel,
  consumptionInfo: BudgetConsumptionInfo,
  triggeredBy?: string
): Promise<void> {
  try {
    await supabase.rpc('log_audit_event', {
      _action: `alerte_budget_${alertLevel}`,
      _module: 'comptabilite',
      _resource_type: 'budget_line',
      _resource_id: consumptionInfo.budgetLineId,
      _old_values: JSON.stringify({
        budget_line_name: consumptionInfo.budgetLineName,
        budget_name: consumptionInfo.budgetName,
        forecast_amount: consumptionInfo.forecastAmount,
      }),
      _new_values: JSON.stringify({
        consumed_amount: consumptionInfo.consumedAmount,
        consumption_percentage: consumptionInfo.consumptionPercentage.toFixed(2),
        remaining_amount: consumptionInfo.remainingAmount,
        alert_level: alertLevel,
        triggered_by: triggeredBy,
      }),
    });
    console.log(`Budget alert ${alertLevel} logged to audit for line ${consumptionInfo.budgetLineId}`);
  } catch (error) {
    console.error('Failed to log budget alert to audit:', error);
  }
}

/**
 * Create internal notifications for budget alerts
 */
async function sendBudgetNotifications(
  threshold: BudgetAlertThreshold,
  consumptionInfo: BudgetConsumptionInfo,
  triggeredBy?: string
): Promise<void> {
  const recipients = await getUsersByRoles(threshold.recipientRoles);

  const notificationType = threshold.level === 'blocking' 
    ? 'budget_overrun' as const
    : 'validation_pending' as const;
  
  const notificationSeverity = threshold.severity === 'critical' 
    ? 'critical' as const
    : threshold.severity === 'major' 
      ? 'warning' as const 
      : 'info' as const;

  const title = threshold.level === 'blocking'
    ? `🚫 Blocage budgétaire (${consumptionInfo.consumptionPercentage.toFixed(0)}%)`
    : threshold.level === 'critical'
      ? `⚠️ Alerte budgétaire critique (${consumptionInfo.consumptionPercentage.toFixed(0)}%)`
      : `📊 Alerte budgétaire préventive (${consumptionInfo.consumptionPercentage.toFixed(0)}%)`;

  const message = `Ligne "${consumptionInfo.budgetLineName}" du budget "${consumptionInfo.budgetName}": ${consumptionInfo.consumedAmount.toLocaleString()} XOF consommés sur ${consumptionInfo.forecastAmount.toLocaleString()} XOF prévus. Reste: ${consumptionInfo.remainingAmount.toLocaleString()} XOF`;

  for (const recipient of recipients) {
    try {
      await createNotification({
        userId: recipient.id,
        type: notificationType,
        severity: notificationSeverity,
        module: 'Budget',
        title,
        message,
        relatedEntityType: 'budget_line',
        relatedEntityId: consumptionInfo.budgetLineId,
        relatedEntityName: consumptionInfo.budgetLineName,
        directLink: `/budget/${consumptionInfo.budgetId}`,
        triggeredBy,
      });
    } catch (error) {
      console.error(`Failed to create notification for user ${recipient.id}:`, error);
    }
  }
}

/**
 * Send email alerts for budget thresholds
 */
async function sendBudgetEmailAlerts(
  threshold: BudgetAlertThreshold,
  consumptionInfo: BudgetConsumptionInfo,
  triggeredByName?: string
): Promise<void> {
  const alertTypeMap: Record<BudgetAlertLevel, string> = {
    preventive: 'budget_warning_80',
    critical: 'budget_warning_90',
    blocking: 'budget_overrun',
  };

  try {
    await sendAlertEmail({
      alertType: alertTypeMap[threshold.level],
      module: 'Budget',
      entityName: `${consumptionInfo.budgetLineName} (${consumptionInfo.budgetName})`,
      entityId: consumptionInfo.budgetLineId,
      expectedValue: `${consumptionInfo.forecastAmount.toLocaleString()} XOF (Budget prévu)`,
      actualValue: `${consumptionInfo.consumedAmount.toLocaleString()} XOF (${consumptionInfo.consumptionPercentage.toFixed(1)}% consommé)`,
      userName: triggeredByName,
      directLink: `/budget/${consumptionInfo.budgetId}`,
      severity: threshold.severity,
    });
  } catch (error) {
    console.error('Failed to send budget alert email:', error);
  }
}

/**
 * Check if an alert has already been sent for this budget line at this threshold level
 * to avoid duplicate alerts
 */
async function hasAlertBeenSent(
  budgetLineId: string,
  alertLevel: BudgetAlertLevel,
  withinHours: number = 24
): Promise<boolean> {
  try {
    const since = new Date();
    since.setHours(since.getHours() - withinHours);

    const { data } = await supabase
      .from('budget_alerts')
      .select('id')
      .eq('budget_line_id', budgetLineId)
      .eq('alert_type', `consumption_${alertLevel}`)
      .eq('is_resolved', false)
      .gte('created_at', since.toISOString())
      .limit(1);

    return (data?.length ?? 0) > 0;
  } catch (error) {
    console.error('Failed to check existing alerts:', error);
    return false;
  }
}

/**
 * Record the alert in budget_alerts table
 */
async function recordBudgetAlert(
  threshold: BudgetAlertThreshold,
  consumptionInfo: BudgetConsumptionInfo,
  budgetId: string
): Promise<void> {
  try {
    await supabase.from('budget_alerts').insert({
      budget_id: budgetId,
      budget_line_id: consumptionInfo.budgetLineId,
      alert_type: `consumption_${threshold.level}`,
      message: `${threshold.label}: ${consumptionInfo.consumptionPercentage.toFixed(1)}% du budget consommé (${consumptionInfo.consumedAmount.toLocaleString()} / ${consumptionInfo.forecastAmount.toLocaleString()} XOF)`,
      threshold_reached: consumptionInfo.consumptionPercentage,
      is_read: false,
      is_resolved: false,
    });
  } catch (error) {
    console.error('Failed to record budget alert:', error);
  }
}

/**
 * Main function to check and trigger budget alerts
 * Call this after any budget movement (expense creation, update, etc.)
 */
export async function checkAndTriggerBudgetAlerts(
  budgetLineId: string,
  triggeredBy?: string,
  triggeredByName?: string
): Promise<{ triggered: boolean; level: BudgetAlertLevel | null; isBlocking: boolean }> {
  try {
    // Fetch the budget line with its budget info
    const { data: budgetLine, error } = await supabase
      .from('budget_lines')
      .select(`
        id,
        description,
        forecast_amount,
        committed_amount,
        realized_amount,
        budget_id,
        budgets!inner(id, name, code)
      `)
      .eq('id', budgetLineId)
      .single();

    if (error || !budgetLine) {
      console.error('Failed to fetch budget line:', error);
      return { triggered: false, level: null, isBlocking: false };
    }

    const forecastAmount = budgetLine.forecast_amount || 0;
    const committedAmount = budgetLine.committed_amount || 0;
    const realizedAmount = budgetLine.realized_amount || 0;

    // Skip if no budget
    if (forecastAmount <= 0) {
      return { triggered: false, level: null, isBlocking: false };
    }

    const { consumedAmount, consumptionPercentage, remainingAmount } = calculateBudgetConsumption(
      forecastAmount,
      committedAmount,
      realizedAmount
    );

    const threshold = determineAlertLevel(consumptionPercentage);

    if (!threshold) {
      return { triggered: false, level: null, isBlocking: false };
    }

    // Check if alert was already sent recently
    const alreadySent = await hasAlertBeenSent(budgetLineId, threshold.level);
    if (alreadySent) {
      console.log(`Alert ${threshold.level} already sent for budget line ${budgetLineId}`);
      return { triggered: false, level: threshold.level, isBlocking: threshold.level === 'blocking' };
    }

    const budget = budgetLine.budgets as any;
    const consumptionInfo: BudgetConsumptionInfo = {
      budgetLineId,
      budgetLineName: budgetLine.description || `Ligne ${budgetLineId.slice(0, 8)}`,
      budgetId: budget.id,
      budgetName: budget.name || budget.code,
      forecastAmount,
      consumedAmount,
      consumptionPercentage,
      remainingAmount,
    };

    // Execute all alert actions in parallel
    await Promise.all([
      // 1. Log to audit
      logBudgetAlertToAudit(threshold.level, consumptionInfo, triggeredBy),
      // 2. Send internal notifications
      sendBudgetNotifications(threshold, consumptionInfo, triggeredBy),
      // 3. Send email alerts
      sendBudgetEmailAlerts(threshold, consumptionInfo, triggeredByName),
      // 4. Record in budget_alerts table
      recordBudgetAlert(threshold, consumptionInfo, budget.id),
    ]);

    console.log(`Budget alert ${threshold.level} triggered for line ${budgetLineId}`);

    return {
      triggered: true,
      level: threshold.level,
      isBlocking: threshold.level === 'blocking',
    };
  } catch (error) {
    console.error('Failed to check and trigger budget alerts:', error);
    return { triggered: false, level: null, isBlocking: false };
  }
}

/**
 * Check if budget line is blocked (100% consumed)
 */
export async function isBudgetLineBlocked(budgetLineId: string): Promise<boolean> {
  try {
    const { data: budgetLine } = await supabase
      .from('budget_lines')
      .select('forecast_amount, committed_amount, realized_amount')
      .eq('id', budgetLineId)
      .single();

    if (!budgetLine) return false;

    const forecastAmount = budgetLine.forecast_amount || 0;
    const committedAmount = budgetLine.committed_amount || 0;
    const realizedAmount = budgetLine.realized_amount || 0;

    if (forecastAmount <= 0) return true; // Non-budgeted = blocked

    const { consumptionPercentage } = calculateBudgetConsumption(
      forecastAmount,
      committedAmount,
      realizedAmount
    );

    return consumptionPercentage >= 100;
  } catch (error) {
    console.error('Failed to check if budget line is blocked:', error);
    return false;
  }
}

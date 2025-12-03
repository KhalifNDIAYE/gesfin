import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ModuleName, PermissionType } from '@/types/database';

interface BlockedActionParams {
  module: ModuleName;
  actionAttempted: PermissionType;
  resourceType?: string;
  resourceId?: string;
  blockSource: 'ui' | 'api' | 'url_forced';
  permissionsHeld?: string[];
  additionalContext?: Record<string, any>;
}

// Parse user agent to extract browser, OS, and device type
const parseUserAgent = (userAgent: string) => {
  let browser = 'Unknown';
  let operatingSystem = 'Unknown';
  let deviceType = 'desktop';

  // Browser detection
  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }

  // OS detection
  if (userAgent.includes('Windows')) {
    operatingSystem = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    operatingSystem = 'macOS';
  } else if (userAgent.includes('Linux')) {
    operatingSystem = 'Linux';
  } else if (userAgent.includes('Android')) {
    operatingSystem = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    operatingSystem = 'iOS';
  }

  // Device type detection
  if (userAgent.includes('Mobile') || userAgent.includes('iPhone')) {
    deviceType = 'mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceType = 'tablet';
  }

  return { browser, operatingSystem, deviceType };
};

export const useSecurityLogger = () => {
  const { user, profile, roles } = useAuth();

  const logBlockedAction = useCallback(async (params: BlockedActionParams) => {
    if (!user) return;

    try {
      const userAgent = navigator.userAgent;
      const { browser, operatingSystem, deviceType } = parseUserAgent(userAgent);
      
      // Get role names
      const roleNames = roles?.map(r => r.name) || [];

      // Call the database function to log the blocked action
      const { error } = await supabase.rpc('log_blocked_action', {
        _user_id: user.id,
        _user_email: user.email || '',
        _user_full_name: profile?.full_name || user.email || '',
        _user_roles: roleNames,
        _ip_address: '', // IP is captured server-side
        _user_agent: userAgent,
        _browser: browser,
        _operating_system: operatingSystem,
        _device_type: deviceType,
        _module: params.module,
        _action_attempted: params.actionAttempted,
        _resource_type: params.resourceType || null,
        _resource_id: params.resourceId || null,
        _permission_required: params.actionAttempted,
        _permissions_held: params.permissionsHeld || [],
        _block_source: params.blockSource,
        _request_url: window.location.href,
        _request_method: 'GET',
        _additional_context: params.additionalContext ? JSON.stringify(params.additionalContext) : null,
      });

      if (error) {
        console.error('Failed to log blocked action:', error);
      }
    } catch (err) {
      console.error('Error logging blocked action:', err);
    }
  }, [user, profile, roles]);

  return { logBlockedAction };
};

// Standalone function for logging without hook context
export const logBlockedActionDirect = async (
  userId: string,
  userEmail: string,
  userFullName: string,
  userRoles: string[],
  params: Omit<BlockedActionParams, 'permissionsHeld'> & { permissionsHeld: string[] }
) => {
  try {
    const userAgent = navigator.userAgent;
    const { browser, operatingSystem, deviceType } = parseUserAgent(userAgent);

    const { error } = await supabase.rpc('log_blocked_action', {
      _user_id: userId,
      _user_email: userEmail,
      _user_full_name: userFullName,
      _user_roles: userRoles,
      _ip_address: '',
      _user_agent: userAgent,
      _browser: browser,
      _operating_system: operatingSystem,
      _device_type: deviceType,
      _module: params.module,
      _action_attempted: params.actionAttempted,
      _resource_type: params.resourceType || null,
      _resource_id: params.resourceId || null,
      _permission_required: params.actionAttempted,
      _permissions_held: params.permissionsHeld,
      _block_source: params.blockSource,
      _request_url: window.location.href,
      _request_method: 'GET',
      _additional_context: params.additionalContext ? JSON.stringify(params.additionalContext) : null,
    });

    if (error) {
      console.error('Failed to log blocked action:', error);
    }
  } catch (err) {
    console.error('Error logging blocked action:', err);
  }
};

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Dynamic CORS origin - allow app domain in production, or localhost for development
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedPatterns = [
    /^https:\/\/.*\.lovable\.app$/,
    /^https:\/\/.*\.lovableproject\.com$/,
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
  ];
  
  if (requestOrigin && allowedPatterns.some(pattern => pattern.test(requestOrigin))) {
    return requestOrigin;
  }
  
  // Default to the Supabase project URL
  return Deno.env.get('SUPABASE_URL') || 'https://swdswiyxdopxwkiwrdva.supabase.co';
};

const getCorsHeaders = (requestOrigin: string | null) => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(requestOrigin),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Credentials": "true",
});

interface AlertEmailRequest {
  alertType: string;
  module: string;
  entityName: string;
  entityId?: string;
  expectedValue?: string;
  actualValue?: string;
  userName?: string;
  directLink?: string;
  severity: 'critical' | 'major' | 'warning';
}

const severityColors = {
  critical: { bg: '#DC2626', text: '#FFFFFF', label: 'CRITIQUE' },
  major: { bg: '#F97316', text: '#FFFFFF', label: 'MAJEUR' },
  warning: { bg: '#EAB308', text: '#000000', label: 'AVERTISSEMENT' },
};

const alertTypeLabels: Record<string, string> = {
  budget_overrun: 'Blocage budgétaire (100%)',
  budget_warning_80: 'Alerte préventive budget (80%)',
  budget_warning_90: 'Alerte critique budget (90%)',
  project_late: 'Projet en retard',
  convention_expired: 'Convention expirée',
  blocked_action_critical: 'Action bloquée critique',
  sensitive_deletion: 'Suppression sensible',
  sensitive_validation: 'Validation sensible',
};

function generateEmailHTML(data: AlertEmailRequest, orgName: string, logoUrl?: string): string {
  const colors = severityColors[data.severity];
  const alertLabel = alertTypeLabels[data.alertType] || data.alertType;
  const now = new Date().toLocaleString('fr-FR', { 
    timeZone: 'Africa/Dakar',
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background-color: #1e293b; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
      ${logoUrl ? `<img src="${logoUrl}" alt="${orgName}" style="max-height: 50px; margin-bottom: 12px;">` : ''}
      <h1 style="color: #ffffff; margin: 0; font-size: 20px;">${orgName}</h1>
    </div>
    
    <!-- Alert Badge -->
    <div style="background-color: ${colors.bg}; padding: 16px; text-align: center;">
      <span style="color: ${colors.text}; font-weight: bold; font-size: 14px; letter-spacing: 1px;">
        🚨 ALERTE ${colors.label}
      </span>
    </div>
    
    <!-- Content -->
    <div style="background-color: #ffffff; padding: 32px; border: 1px solid #e4e4e7; border-top: none;">
      <h2 style="color: #18181b; margin: 0 0 24px 0; font-size: 18px;">
        ${alertLabel}
      </h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px; background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7; font-weight: 600; width: 40%;">Module</td>
          <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e4e4e7;">${data.module}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7; font-weight: 600;">Élément concerné</td>
          <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e4e4e7;">${data.entityName}</td>
        </tr>
        ${data.expectedValue ? `
        <tr>
          <td style="padding: 12px; background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7; font-weight: 600;">Valeur attendue</td>
          <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e4e4e7;">${data.expectedValue}</td>
        </tr>
        ` : ''}
        ${data.actualValue ? `
        <tr>
          <td style="padding: 12px; background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7; font-weight: 600;">Valeur réelle</td>
          <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e4e4e7; color: ${colors.bg}; font-weight: bold;">${data.actualValue}</td>
        </tr>
        ` : ''}
        ${data.userName ? `
        <tr>
          <td style="padding: 12px; background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7; font-weight: 600;">Utilisateur</td>
          <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e4e4e7;">${data.userName}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px; background-color: #f4f4f5; font-weight: 600;">Date et heure</td>
          <td style="padding: 12px; background-color: #ffffff;">${now}</td>
        </tr>
      </table>
      
      ${data.directLink ? `
      <div style="text-align: center; margin-top: 24px;">
        <a href="${data.directLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Voir le détail →
        </a>
      </div>
      ` : ''}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f4f4f5; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e4e4e7; border-top: none;">
      <p style="color: #71717a; margin: 0; font-size: 12px;">
        Cet email a été envoyé automatiquement par le système de gestion.
      </p>
      <p style="color: #a1a1aa; margin: 8px 0 0 0; font-size: 11px;">
        © ${new Date().getFullYear()} ${orgName}. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const alertData: AlertEmailRequest = await req.json();
    console.log("Received alert request:", alertData);

    // Get email notification settings
    const { data: settings } = await supabase
      .from("email_notification_settings")
      .select("*")
      .single();

    if (!settings?.is_enabled) {
      console.log("Email notifications are disabled");
      return new Response(
        JSON.stringify({ message: "Email notifications are disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get organization settings
    const { data: orgSettings } = await supabase
      .from("organization_settings")
      .select("name, logo_url")
      .single();

    const orgName = orgSettings?.name || "Système de Gestion";
    const logoUrl = orgSettings?.logo_url || settings.organization_logo_url;

    // Get alert type configuration
    const { data: alertType } = await supabase
      .from("email_alert_types")
      .select("*, email_alert_recipients(role_id)")
      .eq("alert_type", alertData.alertType)
      .single();

    if (!alertType?.is_enabled) {
      console.log(`Alert type ${alertData.alertType} is disabled`);
      return new Response(
        JSON.stringify({ message: "This alert type is disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recipients based on configured roles
    const roleIds = alertType.email_alert_recipients?.map((r: any) => r.role_id) || [];
    
    let recipients: { email: string; full_name: string }[] = [];
    
    if (roleIds.length > 0) {
      const { data: users } = await supabase
        .from("user_roles")
        .select("user_id, profiles!inner(email, full_name)")
        .in("role_id", roleIds);
      
      if (users) {
        recipients = users.map((u: any) => ({
          email: u.profiles.email,
          full_name: u.profiles.full_name,
        }));
      }
    }

    // Always include admins
    const { data: adminUsers } = await supabase
      .from("user_roles")
      .select("user_id, profiles!inner(email, full_name), roles!inner(name)")
      .eq("roles.name", "admin");

    if (adminUsers) {
      const adminEmails = adminUsers.map((u: any) => ({
        email: u.profiles.email,
        full_name: u.profiles.full_name,
      }));
      recipients = [...recipients, ...adminEmails];
    }

    // Remove duplicates
    const uniqueRecipients = recipients.filter(
      (r, i, arr) => arr.findIndex((x) => x.email === r.email) === i
    );

    if (uniqueRecipients.length === 0) {
      console.log("No recipients configured for this alert type");
      return new Response(
        JSON.stringify({ message: "No recipients configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHTML = generateEmailHTML(alertData, orgName, logoUrl);
    const subject = `🚨 ${severityColors[alertData.severity].label}: ${alertTypeLabels[alertData.alertType] || alertData.alertType} - ${alertData.entityName}`;

    // Send emails
    const results = [];
    for (const recipient of uniqueRecipients) {
      try {
        const emailResponse = await resend.emails.send({
          from: settings.from_email ? `${settings.from_name || orgName} <${settings.from_email}>` : `${orgName} <onboarding@resend.dev>`,
          to: [recipient.email],
          subject,
          html: emailHTML,
        });

        // Log the email
        await supabase.from("email_logs").insert({
          alert_type: alertData.alertType,
          recipient_email: recipient.email,
          recipient_name: recipient.full_name,
          subject,
          body_preview: `${alertTypeLabels[alertData.alertType]} - ${alertData.entityName}`,
          status: "sent",
          related_module: alertData.module,
          related_entity_id: alertData.entityId,
          related_entity_name: alertData.entityName,
          sent_at: new Date().toISOString(),
        });

        results.push({ email: recipient.email, status: "sent", id: (emailResponse as any).id || 'sent' });
        console.log(`Email sent to ${recipient.email}`);
      } catch (error: any) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        
        // Log the failure
        await supabase.from("email_logs").insert({
          alert_type: alertData.alertType,
          recipient_email: recipient.email,
          recipient_name: recipient.full_name,
          subject,
          body_preview: `${alertTypeLabels[alertData.alertType]} - ${alertData.entityName}`,
          status: "failed",
          error_message: error.message,
          related_module: alertData.module,
          related_entity_id: alertData.entityId,
          related_entity_name: alertData.entityName,
        });

        results.push({ email: recipient.email, status: "failed", error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ message: "Emails processed", results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    const origin = req.headers.get("Origin");
    const corsHeaders = getCorsHeaders(origin);
    console.error("Error in send-alert-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

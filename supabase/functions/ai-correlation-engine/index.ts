import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CorrelationRequest {
  action: 'analyze_events' | 'detect_anomalies' | 'calculate_risk' | 'update_baseline';
  userId?: string;
  timeWindowHours?: number;
  eventIds?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { action, userId, timeWindowHours = 24, eventIds } = await req.json() as CorrelationRequest;

    // Check if AI is enabled
    const { data: aiSettings } = await supabase
      .from('ai_engine_settings')
      .select('setting_value')
      .eq('setting_key', 'ai_enabled')
      .single();

    if (aiSettings?.setting_value !== true && aiSettings?.setting_value !== 'true') {
      return new Response(
        JSON.stringify({ error: "AI engine is disabled", code: "AI_DISABLED" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    const startTime = Date.now();

    switch (action) {
      case 'analyze_events':
        result = await analyzeEvents(supabase, LOVABLE_API_KEY, userId, timeWindowHours);
        break;
      case 'detect_anomalies':
        result = await detectAnomalies(supabase, LOVABLE_API_KEY, userId, timeWindowHours);
        break;
      case 'calculate_risk':
        result = await calculateRiskScore(supabase, LOVABLE_API_KEY, userId!);
        break;
      case 'update_baseline':
        result = await updateBaseline(supabase, userId!);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const processingTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({ ...result, processingTimeMs: processingTime }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("AI correlation engine error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function analyzeEvents(supabase: any, apiKey: string, userId: string | undefined, timeWindowHours: number) {
  // Fetch recent events from multiple sources
  const timeThreshold = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString();

  // Fetch audit logs
  let auditQuery = supabase
    .from('audit_logs')
    .select('*')
    .gte('created_at', timeThreshold)
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (userId) {
    auditQuery = auditQuery.eq('user_id', userId);
  }
  const { data: auditLogs } = await auditQuery;

  // Fetch blocked actions
  let blockedQuery = supabase
    .from('security_blocked_actions')
    .select('*')
    .gte('blocked_at', timeThreshold)
    .order('blocked_at', { ascending: false })
    .limit(50);
  
  if (userId) {
    blockedQuery = blockedQuery.eq('user_id', userId);
  }
  const { data: blockedActions } = await blockedQuery;

  // Fetch security alerts
  let alertsQuery = supabase
    .from('security_alert_events')
    .select('*')
    .gte('created_at', timeThreshold)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (userId) {
    alertsQuery = alertsQuery.eq('user_id', userId);
  }
  const { data: securityAlerts } = await alertsQuery;

  // Fetch correlation patterns
  const { data: patterns } = await supabase
    .from('ai_correlation_patterns')
    .select('*')
    .eq('is_enabled', true);

  // Prepare events for AI analysis
  const events = [
    ...(auditLogs || []).map((e: any) => ({
      type: 'audit',
      action: e.action,
      module: e.module,
      userId: e.user_id,
      email: e.user_email,
      timestamp: e.created_at,
      ipAddress: e.ip_address,
      data: { resource_type: e.resource_type, resource_id: e.resource_id }
    })),
    ...(blockedActions || []).map((e: any) => ({
      type: 'blocked',
      action: e.action_attempted,
      module: e.module,
      userId: e.user_id,
      email: e.user_email,
      timestamp: e.blocked_at,
      ipAddress: e.ip_address,
      data: { severity: e.severity, permission_required: e.permission_required }
    })),
    ...(securityAlerts || []).map((e: any) => ({
      type: 'alert',
      action: e.event_type,
      category: e.category,
      userId: e.user_id,
      email: e.user_email,
      timestamp: e.created_at,
      ipAddress: e.ip_address,
      data: { severity: e.severity, risk_score: e.risk_score }
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (events.length === 0) {
    return { correlations: [], message: "No events to analyze" };
  }

  // AI Analysis prompt
  const systemPrompt = `Tu es un moteur d'analyse de sécurité IA expert. Tu dois analyser les événements de sécurité et détecter des patterns suspects.

PATTERNS DE CORRÉLATION À DÉTECTER:
${patterns?.map((p: any) => `- ${p.code}: ${p.name} - ${p.description} (Type: ${p.correlation_type}, Seuil: ${p.min_events_threshold} événements en ${p.time_window_minutes} min)`).join('\n')}

RÈGLES D'ANALYSE:
1. Identifier les séquences d'événements suspects
2. Détecter les anomalies comportementales
3. Calculer un score de risque pour chaque corrélation (0-100)
4. Fournir une explication claire et détaillée
5. Lier les événements sources à chaque corrélation

CONFORMITÉ: SOC 2, ISO 27001, RGPD, HIPAA
- Toutes les décisions doivent être explicables
- Éviter les faux positifs en contextualisant`;

  const userPrompt = `Analyse ces ${events.length} événements de sécurité des dernières ${timeWindowHours} heures:

${JSON.stringify(events.slice(0, 50), null, 2)}

Identifie les corrélations suspectes et retourne une analyse structurée.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [{
        type: "function",
        function: {
          name: "report_correlations",
          description: "Rapporter les corrélations d'événements détectées",
          parameters: {
            type: "object",
            properties: {
              correlations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    pattern_code: { type: "string", description: "Code du pattern détecté" },
                    title: { type: "string", description: "Titre de la corrélation" },
                    description: { type: "string", description: "Description de la menace" },
                    correlation_type: { type: "string", enum: ["temporal", "behavioral", "contextual", "data_sensitive"] },
                    risk_score: { type: "number", minimum: 0, maximum: 100 },
                    risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    reasoning: { type: "string", description: "Explication détaillée de la détection" },
                    risk_factors: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          factor: { type: "string" },
                          weight: { type: "number" },
                          explanation: { type: "string" }
                        }
                      }
                    },
                    event_indices: { type: "array", items: { type: "number" }, description: "Indices des événements corrélés" },
                    recommended_actions: { type: "array", items: { type: "string" } },
                    affected_user_id: { type: "string" },
                    affected_user_email: { type: "string" }
                  },
                  required: ["pattern_code", "title", "description", "correlation_type", "risk_score", "risk_level", "confidence", "reasoning", "event_indices"]
                }
              },
              summary: {
                type: "object",
                properties: {
                  total_events_analyzed: { type: "number" },
                  correlations_found: { type: "number" },
                  highest_risk_level: { type: "string" },
                  overall_threat_assessment: { type: "string" }
                }
              }
            },
            required: ["correlations", "summary"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "report_correlations" } }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API error:", response.status, errorText);
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const aiResult = await response.json();
  const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall) {
    return { correlations: [], message: "No correlations detected" };
  }

  const analysis = JSON.parse(toolCall.function.arguments);
  
  // Save correlations to database
  for (const correlation of analysis.correlations) {
    const correlatedEvents = correlation.event_indices.map((idx: number) => events[idx]).filter(Boolean);
    
    const { data: alert, error } = await supabase
      .from('ai_correlated_alerts')
      .insert({
        alert_code: correlation.pattern_code,
        title: correlation.title,
        description: correlation.description,
        correlation_type: correlation.correlation_type,
        user_id: correlation.affected_user_id || null,
        user_email: correlation.affected_user_email || null,
        risk_score: correlation.risk_score,
        risk_level: correlation.risk_level,
        severity: correlation.risk_level === 'critical' ? 'critical' : correlation.risk_level === 'high' ? 'error' : 'warning',
        correlated_events: correlatedEvents,
        event_count: correlatedEvents.length,
        ai_reasoning: correlation.reasoning,
        risk_factors: correlation.risk_factors || [],
        detection_confidence: correlation.confidence,
        first_event_at: correlatedEvents[correlatedEvents.length - 1]?.timestamp,
        last_event_at: correlatedEvents[0]?.timestamp
      })
      .select()
      .single();

    if (alert) {
      // Log AI decision
      await supabase.from('ai_decisions_audit').insert({
        decision_type: 'alert_created',
        related_alert_id: alert.id,
        related_user_id: correlation.affected_user_id || null,
        input_data: { events_count: correlatedEvents.length, pattern: correlation.pattern_code },
        ai_model: 'google/gemini-2.5-flash',
        ai_response: correlation,
        confidence_score: correlation.confidence,
        decision_made: `Created alert: ${correlation.title}`,
        decision_reasoning: correlation.reasoning,
        is_explainable: true,
        compliance_tags: ['SOC2', 'ISO27001', 'RGPD']
      });

      // Save individual correlation events
      for (let i = 0; i < correlatedEvents.length; i++) {
        const evt = correlatedEvents[i];
        await supabase.from('ai_correlation_events').insert({
          correlated_alert_id: alert.id,
          event_type: evt.action,
          event_source: evt.type === 'audit' ? 'audit_logs' : evt.type === 'blocked' ? 'security_blocked_actions' : 'security_alert_events',
          event_timestamp: evt.timestamp,
          event_data: evt.data,
          user_id: evt.userId,
          ip_address: evt.ipAddress,
          sequence_order: i
        });
      }
    }
  }

  return {
    correlations: analysis.correlations,
    summary: analysis.summary,
    eventsAnalyzed: events.length
  };
}

async function detectAnomalies(supabase: any, apiKey: string, userId: string | undefined, timeWindowHours: number) {
  // Get user baselines
  let baselineQuery = supabase
    .from('user_behavioral_baselines')
    .select('*');
  
  if (userId) {
    baselineQuery = baselineQuery.eq('user_id', userId);
  }
  
  const { data: baselines } = await baselineQuery;
  
  // Get recent activity
  const timeThreshold = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString();
  
  let activityQuery = supabase
    .from('audit_logs')
    .select('*')
    .gte('created_at', timeThreshold);
  
  if (userId) {
    activityQuery = activityQuery.eq('user_id', userId);
  }
  
  const { data: recentActivity } = await activityQuery;

  if (!recentActivity || recentActivity.length === 0) {
    return { anomalies: [], message: "No recent activity to analyze" };
  }

  const systemPrompt = `Tu es un système de détection d'anomalies comportementales. Analyse l'activité des utilisateurs par rapport à leurs baselines pour identifier des comportements anormaux.

TYPES D'ANOMALIES À DÉTECTER:
1. Connexions hors horaires habituels
2. Accès depuis nouvelles localisations
3. Volume d'activité inhabituel
4. Actions atypiques pour le rôle
5. Patterns de navigation suspects

Sois précis et évite les faux positifs.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Baselines utilisateurs:\n${JSON.stringify(baselines || [], null, 2)}\n\nActivité récente:\n${JSON.stringify(recentActivity.slice(0, 50), null, 2)}`
        }
      ],
      tools: [{
        type: "function",
        function: {
          name: "report_anomalies",
          description: "Rapporter les anomalies comportementales détectées",
          parameters: {
            type: "object",
            properties: {
              anomalies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    user_id: { type: "string" },
                    anomaly_type: { type: "string" },
                    description: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    deviation_score: { type: "number" },
                    baseline_comparison: { type: "string" },
                    recommended_action: { type: "string" }
                  },
                  required: ["anomaly_type", "description", "severity", "deviation_score"]
                }
              }
            },
            required: ["anomalies"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "report_anomalies" } }
    }),
  });

  if (!response.ok) {
    throw new Error(`Anomaly detection failed: ${response.status}`);
  }

  const aiResult = await response.json();
  const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall) {
    return { anomalies: [], message: "No anomalies detected" };
  }

  const result = JSON.parse(toolCall.function.arguments);
  
  // Log AI decision for each anomaly
  for (const anomaly of result.anomalies) {
    await supabase.from('ai_decisions_audit').insert({
      decision_type: 'pattern_detected',
      related_user_id: anomaly.user_id || null,
      input_data: { activity_count: recentActivity.length },
      ai_model: 'google/gemini-2.5-flash',
      ai_response: anomaly,
      confidence_score: Math.min(anomaly.deviation_score / 100, 1),
      decision_made: `Anomaly detected: ${anomaly.anomaly_type}`,
      decision_reasoning: anomaly.description,
      is_explainable: true,
      compliance_tags: ['SOC2', 'ISO27001']
    });
  }

  return result;
}

async function calculateRiskScore(supabase: any, apiKey: string, userId: string) {
  // Use database function to calculate base score
  const { data: scoreResult } = await supabase.rpc('calculate_user_risk_score', { p_user_id: userId });
  
  // Get additional context for AI enhancement
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*, user_roles(role_id, roles(name))')
    .eq('id', userId)
    .single();

  const { data: recentAlerts } = await supabase
    .from('ai_correlated_alerts')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  // AI-enhanced risk assessment
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { 
          role: "system", 
          content: `Tu es un expert en évaluation des risques de sécurité. Analyse le profil de risque d'un utilisateur et fournis une évaluation détaillée.` 
        },
        { 
          role: "user", 
          content: `Score de base: ${JSON.stringify(scoreResult)}\nProfil: ${JSON.stringify(userProfile)}\nAlertes récentes: ${JSON.stringify(recentAlerts || [])}\n\nFournis une évaluation de risque améliorée.`
        }
      ],
      tools: [{
        type: "function",
        function: {
          name: "risk_assessment",
          description: "Évaluation détaillée du risque utilisateur",
          parameters: {
            type: "object",
            properties: {
              adjusted_score: { type: "number", minimum: 0, maximum: 100 },
              risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
              key_risk_factors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    factor: { type: "string" },
                    impact: { type: "string", enum: ["low", "medium", "high"] },
                    description: { type: "string" }
                  }
                }
              },
              recommended_actions: { type: "array", items: { type: "string" } },
              assessment_summary: { type: "string" }
            },
            required: ["adjusted_score", "risk_level", "key_risk_factors", "assessment_summary"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "risk_assessment" } }
    }),
  });

  if (!response.ok) {
    return scoreResult;
  }

  const aiResult = await response.json();
  const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall) {
    return scoreResult;
  }

  const assessment = JSON.parse(toolCall.function.arguments);

  // Update risk score with AI enhancement
  await supabase
    .from('user_risk_scores')
    .update({
      current_score: assessment.adjusted_score,
      risk_level: assessment.risk_level,
      score_factors: assessment.key_risk_factors,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .is('session_id', null);

  // Log AI decision
  await supabase.from('ai_decisions_audit').insert({
    decision_type: 'risk_score_updated',
    related_user_id: userId,
    input_data: { base_score: scoreResult },
    ai_model: 'google/gemini-2.5-flash',
    ai_response: assessment,
    confidence_score: 0.8,
    decision_made: `Risk score updated to ${assessment.adjusted_score} (${assessment.risk_level})`,
    decision_reasoning: assessment.assessment_summary,
    is_explainable: true,
    compliance_tags: ['SOC2', 'ISO27001', 'RGPD']
  });

  return {
    ...scoreResult,
    ai_assessment: assessment
  };
}

async function updateBaseline(supabase: any, userId: string) {
  // Fetch user's historical activity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: activity } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true });

  if (!activity || activity.length === 0) {
    return { success: false, message: "Not enough activity to build baseline" };
  }

  // Calculate login times baseline
  const loginTimes = activity
    .filter((a: any) => a.action === 'login' || a.action === 'auth_success')
    .map((a: any) => new Date(a.created_at).getHours());

  const avgLoginHour = loginTimes.length > 0 
    ? loginTimes.reduce((a: number, b: number) => a + b, 0) / loginTimes.length 
    : 9;

  // Calculate action frequency baseline
  const actionCounts: Record<string, number> = {};
  activity.forEach((a: any) => {
    actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
  });

  // Calculate IP addresses baseline
  const ipAddresses = [...new Set(activity.map((a: any) => a.ip_address).filter(Boolean))];

  // Upsert baselines
  const baselines = [
    { type: 'login_times', data: { average_hour: avgLoginHour, hours: loginTimes.slice(-100) } },
    { type: 'action_frequency', data: actionCounts },
    { type: 'ip_addresses', data: { known_ips: ipAddresses } },
    { type: 'activity_volume', data: { daily_average: activity.length / 30, total: activity.length } }
  ];

  for (const baseline of baselines) {
    await supabase
      .from('user_behavioral_baselines')
      .upsert({
        user_id: userId,
        baseline_type: baseline.type,
        baseline_data: baseline.data,
        sample_count: activity.length,
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id,baseline_type' });
  }

  // Log decision
  await supabase.from('ai_decisions_audit').insert({
    decision_type: 'baseline_updated',
    related_user_id: userId,
    input_data: { activity_count: activity.length, period_days: 30 },
    decision_made: `Updated ${baselines.length} behavioral baselines`,
    decision_reasoning: `Analyzed ${activity.length} events over 30 days to establish behavioral baseline`,
    is_explainable: true,
    compliance_tags: ['SOC2', 'RGPD']
  });

  return { 
    success: true, 
    baselinesUpdated: baselines.length,
    activityAnalyzed: activity.length 
  };
}

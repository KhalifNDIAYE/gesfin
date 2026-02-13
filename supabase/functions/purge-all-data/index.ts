import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedPatterns = [
    /^https:\/\/.*\.lovable\.app$/,
    /^https:\/\/.*\.lovableproject\.com$/,
    /^http:\/\/localhost:\d+$/,
  ];
  if (requestOrigin && allowedPatterns.some(pattern => pattern.test(requestOrigin))) {
    return requestOrigin;
  }
  return Deno.env.get('SUPABASE_URL') || 'https://swdswiyxdopxwkiwrdva.supabase.co';
};

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(origin),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

interface PurgeRequest {
  password: string;
  includeLogs?: boolean;
  loadGoldenDataset?: boolean;
}

interface PurgeResult {
  success: boolean;
  message: string;
  deletedCounts?: Record<string, number>;
  error?: string;
}

async function countAndDelete(supabaseAdmin: any, table: string): Promise<number> {
  // First count
  const { count } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });
  
  // Then delete
  await supabaseAdmin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  
  return count || 0;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Session invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin role
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select(`
        role_id,
        roles (name, is_system)
      `)
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur lors de la vérification des rôles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdmin = userRoles?.some((ur: any) => 
      ur.roles?.name?.toLowerCase() === "admin" || 
      ur.roles?.name?.toLowerCase() === "administrateur" ||
      ur.roles?.is_system === true
    );

    if (!isAdmin) {
      // Log the attempt
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "PURGE_ATTEMPT_DENIED",
        module: "administration",
        resource_type: "system",
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        new_values: { reason: "Non-admin attempted purge" }
      });

      return new Response(
        JSON.stringify({ success: false, error: "Accès refusé: droits administrateur requis" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: PurgeRequest = await req.json();
    const { password, includeLogs = false, loadGoldenDataset = false } = body;

    if (!password) {
      return new Response(
        JSON.stringify({ success: false, error: "Mot de passe requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Re-authenticate with password
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      // Log failed re-auth attempt
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "PURGE_REAUTH_FAILED",
        module: "administration",
        resource_type: "system",
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        new_values: { reason: "Password verification failed" }
      });

      return new Response(
        JSON.stringify({ success: false, error: "Mot de passe incorrect" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin ${user.email} initiating full data purge...`);

    // Track deleted counts
    const deletedCounts: Record<string, number> = {};

    // ============================================
    // PURGE ORDER (respecting foreign key constraints)
    // Delete child tables before parent tables
    // ============================================

    // 1. Delete documents first (and storage files)
    const storagePaths = ["conventions", "projets", "marches", "budgets", "documents"];
    for (const path of storagePaths) {
      try {
        const { data: files } = await supabaseAdmin.storage.from(path).list();
        if (files && files.length > 0) {
          const filePaths = files.map((f: any) => f.name);
          await supabaseAdmin.storage.from(path).remove(filePaths);
          deletedCounts[`storage_${path}`] = files.length;
        }
      } catch (e) {
        console.log(`Storage bucket ${path} may not exist, skipping...`);
      }
    }

    // 2. Delete documents table
    deletedCounts["documents"] = await countAndDelete(supabaseAdmin, "documents");

    // 3. Delete notifications
    deletedCounts["notifications"] = await countAndDelete(supabaseAdmin, "notifications");

    // 4. Delete budget alerts
    deletedCounts["budget_alerts"] = await countAndDelete(supabaseAdmin, "budget_alerts");

    // 5. Delete document signatures
    deletedCounts["document_signatures"] = await countAndDelete(supabaseAdmin, "document_signatures");

    // 6. Delete cash operations
    deletedCounts["cash_operations"] = await countAndDelete(supabaseAdmin, "cash_operations");

    // 7. Delete analytical allocations
    deletedCounts["analytical_allocations"] = await countAndDelete(supabaseAdmin, "analytical_allocations");

    // 8. Delete journal entry lines
    deletedCounts["journal_entry_lines"] = await countAndDelete(supabaseAdmin, "journal_entry_lines");

    // 9. Delete journal entries
    deletedCounts["journal_entries"] = await countAndDelete(supabaseAdmin, "journal_entries");

    // 10. Delete asset-related tables
    await supabaseAdmin.from("asset_depreciations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("asset_disposals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("asset_movements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("asset_reconciliations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    deletedCounts["assets"] = await countAndDelete(supabaseAdmin, "assets");

    // 11. Delete contract-related tables
    await supabaseAdmin.from("contract_guarantees").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("contract_decomptes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("contract_payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("contract_engagements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    deletedCounts["contracts"] = await countAndDelete(supabaseAdmin, "contracts");

    // 12. Delete expense-related tables
    await supabaseAdmin.from("expense_validations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    deletedCounts["expenses"] = await countAndDelete(supabaseAdmin, "expenses");

    // 13. Delete disbursement-related tables
    await supabaseAdmin.from("disbursement_validations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    deletedCounts["disbursements"] = await countAndDelete(supabaseAdmin, "disbursements");

    // 14. Delete budget-related tables
    await supabaseAdmin.from("budget_validations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("budget_transfers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    deletedCounts["budget_lines"] = await countAndDelete(supabaseAdmin, "budget_lines");
    deletedCounts["budgets"] = await countAndDelete(supabaseAdmin, "budgets");

    // 15. Delete convention-related tables
    await supabaseAdmin.from("convention_replenishments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("convention_direct_payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("financial_report_lines").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("financial_reports").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("project_conventions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    deletedCounts["conventions"] = await countAndDelete(supabaseAdmin, "conventions");

    // 16. Delete project-related tables
    await supabaseAdmin.from("project_bailleurs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    deletedCounts["projects"] = await countAndDelete(supabaseAdmin, "projects");

    // 17. Delete bailleurs
    deletedCounts["bailleurs"] = await countAndDelete(supabaseAdmin, "bailleurs");

    // 18. Delete third parties
    deletedCounts["third_parties"] = await countAndDelete(supabaseAdmin, "third_parties");

    // 19. Delete cost centers
    await supabaseAdmin.from("cost_centers").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 20. Optionally delete logs
    if (includeLogs) {
      deletedCounts["audit_logs"] = await countAndDelete(supabaseAdmin, "audit_logs");

      // Delete security-related logs
      await supabaseAdmin.from("ai_correlated_alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("ai_correlation_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("ai_decisions_audit").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }

    // Calculate total deleted
    const totalDeleted = Object.values(deletedCounts).reduce((a, b) => a + b, 0);

    // Log the successful purge
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action: "PURGE_ALL_DATA_SUCCESS",
      module: "administration",
      resource_type: "system",
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      new_values: {
        deleted_counts: deletedCounts,
        total_deleted: totalDeleted,
        include_logs: includeLogs,
        load_golden_dataset: loadGoldenDataset
      }
    });

    // Create a notification for the admin
    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      type: "system",
      severity: "high",
      module: "administration",
      title: "Purge système effectuée",
      message: `L'application a été réinitialisée avec succès. ${totalDeleted} enregistrements supprimés.`,
      status: "active",
      related_entity_type: "system",
      related_entity_name: "Purge complète"
    });

    console.log(`Purge completed by ${user.email}. Total records deleted: ${totalDeleted}`);

    const result: PurgeResult = {
      success: true,
      message: `Purge effectuée avec succès. ${totalDeleted} enregistrements supprimés.`,
      deletedCounts
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Purge error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur inconnue lors de la purge" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

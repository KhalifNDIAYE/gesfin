import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  'Access-Control-Allow-Origin': getAllowedOrigin(requestOrigin),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
});

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  department?: string;
  roleIds?: string[];
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token to verify they're admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !currentUser) {
      console.error('Failed to get current user:', userError);
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using RPC
    const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin', {
      _user_id: currentUser.id
    });

    if (adminError || !isAdmin) {
      console.error('User is not admin:', adminError);
      return new Response(
        JSON.stringify({ error: 'Accès refusé. Droits administrateur requis.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { email, password, fullName, department, roleIds } = body;

    // Validate input
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, mot de passe et nom complet sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit contenir au moins 8 caractères' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create the new user
    console.log('Creating user:', email);
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (createError) {
      console.error('Failed to create user:', createError);
      if (createError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'Cet email est déjà utilisé' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création de l\'utilisateur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser.user) {
      console.error('User creation returned no user');
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création de l\'utilisateur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created:', newUser.user.id);

    // Update profile with department if provided
    if (department) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ department })
        .eq('id', newUser.user.id);

      if (profileError) {
        console.error('Failed to update profile:', profileError);
      }
    }

    // Assign roles if provided
    if (roleIds && roleIds.length > 0) {
      console.log('Assigning roles:', roleIds);
      const roleAssignments = roleIds.map(roleId => ({
        user_id: newUser.user!.id,
        role_id: roleId,
        assigned_by: currentUser.id
      }));

      const { error: rolesError } = await adminClient
        .from('user_roles')
        .insert(roleAssignments);

      if (rolesError) {
        console.error('Failed to assign roles:', rolesError);
      }
    }

    // Log the action
    await adminClient.rpc('log_audit_event', {
      _action: 'Création utilisateur',
      _module: 'utilisateurs',
      _resource_type: 'user',
      _resource_id: newUser.user.id,
      _new_values: JSON.stringify({ email, fullName, department, roleIds })
    });

    console.log('User creation completed successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user.id, 
          email: newUser.user.email 
        } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const origin = req.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur inattendue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header to verify the requester (optional for initial setup)
    const authHeader = req.headers.get('Authorization')
    
    // Check if there are any super_admin users already
    const { data: existingSuperAdmins, error: checkError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('permission', 'super_admin')
      .limit(1)

    const hasSuperAdmin = existingSuperAdmins && existingSuperAdmins.length > 0

    // If super_admin exists, require authorization
    if (hasSuperAdmin) {
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization header' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify the requester is an admin or super_admin
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      )

      const { data: { user: requester }, error: userError } = await supabaseClient.auth.getUser()
      if (userError || !requester) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if requester is admin or super_admin
      const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: requester.id })
      const { data: isSuperAdmin } = await supabaseAdmin.rpc('is_super_admin', { _user_id: requester.id })
      
      if (!isAdmin && !isSuperAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const { email, password, username } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating super admin user: ${email}`)

    // Create the user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: username || email
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User created with ID: ${newUser.user.id}`)

    // Remove the company_id from the profile (super_admin should not be linked to any company)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ company_id: null })
      .eq('user_id', newUser.user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    // Add super_admin permission
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUser.user.id, permission: 'super_admin' })

    if (roleError) {
      console.error('Error adding super_admin role:', roleError)
      return new Response(
        JSON.stringify({ error: 'User created but failed to add super_admin role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete the auto-created company (created by trigger)
    // First get the company that was auto-created
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_id')
      .eq('user_id', newUser.user.id)
      .single()

    // The company was already unlinked, but it may still exist
    // We'll leave it for now as deleting it might cause issues

    console.log(`Super admin created successfully: ${email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user.id, 
          email: newUser.user.email 
        } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

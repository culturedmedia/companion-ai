// Supabase Edge Function: Delete User Account
// Deploy with: supabase functions deploy delete-account

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { password } = await req.json()

    // Verify password by attempting to sign in
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: user.email!,
      password,
    })

    if (signInError) {
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client to delete user from auth.users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Delete all user data (cascade should handle most, but be explicit)
    const userId = user.id

    // Delete in order due to foreign key constraints
    await supabaseAdmin.from('coin_transactions').delete().eq('user_id', userId)
    await supabaseAdmin.from('user_achievements').delete().eq('user_id', userId)
    await supabaseAdmin.from('subtasks').delete().in('task_id', 
      supabaseAdmin.from('tasks').select('id').eq('user_id', userId)
    )
    await supabaseAdmin.from('tasks').delete().eq('user_id', userId)
    await supabaseAdmin.from('inventory').delete().eq('user_id', userId)
    await supabaseAdmin.from('purchases').delete().eq('user_id', userId)
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId)
    await supabaseAdmin.from('unlocked_features').delete().eq('user_id', userId)
    await supabaseAdmin.from('feedback').delete().eq('user_id', userId)
    await supabaseAdmin.from('streaks').delete().eq('user_id', userId)
    await supabaseAdmin.from('wallets').delete().eq('user_id', userId)
    await supabaseAdmin.from('companions').delete().eq('user_id', userId)
    await supabaseAdmin.from('sessions').delete().eq('user_id', userId)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // Finally, delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log deletion for compliance
    console.log(`Account deleted: ${userId} at ${new Date().toISOString()}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Account and all data permanently deleted',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete account error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

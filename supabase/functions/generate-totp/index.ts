// Supabase Edge Function: Generate TOTP Secret
// Deploy with: supabase functions deploy generate-totp

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as OTPAuth from 'https://esm.sh/otpauth@9.2.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateTOTPRequest {
  action: 'generate' | 'verify' | 'enable' | 'disable'
  code?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const { action, code }: GenerateTOTPRequest = await req.json()

    // Get user's 2FA settings
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('totp_secret, totp_enabled')
      .eq('id', user.id)
      .single()

    switch (action) {
      case 'generate': {
        // Generate new TOTP secret
        const totp = new OTPAuth.TOTP({
          issuer: 'CompanionAI',
          label: user.email || 'User',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: new OTPAuth.Secret({ size: 20 }),
        })

        const secret = totp.secret.base32
        const uri = totp.toString()

        // Store secret temporarily (not enabled yet)
        await supabaseClient
          .from('profiles')
          .update({ totp_secret: secret, totp_enabled: false })
          .eq('id', user.id)

        return new Response(
          JSON.stringify({ 
            secret,
            uri,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'verify': {
        if (!code || !profile?.totp_secret) {
          return new Response(
            JSON.stringify({ error: 'Missing code or secret' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const totp = new OTPAuth.TOTP({
          issuer: 'CompanionAI',
          label: user.email || 'User',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(profile.totp_secret),
        })

        const delta = totp.validate({ token: code, window: 1 })
        const isValid = delta !== null

        return new Response(
          JSON.stringify({ valid: isValid }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'enable': {
        if (!code || !profile?.totp_secret) {
          return new Response(
            JSON.stringify({ error: 'Missing code or secret' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify code first
        const totp = new OTPAuth.TOTP({
          issuer: 'CompanionAI',
          label: user.email || 'User',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(profile.totp_secret),
        })

        const delta = totp.validate({ token: code, window: 1 })
        if (delta === null) {
          return new Response(
            JSON.stringify({ error: 'Invalid code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () => 
          crypto.randomUUID().split('-')[0].toUpperCase()
        )

        // Enable 2FA
        await supabaseClient
          .from('profiles')
          .update({ 
            totp_enabled: true,
            backup_codes: backupCodes,
          })
          .eq('id', user.id)

        return new Response(
          JSON.stringify({ 
            success: true,
            backupCodes,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'disable': {
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Code required to disable 2FA' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify code
        if (profile?.totp_secret) {
          const totp = new OTPAuth.TOTP({
            issuer: 'CompanionAI',
            label: user.email || 'User',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(profile.totp_secret),
          })

          const delta = totp.validate({ token: code, window: 1 })
          if (delta === null) {
            return new Response(
              JSON.stringify({ error: 'Invalid code' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        // Disable 2FA
        await supabaseClient
          .from('profiles')
          .update({ 
            totp_enabled: false,
            totp_secret: null,
            backup_codes: null,
          })
          .eq('id', user.id)

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

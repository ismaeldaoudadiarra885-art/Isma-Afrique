import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user data from the request
    const { user, accessCode } = await req.json()

    // Send welcome email using Resend (you'll need to set up Resend API key)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      console.log('No RESEND_API_KEY found, logging email instead')
      console.log(`📧 Email envoyé à ${user.email}:`)
      console.log(`   Sujet: Bienvenue dans l'organisation`)
      console.log(`   Message: Bonjour ${user.name},`)
      console.log(`           Votre code d'accès est: ${accessCode}`)
      console.log(`           Rôle: ${user.role}`)
      console.log(`           Connectez-vous à l'application avec ce code.`)

      return new Response(
        JSON.stringify({ success: true, message: 'Email logged (demo mode)' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Send actual email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@yourapp.com',
        to: [user.email],
        subject: 'Bienvenue dans l\'organisation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Bienvenue dans l'organisation !</h2>
            <p>Bonjour ${user.name},</p>
            <p>Vous avez été ajouté à l'organisation avec le rôle: <strong>${user.role}</strong></p>
            <p>Votre code d'accès pour vous connecter est:</p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0; color: #333; font-size: 24px;">${accessCode}</h3>
            </div>
            <p>Conservez ce code en sécurité. Vous en aurez besoin pour vous connecter à l'application.</p>
            <p>Si vous avez des questions, contactez votre administrateur.</p>
            <br>
            <p>Cordialement,<br>L'équipe de gestion</p>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      throw new Error(`Failed to send email: ${emailResponse.statusText}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

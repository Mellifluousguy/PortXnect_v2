import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Determine the page to redirect after login (default to /dashboard)
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    next = '/dashboard'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // for production behind load balancers
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // Local environment
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        // Production with forwarded host
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        // Production without forwarded host
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // If login fails, redirect to login page
  return NextResponse.redirect(`${origin}/Login`)
}

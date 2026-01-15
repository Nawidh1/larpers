import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"
  const error_description = requestUrl.searchParams.get("error_description")
  const error_code = requestUrl.searchParams.get("error_code")

  // Handle errors from Supabase
  if (error_code || error_description) {
    const errorMsg = error_description || "Er is een fout opgetreden bij het bevestigen van je email"
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, request.url))
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error("Error exchanging code for session:", error)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message || "Could not confirm email")}`, request.url)
        )
      }

      // Successfully exchanged code for session, redirect to dashboard
      const redirectUrl = new URL(next, request.url)
      return NextResponse.redirect(redirectUrl)
    } catch (err: any) {
      console.error("Error in auth callback:", err)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(err.message || "Could not confirm email")}`, request.url)
      )
    }
  }

  // If there's no code, redirect to login with error message
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Geen bevestigingscode gevonden")}`, request.url))
}

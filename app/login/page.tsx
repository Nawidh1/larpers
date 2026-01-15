"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  // Check for error or success messages in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get("error")
    const confirmed = params.get("confirmed")
    
    if (errorParam) {
      setError(errorParam)
    }
    if (confirmed === "true") {
      setError("Email bevestigd! Je kunt nu inloggen.")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Trim and validate email
    const trimmedEmail = email.trim().toLowerCase()
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address")
      setLoading(false)
      return
    }

    // Password validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      if (isSignUp) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        })
        if (signUpError) throw signUpError
        
        // If email confirmation is disabled, user is automatically logged in
        if (signUpData.user && signUpData.session) {
          // User is logged in, redirect to dashboard
          await new Promise(resolve => setTimeout(resolve, 100))
          router.push("/dashboard")
          router.refresh()
        } else if (signUpData.user) {
          // User created but needs email confirmation
          setError("Account created! Please check your email for the confirmation link.")
        } else {
          throw new Error("Failed to create account. Please try again.")
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        })
        if (error) throw error
        
        // Check if sign in was successful
        if (data.user) {
          // Wait a bit for the session to be set
          await new Promise(resolve => setTimeout(resolve, 100))
          router.push("/dashboard")
          router.refresh()
        } else {
          throw new Error("Login failed. Please try again.")
        }
      }
    } catch (err: any) {
      // Better error handling
      let errorMessage = "An error occurred"
      if (err.message) {
        errorMessage = err.message
        // Handle specific Supabase errors
        if (err.message.includes("Invalid login credentials") || err.message.includes("Invalid credentials")) {
          errorMessage = "Invalid email or password. Don't have an account? Click 'Sign Up' to create one."
        } else if (err.message.includes("Email rate limit exceeded")) {
          errorMessage = "Too many requests. Please try again later."
        } else if (err.message.includes("User already registered")) {
          errorMessage = "This email is already registered. Please sign in instead."
        } else if (err.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email and click the confirmation link before signing in."
        } else if (err.message.includes("Email address")) {
          errorMessage = err.message
        }
      }
      console.error("Login error:", err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Demo login for testing without Supabase
  const handleDemoLogin = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center mb-8">
            <Logo size="large" />
            <p className="text-muted-foreground mt-2 text-lg">Smart Agritech Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant={error.includes("Check your email") || error.includes("Account created") ? "default" : "destructive"}>
                <AlertDescription className="flex flex-col gap-2">
                  <span>{error}</span>
                  {error.includes("Invalid email or password") && !isSignUp && (
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm text-agri-green hover:text-agri-green-dark self-start"
                      onClick={() => {
                        setIsSignUp(true)
                        setError(null)
                      }}
                    >
                      Klik hier om een account aan te maken →
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-agri-green hover:bg-agri-green-dark text-white"
              disabled={loading}
            >
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Log In"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null) // Clear error when switching modes
              }}
            >
              {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
            </Button>
            
            {isSignUp && (
              <p className="text-sm text-muted-foreground text-center">
                Create a new account to get started
              </p>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or</span>
              </div>
            </div>

            <Button type="button" variant="secondary" className="w-full" onClick={handleDemoLogin}>
              Continue with Demo Mode
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Demo mode uses sample data. Connect Supabase for real data persistence.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

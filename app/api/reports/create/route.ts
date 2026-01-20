import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Create a new report record
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, type } = body

    if (!title || !type) {
      return NextResponse.json({ error: "Title and type are required" }, { status: 400 })
    }

    if (!["crop", "financial", "climate", "custom"].includes(type)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    const { data: report, error } = await supabase
      .from("reports")
      .insert([
        {
          user_id: user.id,
          title,
          type,
          file_url: null,
          generated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating report:", error)
      return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
    }

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error("Error creating report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

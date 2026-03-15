import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/track/dashboard
 * Receives dashboard analytics events and stores them.
 * Used for tracking admin/collaborator actions.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_type,
      user_id,
      user_role,
      page_path,
      session_id,
      visitor_id,
      device_type,
      screen_width,
      metadata,
      timestamp,
    } = body;

    // Validate required fields
    if (!event_type || !session_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store in dashboard_analytics table
    const { error } = await supabase.from("dashboard_analytics").insert({
      event_type,
      user_id: user_id || null,
      user_role: user_role || null,
      page_path: page_path || null,
      session_id,
      visitor_id: visitor_id || null,
      device_type: device_type || null,
      screen_width: screen_width || null,
      metadata: metadata || null,
      created_at: timestamp || new Date().toISOString(),
    });

    if (error) {
      console.error("[Dashboard Analytics] Failed to store event:", error);
      // Don't fail the request - just log the error
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Dashboard Analytics] Error:", error);
    // Return success anyway to not break user experience
    return NextResponse.json({ success: true });
  }
}

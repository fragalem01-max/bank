import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabaseAdmin();

    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("account_id", session.id)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ notifications: notifications || [] });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { notificationId, markAllRead } = await request.json();

    if (markAllRead) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("account_id", session.id)
        .eq("is_read", false);
    } else if (notificationId) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("account_id", session.id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

// POST - send notification to user(s)
export async function POST(request) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const { accountId, sendToAll, title, message, type } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const notifType = ["info", "success", "warning", "transfer", "security"].includes(type) ? type : "info";

    if (sendToAll) {
      // Get all active user accounts
      const { data: accounts } = await supabase
        .from("accounts")
        .select("id")
        .eq("role", "user")
        .eq("status", "active");

      if (!accounts || accounts.length === 0) {
        return NextResponse.json({ error: "No active accounts found" }, { status: 404 });
      }

      const notifications = accounts.map((acc) => ({
        account_id: acc.id,
        title,
        message,
        type: notifType,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      return NextResponse.json({ success: true, sent: accounts.length });
    } else {
      if (!accountId) {
        return NextResponse.json({ error: "accountId is required when not sending to all" }, { status: 400 });
      }

      const { error } = await supabase.from("notifications").insert({
        account_id: accountId,
        title,
        message,
        type: notifType,
      });

      if (error) throw error;

      return NextResponse.json({ success: true, sent: 1 });
    }
  } catch (err) {
    if (err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

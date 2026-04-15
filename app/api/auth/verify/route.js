import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: account } = await supabase
      .from("accounts")
      .select("id, account_id, account_number, full_name, email, phone, role, iban, balance_available, balance_reserve, is_verified, address, id_photo_url, status, language, created_at")
      .eq("id", session.id)
      .single();

    if (!account || account.status !== "active") {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ user: account });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// PATCH - update language preference
export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { language } = await request.json();
    if (!["en", "it"].includes(language)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    await supabase.from("accounts").update({ language }).eq("id", session.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

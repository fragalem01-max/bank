import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { iban } = await request.json();

    if (!iban || iban.length < 15 || iban.length > 34) {
      return NextResponse.json({ error: "Invalid IBAN format" }, { status: 400 });
    }

    const cleaned = iban.replace(/\s/g, "").toUpperCase();

    const { data: existing } = await supabase
      .from("accounts")
      .select("id")
      .eq("iban", cleaned)
      .neq("id", id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "IBAN already assigned to another account" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("accounts")
      .update({ iban: cleaned })
      .eq("id", id)
      .select("id, iban")
      .single();

    if (error) throw error;

    await supabase.from("notifications").insert({
      account_id: id,
      title: "IBAN Assigned",
      message: `Your IBAN has been assigned: ${cleaned}`,
      type: "success",
    });

    return NextResponse.json({ account: data });
  } catch (err) {
    if (err.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

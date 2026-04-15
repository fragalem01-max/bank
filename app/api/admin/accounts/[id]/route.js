import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data: account, error } = await supabase.from("accounts").select("*").eq("id", id).single();
    if (error || !account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    delete account.password_hash;
    const { data: transactions } = await supabase.from("transactions").select("*").eq("account_id", id).order("created_at", { ascending: false }).limit(100);
    return NextResponse.json({ account, transactions: transactions || [] });
  } catch (err) {
    if (err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const allowedFields = ["full_name", "email", "phone", "status", "is_verified", "address_line1", "address_line2", "postal_code", "country", "language"];
    const updates = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key] === "" ? null : body[key];
    }
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

    if (updates.address_line1 !== undefined || updates.postal_code !== undefined || updates.country !== undefined) {
      const { data: current } = await supabase.from("accounts").select("address_line1, address_line2, postal_code, country").eq("id", id).single();
      const merged = { ...current, ...updates };
      updates.address = [merged.address_line1, merged.address_line2, merged.postal_code, merged.country].filter(Boolean).join(", ");
    }

    const { data, error } = await supabase.from("accounts").update(updates).eq("id", id)
      .select("id, account_id, account_number, full_name, email, phone, role, iban, balance_available, balance_reserve, is_verified, status, address, address_line1, address_line2, postal_code, country, language, created_at")
      .single();
    if (error) throw error;

    if (updates.is_verified === true) {
      await supabase.from("notifications").insert({ account_id: id, title: "Verification Approved", message: "Your identity has been verified. You now have full access to SEPA transfers.", type: "success" });
    }

    return NextResponse.json({ account: data });
  } catch (err) {
    if (err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

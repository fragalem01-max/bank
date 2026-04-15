import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateAccountId, getNextAccountNumber } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const { data: accounts, error } = await supabase
      .from("accounts")
      .select("id, account_id, account_number, full_name, email, phone, role, iban, balance_available, balance_reserve, is_verified, status, language, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ accounts });
  } catch (err) {
    if (err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const { fullName, email, phone, password, language } = await request.json();

    if (!fullName || !password) return NextResponse.json({ error: "Full name and password are required" }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    let accountId;
    let exists = true;
    while (exists) {
      accountId = generateAccountId();
      const { data } = await supabase.from("accounts").select("id").eq("account_id", accountId).single();
      exists = !!data;
    }

    const { data: lastAccount } = await supabase.from("accounts").select("account_number").order("account_number", { ascending: false }).limit(1).single();
    const accountNumber = getNextAccountNumber(lastAccount?.account_number);
    const passwordHash = await bcrypt.hash(password, 12);

    const { data: newAccount, error } = await supabase
      .from("accounts")
      .insert({
        account_id: accountId,
        account_number: accountNumber,
        full_name: fullName,
        email: email || null,
        phone: phone || null,
        password_hash: passwordHash,
        role: "user",
        language: language || "en",
      })
      .select("id, account_id, account_number, full_name, email, phone, role, iban, balance_available, balance_reserve, is_verified, status, language, created_at")
      .single();

    if (error) {
      console.error("Create account error:", error);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    await supabase.from("notifications").insert({
      account_id: newAccount.id,
      title: language === "it" ? "Benvenuto in DNB" : "Welcome to DNB",
      message: language === "it"
        ? "Il tuo conto è stato creato con successo. Completa la verifica per abilitare tutte le funzionalità."
        : "Your account has been created successfully. Please complete verification to enable all features.",
      type: "info",
    });

    return NextResponse.json({ account: newAccount }, { status: 201 });
  } catch (err) {
    if (err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

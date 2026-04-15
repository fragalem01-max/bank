import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendMail, transferPendingEmail } from "@/lib/mailer";

function generateTransactionRef() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TXN-${date}-${rand}`;
}

// GET - user transactions with pagination
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdmin();

    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("account_id", session.id)
      .eq("visible", true);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("account_id", session.id)
      .eq("visible", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      transactions: transactions || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - create SEPA transfer (pending until admin approves)
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabaseAdmin();

    const { data: account } = await supabase
      .from("accounts")
      .select("id, iban, balance_available, is_verified, full_name, email")
      .eq("id", session.id)
      .single();

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (!account.is_verified) return NextResponse.json({ error: "Account verification required." }, { status: 403 });
    if (!account.iban) return NextResponse.json({ error: "No IBAN assigned. Contact your administrator." }, { status: 403 });

    const { recipientName, recipientIban, amount, reference, description } = await request.json();

    if (!recipientName || !recipientIban || !amount) {
      return NextResponse.json({ error: "Recipient name, IBAN and amount are required" }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    if (numAmount > parseFloat(account.balance_available)) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

    const cleanIban = recipientIban.replace(/\s/g, "").toUpperCase();
    const txRef = generateTransactionRef();

    // Create transaction as PENDING — balance deducted only after admin approval
    const { error: txErr } = await supabase.from("transactions").insert({
      account_id: session.id,
      type: "transfer_out",
      amount: numAmount,
      balance_type: "available",
      reference: reference || null,
      transaction_ref: txRef,
      description: description || `SEPA Transfer to ${recipientName}`,
      counterparty_name: recipientName,
      counterparty_iban: cleanIban,
      status: "pending",
      visible: true,
    });
    if (txErr) throw txErr;

    // Notify user
    await supabase.from("notifications").insert({
      account_id: session.id,
      title: "Transfer Pending",
      message: `Your transfer of €${numAmount.toFixed(2)} to ${recipientName} (${txRef}) is pending approval.`,
      type: "transfer",
    });

    // Send email if SMTP configured
    if (account.email) {
      const email = transferPendingEmail({
        name: account.full_name,
        amount: numAmount,
        recipientName,
        transactionRef: txRef,
      });
      sendMail({ to: account.email, ...email }).catch(() => {});
    }

    return NextResponse.json({ success: true, transactionRef: txRef });
  } catch (err) {
    console.error("Transfer error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

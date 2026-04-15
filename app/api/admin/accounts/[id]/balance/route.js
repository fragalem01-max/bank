import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

function generateTransactionRef() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TXN-${date}-${rand}`;
}

export async function POST(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { amount, balanceType, description, reference, showInTransactions } = await request.json();

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    const type = balanceType || "available";
    const field = type === "reserve" ? "balance_reserve" : "balance_available";

    const { data: account } = await supabase
      .from("accounts")
      .select("id, balance_available, balance_reserve")
      .eq("id", id)
      .single();

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const currentBalance = parseFloat(account[field]);
    const newBalance = currentBalance + numAmount;

    if (newBalance < 0) {
      return NextResponse.json({ error: "Insufficient balance for deduction" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("accounts")
      .update({ [field]: newBalance })
      .eq("id", id);
    if (updateError) throw updateError;

    const { error: txError } = await supabase.from("transactions").insert({
      account_id: id,
      type: numAmount >= 0 ? "credit" : "debit",
      amount: Math.abs(numAmount),
      balance_type: type,
      description: description || (numAmount >= 0 ? "Balance credit" : "Balance deduction"),
      reference: reference || `ADM-${Date.now()}`,
      transaction_ref: generateTransactionRef(),
      status: "completed",
      visible: showInTransactions !== false,
    });
    if (txError) throw txError;

    if (showInTransactions !== false) {
      await supabase.from("notifications").insert({
        account_id: id,
        title: numAmount >= 0 ? "Funds Received" : "Account Debit",
        message: `€${Math.abs(numAmount).toFixed(2)} has been ${numAmount >= 0 ? "credited to" : "debited from"} your ${type} balance.${description ? " — " + description : ""}`,
        type: numAmount >= 0 ? "success" : "warning",
      });
    }

    return NextResponse.json({
      success: true,
      newBalance,
      balanceAvailable: type === "available" ? newBalance : parseFloat(account.balance_available),
      balanceReserve: type === "reserve" ? newBalance : parseFloat(account.balance_reserve),
    });
  } catch (err) {
    if (err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Balance error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

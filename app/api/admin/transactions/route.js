import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendMail, transferApprovedEmail, transferRejectedEmail } from "@/lib/mailer";

// GET — list transactions (optionally filtered by status)
export async function GET(request) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, completed, failed, all
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("transactions")
      .select("*, accounts!inner(full_name, email, account_number, iban)", { count: "exact" });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: transactions, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      transactions: transactions || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (err) {
    if (err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH — approve or reject a transaction
export async function PATCH(request) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const { transactionId, action, reason } = await request.json();

    if (!transactionId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "transactionId and action (approve/reject) required" }, { status: 400 });
    }

    // Get transaction with account info
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .select("*, accounts!inner(id, full_name, email, balance_available)")
      .eq("id", transactionId)
      .eq("status", "pending")
      .single();

    if (txErr || !tx) {
      return NextResponse.json({ error: "Transaction not found or already processed" }, { status: 404 });
    }

    if (action === "approve") {
      const currentBalance = parseFloat(tx.accounts.balance_available);
      const amount = parseFloat(tx.amount);

      if (amount > currentBalance) {
        return NextResponse.json({ error: "Insufficient funds on account" }, { status: 400 });
      }

      // Deduct balance
      const { error: balErr } = await supabase
        .from("accounts")
        .update({ balance_available: currentBalance - amount })
        .eq("id", tx.account_id);
      if (balErr) throw balErr;

      // Mark completed
      const { error: upErr } = await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", transactionId);
      if (upErr) throw upErr;

      // Notify
      await supabase.from("notifications").insert({
        account_id: tx.account_id,
        title: "Transfer Completed",
        message: `Your transfer of €${amount.toFixed(2)} to ${tx.counterparty_name} (${tx.transaction_ref}) has been approved.`,
        type: "success",
      });

      // Email
      if (tx.accounts.email) {
        const email = transferApprovedEmail({
          name: tx.accounts.full_name,
          amount,
          recipientName: tx.counterparty_name,
          transactionRef: tx.transaction_ref,
        });
        sendMail({ to: tx.accounts.email, ...email }).catch(() => {});
      }
    } else {
      // Reject
      const { error: upErr } = await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);
      if (upErr) throw upErr;

      await supabase.from("notifications").insert({
        account_id: tx.account_id,
        title: "Transfer Declined",
        message: `Your transfer of €${parseFloat(tx.amount).toFixed(2)} to ${tx.counterparty_name} (${tx.transaction_ref}) has been declined.${reason ? " Reason: " + reason : ""}`,
        type: "warning",
      });

      if (tx.accounts.email) {
        const email = transferRejectedEmail({
          name: tx.accounts.full_name,
          amount: tx.amount,
          recipientName: tx.counterparty_name,
          transactionRef: tx.transaction_ref,
          reason,
        });
        sendMail({ to: tx.accounts.email, ...email }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    if (err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

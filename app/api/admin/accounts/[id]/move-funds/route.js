import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { amount, direction } = await request.json();
    // direction: "reserve_to_available" or "available_to_reserve"

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: "Valid positive amount required" }, { status: 400 });
    }
    if (!["reserve_to_available", "available_to_reserve"].includes(direction)) {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }

    const numAmount = parseFloat(amount);

    const { data: account } = await supabase
      .from("accounts")
      .select("id, balance_available, balance_reserve")
      .eq("id", id)
      .single();

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const avail = parseFloat(account.balance_available);
    const reserve = parseFloat(account.balance_reserve);

    if (direction === "reserve_to_available") {
      if (numAmount > reserve) {
        return NextResponse.json({ error: "Insufficient reserve balance" }, { status: 400 });
      }
      const { error } = await supabase
        .from("accounts")
        .update({
          balance_reserve: reserve - numAmount,
          balance_available: avail + numAmount,
        })
        .eq("id", id);
      if (error) throw error;
    } else {
      if (numAmount > avail) {
        return NextResponse.json({ error: "Insufficient available balance" }, { status: 400 });
      }
      const { error } = await supabase
        .from("accounts")
        .update({
          balance_available: avail - numAmount,
          balance_reserve: reserve + numAmount,
        })
        .eq("id", id);
      if (error) throw error;
    }

    // Notify user
    const fromLabel = direction === "reserve_to_available" ? "Reserve" : "Available";
    const toLabel = direction === "reserve_to_available" ? "Available" : "Reserve";

    await supabase.from("notifications").insert({
      account_id: id,
      title: "Funds Moved",
      message: `€${numAmount.toFixed(2)} moved from ${fromLabel} to ${toLabel} balance.`,
      type: "info",
    });

    const newAvail = direction === "reserve_to_available" ? avail + numAmount : avail - numAmount;
    const newReserve = direction === "reserve_to_available" ? reserve - numAmount : reserve + numAmount;

    return NextResponse.json({
      success: true,
      balanceAvailable: newAvail,
      balanceReserve: newReserve,
    });
  } catch (err) {
    if (err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

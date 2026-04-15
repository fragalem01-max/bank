import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { addressLine1, addressLine2, postalCode, country, idPhotoBase64 } = await request.json();

    if (!addressLine1 || !postalCode || !country) {
      return NextResponse.json(
        { error: "Address Line 1, Postal Code, and Country are required" },
        { status: 400 }
      );
    }

    if (!idPhotoBase64) {
      return NextResponse.json({ error: "ID photo is required" }, { status: 400 });
    }

    // Build full address string for display
    const fullAddress = [addressLine1, addressLine2, postalCode, country].filter(Boolean).join(", ");

    const { error } = await supabase
      .from("accounts")
      .update({
        address: fullAddress,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        postal_code: postalCode,
        country: country,
        id_photo_url: "pending_review",
        id_photo_data: idPhotoBase64,
      })
      .eq("id", session.id);

    if (error) throw error;

    await supabase.from("notifications").insert({
      account_id: session.id,
      title: "Verification Submitted",
      message: "Your identity verification documents have been submitted and are under review.",
      type: "info",
    });

    return NextResponse.json({ success: true, message: "Verification submitted for review" });
  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

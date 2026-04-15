import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { accountId, password } = await request.json();

    if (!accountId || !password) {
      return NextResponse.json(
        { error: "Account ID and password are required" },
        { status: 400 }
      );
    }

    if (!/^\d{11}$/.test(accountId)) {
      return NextResponse.json(
        { error: "Invalid Account ID format" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: account, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("account_id", accountId)
      .single();

    if (error || !account) {
      // Constant-time comparison to prevent timing attacks
      await bcrypt.compare(password, "$2a$12$invalid.hash.for.timing.attack.prevention.only");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (account.status !== "active") {
      return NextResponse.json(
        { error: "Account is suspended. Contact your administrator." },
        { status: 403 }
      );
    }

    const validPassword = await bcrypt.compare(password, account.password_hash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: account.id,
      account_id: account.account_id,
      role: account.role,
      name: account.full_name,
    });

    const response = NextResponse.json({
      success: true,
      role: account.role,
      name: account.full_name,
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

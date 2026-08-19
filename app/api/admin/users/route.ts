import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("유저 불러오기 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("Admin users API 에러:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "서버 오류" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { userId, standardTicket, premiumTicket } = body ?? {};

    if (!userId || !Number.isInteger(standardTicket) || !Number.isInteger(premiumTicket)) {
      return NextResponse.json({ error: "userId, standardTicket, premiumTicket가 필요합니다." }, { status: 400 });
    }

    if (standardTicket < 0 || premiumTicket < 0) {
      return NextResponse.json({ error: "티켓 수는 0 이상이어야 합니다." }, { status: 400 });
    }

    const admin = createSupabaseAdmin();
    const { error } = await admin
      .from("user_profiles")
      .update({ standard_ticket: standardTicket, premium_ticket: premiumTicket })
      .eq("id", userId);

    if (error) {
      console.error("티켓 수정 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin users PATCH API 에러:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "서버 오류" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const admin = createSupabaseAdmin();
    let query = admin
      .from("deposit_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("입금 내역 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("Admin deposit-requests API 에러:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "서버 오류" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const requestId = body?.requestId as string | undefined;

    if (!requestId) {
      return NextResponse.json({ error: "requestId가 필요합니다." }, { status: 400 });
    }

    const admin = createSupabaseAdmin();

    const { data: depositRequest, error: fetchError } = await admin
      .from("deposit_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !depositRequest) {
      return NextResponse.json({ error: "입금 신청 내역을 찾을 수 없습니다." }, { status: 404 });
    }

    if (depositRequest.status === "completed") {
      return NextResponse.json({ error: "이미 처리된 신청입니다." }, { status: 409 });
    }

    const { data: userData, error: userError } = await admin
      .from("user_profiles")
      .select("standard_ticket, premium_ticket")
      .eq("id", depositRequest.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "회원 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const updatePayload =
      depositRequest.ticket_type === "premium"
        ? { premium_ticket: (userData.premium_ticket || 0) + (depositRequest.ticket_count || 1) }
        : { standard_ticket: (userData.standard_ticket || 0) + (depositRequest.ticket_count || 1) };

    const { error: updateError } = await admin
      .from("user_profiles")
      .update(updatePayload)
      .eq("id", depositRequest.user_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { error: reqError } = await admin
      .from("deposit_requests")
      .update({ status: "completed" })
      .eq("id", requestId);

    if (reqError) {
      return NextResponse.json({ error: reqError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin deposit-requests approve API 에러:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "서버 오류" },
      { status: 500 }
    );
  }
}

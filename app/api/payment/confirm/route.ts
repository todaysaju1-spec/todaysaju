import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getTicketPackageById } from "@/lib/ticket-packages";

async function verifyRequestUser(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false as const, status: 401, message: "로그인이 필요합니다." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { ok: false as const, status: 500, message: "서버 설정 오류" };
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    return { ok: false as const, status: 401, message: "유효하지 않은 세션입니다." };
  }

  return { ok: true as const, user };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRequestUser(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.message }, { status: authResult.status });
    }
    const user = authResult.user;

    const body = await request.json();
    const paymentId = body?.paymentId as string | undefined;
    const packageId = body?.packageId as string | undefined;
    const payMethod = body?.payMethod === "EASY_PAY" ? "KAKAOPAY" : "CARD";

    if (!paymentId || !packageId) {
      return NextResponse.json({ error: "paymentId, packageId가 필요합니다." }, { status: 400 });
    }

    const pkg = getTicketPackageById(packageId);
    if (!pkg) {
      return NextResponse.json({ error: "알 수 없는 상품입니다." }, { status: 400 });
    }

    const admin = createSupabaseAdmin();

    // 이미 처리된 결제인지 확인 (같은 paymentId로 재요청되어도 티켓이 중복 지급되지 않도록)
    const { data: existingLog } = await admin
      .from("payment_logs")
      .select("id")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (existingLog) {
      const { data: profile } = await admin
        .from("user_profiles")
        .select("standard_ticket, premium_ticket")
        .eq("id", user.id)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        standardTicket: profile?.standard_ticket ?? 0,
        premiumTicket: profile?.premium_ticket ?? 0,
      });
    }

    const portoneSecret = process.env.PORTONE_API_SECRET;
    if (!portoneSecret) {
      console.error("PORTONE_API_SECRET이 설정되지 않았습니다.");
      return NextResponse.json({ error: "결제 검증 서버 설정 오류" }, { status: 500 });
    }

    const portoneRes = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `PortOne ${portoneSecret}` } }
    );

    if (!portoneRes.ok) {
      console.error("PortOne 결제 조회 실패:", portoneRes.status, await portoneRes.text());
      return NextResponse.json({ error: "결제 정보를 확인할 수 없습니다." }, { status: 502 });
    }

    const payment = await portoneRes.json();

    if (payment.status !== "PAID") {
      return NextResponse.json({ error: "결제가 완료되지 않았습니다." }, { status: 400 });
    }

    if (payment.amount?.total !== pkg.price) {
      console.error("결제 금액 불일치:", payment.amount?.total, "expected:", pkg.price);
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
    }

    const passName = pkg.category === "premium" ? "프리미엄 패스" : "스탠다드 패스";
    const orderName = `[오늘의사주] ${passName} ${pkg.label}`;
    const ticketField = pkg.category === "premium" ? "premium_ticket" : "standard_ticket";

    const { data: profile, error: profileError } = await admin
      .from("user_profiles")
      .select("standard_ticket, premium_ticket")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("프로필 조회 에러:", profileError);
      return NextResponse.json({ error: "프로필 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    const currentCount = pkg.category === "premium" ? profile.premium_ticket || 0 : profile.standard_ticket || 0;
    const newCount = currentCount + pkg.tickets;

    const { error: updateError } = await admin
      .from("user_profiles")
      .update({ [ticketField]: newCount })
      .eq("id", user.id);

    if (updateError) {
      console.error("티켓 충전 DB 에러:", updateError);
      return NextResponse.json({ error: "티켓 반영 중 오류가 발생했습니다." }, { status: 500 });
    }

    const { error: logError } = await admin.from("payment_logs").insert({
      user_id: user.id,
      user_email: user.email || "이메일 없음",
      order_name: orderName,
      amount_krw: pkg.price,
      ticket_type: pkg.category,
      ticket_count: pkg.tickets,
      payment_id: paymentId,
      pay_method: payMethod,
      status: "PAID",
    });

    if (logError) {
      console.error("결제 내역 로그 저장 실패:", logError);
    }

    return NextResponse.json({
      success: true,
      standardTicket: pkg.category === "premium" ? profile.standard_ticket || 0 : newCount,
      premiumTicket: pkg.category === "premium" ? newCount : profile.premium_ticket || 0,
    });
  } catch (err) {
    console.error("결제 검증 API 에러:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "서버 오류" },
      { status: 500 }
    );
  }
}

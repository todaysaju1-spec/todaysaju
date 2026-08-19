import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const FREE_SAJU_TITLE = "오늘의 무료 사주";
const FREE_SAJU_TYPE = "free";

const VALID_ACTIONS = ["analyze_saju", "follow_up", "menu_click", "premium_saju"] as const;
type Action = (typeof VALID_ACTIONS)[number];

function getKSTDayBounds() {
  const kstDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  return {
    start: `${kstDateStr}T00:00:00+09:00`,
    end: `${kstDateStr}T23:59:59.999+09:00`,
  };
}

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
    const action = body?.action as Action;

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "알 수 없는 요청입니다." }, { status: 400 });
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: "운세 서버가 설정되지 않았습니다." }, { status: 500 });
    }

    const admin = createSupabaseAdmin();

    const useTicket =
      action === "menu_click" ||
      action === "premium_saju" ||
      action === "follow_up" ||
      (action === "analyze_saju" && body.useTicket === true);
    const ticketField: "standard_ticket" | "premium_ticket" | null =
      action === "premium_saju" ? "premium_ticket" : useTicket ? "standard_ticket" : null;

    if (action === "analyze_saju" && !body.useTicket) {
      const { start, end } = getKSTDayBounds();
      const { data: historyToday, error: historyError } = await admin
        .from("saju_history")
        .select("id, title, type")
        .eq("user_id", user.id)
        .gte("created_at", start)
        .lte("created_at", end);

      if (historyError) {
        console.error("무료 사주 중복 체크 에러:", historyError);
      } else {
        const alreadyUsed = (historyToday ?? []).some(
          (row) => row.title === FREE_SAJU_TITLE || row.type === FREE_SAJU_TYPE
        );
        if (alreadyUsed) {
          return NextResponse.json({ error: "오늘의 무료 사주를 이미 이용하셨습니다." }, { status: 409 });
        }
      }
    }

    let currentTicketCount = 0;
    if (ticketField) {
      const { data: profile, error: profileError } = await admin
        .from("user_profiles")
        .select("standard_ticket, premium_ticket")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: "프로필 조회 중 오류가 발생했습니다." }, { status: 500 });
      }

      currentTicketCount = profile[ticketField] || 0;
      if (currentTicketCount < 1) {
        return NextResponse.json({ error: "이용권이 부족합니다." }, { status: 402 });
      }
    }

    const n8nPayload: Record<string, unknown> = {
      action,
      name: body.name,
      sajuData: body.sajuData,
      maritalStatus: body.maritalStatus,
      hasChildren: body.hasChildren,
      question: body.question,
      category: body.category,
      ...(body.partnerFields || {}),
    };

    const n8nRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nRes.ok) {
      return NextResponse.json({ error: "운세 서버 통신이 지연되고 있습니다." }, { status: 502 });
    }

    const data = await n8nRes.json();

    let newTicketCount: number | undefined;
    if (ticketField) {
      newTicketCount = currentTicketCount - 1;
      const { error: deductError } = await admin
        .from("user_profiles")
        .update({ [ticketField]: newTicketCount })
        .eq("id", user.id);

      if (deductError) {
        console.error("티켓 차감 에러:", deductError);
      }
    }

    return NextResponse.json({
      result_text: data.result_text,
      standardTicket: ticketField === "standard_ticket" ? newTicketCount : undefined,
      premiumTicket: ticketField === "premium_ticket" ? newTicketCount : undefined,
    });
  } catch (err) {
    console.error("사주 웹훅 API 에러:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "서버 오류" },
      { status: 500 }
    );
  }
}

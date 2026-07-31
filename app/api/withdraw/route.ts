import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

async function verifyRequestUser(request: NextRequest, userId: string) {
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

  if (user.id !== userId) {
    return { ok: false as const, status: 403, message: "본인 계정만 탈퇴할 수 있습니다." };
  }

  return { ok: true as const, user };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
    }

    const authResult = await verifyRequestUser(request, userId);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.message }, { status: authResult.status });
    }

    const admin = createSupabaseAdmin();

    const { data: existingProfile, error: fetchError } = await admin
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("프로필 조회 에러:", fetchError);
      return NextResponse.json({ error: "프로필 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (existingProfile) {
      const { error: profileError } = await admin
        .from("user_profiles")
        .update({
          display_name: null,
          birth_date: null,
          birth_hour: null,
          birth_min: null,
          gender: null,
          marital_status: null,
          has_children: null,
          partner_name: null,
          partner_birth: null,
          partner_gender: null,
          partner_hour: null,
          partner_min: null,
          partner_calendar_type: null,
          partner_is_time_known: false,
          standard_ticket: 0,
          premium_ticket: 0,
          email: null,
        })
        .eq("id", userId);

      if (profileError) {
        console.error("프로필 초기화 에러:", profileError);
        return NextResponse.json({ error: "프로필 초기화 중 오류가 발생했습니다." }, { status: 500 });
      }
    }

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error("Auth 계정 삭제 에러:", deleteAuthError);
      return NextResponse.json({ error: "계정 삭제 중 오류가 발생했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "회원 탈퇴 및 개인정보 초기화가 완료되었습니다.",
    });
  } catch (err) {
    console.error("회원 탈퇴 API 에러:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "서버 오류" },
      { status: 500 }
    );
  }
}

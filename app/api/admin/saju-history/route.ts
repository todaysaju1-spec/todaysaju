import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const selectedUserId = request.nextUrl.searchParams.get("userId");

  if (!selectedUserId) {
    return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();

    const { data: historyData, error } = await supabase
      .from("saju_history")
      .select("*")
      .eq("user_id", selectedUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("사주 내역 조회 에러:", error, "selectedUserId:", selectedUserId);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: historyData ?? [] });
  } catch (err) {
    console.error("Admin saju-history API 에러:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "서버 오류" },
      { status: 500 }
    );
  }
}

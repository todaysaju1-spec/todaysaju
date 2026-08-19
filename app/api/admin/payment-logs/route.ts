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
      .from("payment_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("카드 결제 내역 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("Admin payment-logs API 에러:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "서버 오류" },
      { status: 500 }
    );
  }
}

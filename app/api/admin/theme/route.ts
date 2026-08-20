import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";

// 지금은 실제 운영 중인 테넌트가 todaysaju 하나뿐이라 슬러그를 고정한다.
// 테넌트가 여러 개가 되면 요청 파라미터로 어떤 테넌트를 바꿀지 받도록 확장하면 된다.
const MANAGED_TENANT_SLUG = "todaysaju";

async function getManagedTenantId() {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", MANAGED_TENANT_SLUG)
    .single();

  if (error || !data) return null;
  return data.id as string;
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const tenantId = await getManagedTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "테넌트를 찾을 수 없습니다." }, { status: 404 });
    }

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("tenant_themes")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Admin theme GET API 에러:", err);
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
    const mode = body?.mode;

    if (mode !== "dark" && mode !== "light") {
      return NextResponse.json({ error: "mode는 dark 또는 light여야 합니다." }, { status: 400 });
    }

    const tenantId = await getManagedTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "테넌트를 찾을 수 없습니다." }, { status: 404 });
    }

    const admin = createSupabaseAdmin();
    const { error } = await admin
      .from("tenant_themes")
      .update({ mode, updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, mode });
  } catch (err) {
    console.error("Admin theme PATCH API 에러:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "서버 오류" },
      { status: 500 }
    );
  }
}

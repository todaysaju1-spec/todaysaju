import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_TENANT_SLUG = "todaysaju";

// 도메인 -> 테넌트 조회는 짧게 캐시해서 매 요청마다 DB를 때리지 않도록 함
let tenantCache: { data: Map<string, { id: string; slug: string }>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

async function loadTenantMap(): Promise<Map<string, { id: string; slug: string }>> {
  if (tenantCache && Date.now() - tenantCache.fetchedAt < CACHE_TTL_MS) {
    return tenantCache.data;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const map = new Map<string, { id: string; slug: string }>();

  if (!supabaseUrl || !anonKey) {
    return map;
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/tenants?select=id,slug,domain&status=eq.active`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    );
    if (res.ok) {
      const rows: { id: string; slug: string; domain: string | null }[] = await res.json();
      for (const row of rows) {
        if (row.domain) map.set(row.domain, { id: row.id, slug: row.slug });
      }
    }
  } catch {
    // 조회 실패 시 빈 맵 반환 -> 기본 테넌트로 폴백
  }

  tenantCache = { data: map, fetchedAt: Date.now() };
  return map;
}

export async function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") || "").split(":")[0];
  const tenantMap = await loadTenantMap();
  const matched = tenantMap.get(hostname);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", matched?.slug || DEFAULT_TENANT_SLUG);
  if (matched?.id) {
    requestHeaders.set("x-tenant-id", matched.id);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { headers } from "next/headers";

export type TenantTheme = {
  siteName: string;
  tagline: string | null;
  metaDescription: string | null;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
};

const DEFAULT_TENANT_SLUG = "todaysaju";

// tenant_themes 조회가 실패하거나(아직 시드 안 됨) 아직 테넌트를 못 찾은 경우를 위한 안전한 기본값.
// 현재 오늘의사주 사이트와 동일한 값.
const FALLBACK_THEME: TenantTheme = {
  siteName: "오늘의사주 PRO",
  tagline: "소름 돋게 정확한 명리학 & 타로",
  metaDescription:
    "30년 경력 명리학자가 인정한 바로 보는 프리미엄 사주! 나의 오늘 운세, 재물운, 연애운부터 정통 명리학 풀이까지 지금 바로 확인하세요.",
  primaryColor: "#D4AF37",
  accentColor: "#F3E5AB",
  backgroundColor: "#0a0514",
  logoUrl: null,
  faviconUrl: null,
};

function mapRow(row: any): TenantTheme {
  return {
    siteName: row.site_name ?? FALLBACK_THEME.siteName,
    tagline: row.tagline ?? null,
    metaDescription: row.meta_description ?? null,
    primaryColor: row.primary_color ?? FALLBACK_THEME.primaryColor,
    accentColor: row.accent_color ?? FALLBACK_THEME.accentColor,
    backgroundColor: row.background_color ?? FALLBACK_THEME.backgroundColor,
    logoUrl: row.logo_url ?? null,
    faviconUrl: row.favicon_url ?? null,
  };
}

// 현재 요청의 테넌트(도메인 기준, proxy.ts가 x-tenant-slug 헤더로 넘겨줌)에 맞는 테마를 조회한다.
// 실패 시 항상 FALLBACK_THEME으로 안전하게 폴백해서 페이지 렌더링을 막지 않는다.
export async function getCurrentTenantTheme(): Promise<TenantTheme> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return FALLBACK_THEME;

  try {
    const headersList = await headers();
    const slug = headersList.get("x-tenant-slug") || DEFAULT_TENANT_SLUG;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/tenant_themes?select=*,tenants!inner(slug)&tenants.slug=eq.${encodeURIComponent(slug)}&limit=1`,
      {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return FALLBACK_THEME;

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return FALLBACK_THEME;

    return mapRow(rows[0]);
  } catch {
    return FALLBACK_THEME;
  }
}

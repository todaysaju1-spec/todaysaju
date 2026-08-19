import { NextRequest } from "next/server";

export type TenantContext = {
  tenantId: string | null;
  tenantSlug: string;
};

const DEFAULT_TENANT_SLUG = "todaysaju";

// proxy.ts가 호스트네임으로 미리 조회해서 넣어둔 헤더를 읽는다.
// 매칭되는 테넌트가 없으면(로컬 개발, 기본 도메인 등) tenantId는 null이 되고,
// DB 쪽 tenant_id 컬럼 기본값(기본 테넌트)이 대신 적용된다.
export function getTenantContext(request: NextRequest): TenantContext {
  return {
    tenantId: request.headers.get("x-tenant-id"),
    tenantSlug: request.headers.get("x-tenant-slug") || DEFAULT_TENANT_SLUG,
  };
}

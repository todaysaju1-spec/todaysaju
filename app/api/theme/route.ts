import { NextResponse } from "next/server";
import { getCurrentTenantTheme } from "@/lib/tenant-theme";

// 공개 라우트: 브랜드 테마 정보(모드, 캐릭터 이미지 URL 등)는 민감 정보가 아니므로
// 클라이언트 컴포넌트(app/page.tsx)가 마운트 시 이 API로 조회해서 화면에 반영한다.
export async function GET() {
  const theme = await getCurrentTenantTheme();
  return NextResponse.json({ data: theme });
}

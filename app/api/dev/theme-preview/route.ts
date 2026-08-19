import { NextRequest, NextResponse } from "next/server";

// 개발/테스트 전용: ?mode=light|dark|reset 으로 이 브라우저에서만 테마를 미리보기 위한 쿠키를 설정한다.
// 실제 tenant_themes 값은 건드리지 않는다. 사용법: /api/dev/theme-preview?mode=light 접속 후 홈으로 리다이렉트됨.
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode");
  const response = NextResponse.redirect(new URL("/", request.url));

  if (mode === "light" || mode === "dark") {
    response.cookies.set("theme_preview", mode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } else {
    response.cookies.delete("theme_preview");
  }

  return response;
}

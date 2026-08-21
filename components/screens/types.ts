// 클라이언트(app/page.tsx)에서 /api/theme로 받아오는 테마 정보의 부분집합.
// lib/tenant-theme.ts의 TenantTheme 중 화면 렌더링에 필요한 필드만 사용한다.
export type ClientTenantTheme = {
  mode: "dark" | "light" | "character";
  characterHeroImageUrl: string | null;
  characterLoadingImageUrl: string | null;
  characterResultImageUrl: string | null;
};

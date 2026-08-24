import { calculateSaju, type Gender, type SajuResult } from "ssaju";

export type UserSajuFormInfo = {
  name: string;
  birth: string;
  hour: string;
  min: string;
  gender: string;
  isTimeKnown: boolean;
};

export function parseBirthFromForm(birth: string) {
  const trimmed = birth.trim();
  if (!/^\d{6}$/.test(trimmed)) return null;

  const yearPrefix = parseInt(trimmed.slice(0, 2), 10) > 30 ? 1900 : 2000;
  return {
    year: yearPrefix + parseInt(trimmed.slice(0, 2), 10),
    month: parseInt(trimmed.slice(2, 4), 10),
    day: parseInt(trimmed.slice(4, 6), 10),
  };
}

export function calculateSajuFromUserInfo(userInfo: UserSajuFormInfo): SajuResult | null {
  const birthParts = parseBirthFromForm(userInfo.birth);
  if (!birthParts) return null;

  const hour =
    !userInfo.isTimeKnown || userInfo.hour === "99"
      ? undefined
      : parseInt(userInfo.hour, 10);
  const minute =
    !userInfo.isTimeKnown || userInfo.hour === "99"
      ? undefined
      : parseInt(userInfo.min, 10);

  const gender: Gender = userInfo.gender === "남자" ? "남" : "여";

  return calculateSaju({
    ...birthParts,
    hour,
    minute,
    gender,
  });
}

export type OhangKey = "목" | "화" | "토" | "금" | "수";

// 오행별 색상은 테마(다크/라이트/캐릭터)에 따라 배경 밝기가 달라지므로,
// 고정된 Tailwind 다크톤 클래스 대신 hex 값만 들고 getOhangStyle()에서
// color-mix()로 현재 테마의 --bg-surface에 맞춰 매번 계산한다.
// solidHex는 흰 글씨를 얹는 "강조(highlight)" 배지 전용 — 금(金)처럼
// 밝은 색은 흰 글씨와 대비가 안 나와서 더 어두운 톤을 별도로 둔다.
export const OHANG_THEME: Record<
  OhangKey,
  {
    label: string;
    hex: string;
    solidHex: string;
    fill: string;
  }
> = {
  목: { label: "木 목", hex: "#059669", solidHex: "#059669", fill: "#059669" },
  화: { label: "火 화", hex: "#dc2626", solidHex: "#dc2626", fill: "#dc2626" },
  토: { label: "土 토", hex: "#d97706", solidHex: "#d97706", fill: "#d97706" },
  금: { label: "金 금", hex: "#64748b", solidHex: "#334155", fill: "#64748b" },
  수: { label: "水 수", hex: "#7c3aed", solidHex: "#7c3aed", fill: "#7c3aed" },
} as const;

// 오행 배지에 바로 꽂아 쓰는 인라인 스타일.
// "soft"(기본): 옅게 색을 섞은 배경 + 그 오행의 고유색 글씨 — 라이트/다크 어디서나 대비 확보.
// "solid"(강조): 오행 고유색을 배경 전체에 채우고 흰 글씨 — 일주/현재 대운 같은 하이라이트 전용.
export function getOhangStyle(
  ohang: string,
  variant: "soft" | "solid" = "soft"
): { backgroundColor: string; color: string; borderColor: string } {
  const theme = OHANG_THEME[ohang as OhangKey] ?? OHANG_THEME.토;

  if (variant === "solid") {
    return {
      backgroundColor: theme.solidHex,
      color: "#ffffff",
      borderColor: theme.solidHex,
    };
  }

  return {
    backgroundColor: `color-mix(in srgb, ${theme.hex} 16%, var(--bg-surface))`,
    color: theme.hex,
    borderColor: `color-mix(in srgb, ${theme.hex} 45%, var(--border-default))`,
  };
}

/** 천간 → 오행 */
export const STEM_TO_OHANG: Record<string, OhangKey> = {
  甲: "목",
  乙: "목",
  丙: "화",
  丁: "화",
  戊: "토",
  己: "토",
  庚: "금",
  辛: "금",
  壬: "수",
  癸: "수",
};

/** 지지 → 오행 (본기 기준) */
export const BRANCH_TO_OHANG: Record<string, OhangKey> = {
  寅: "목",
  卯: "목",
  巳: "화",
  午: "화",
  辰: "토",
  戌: "토",
  丑: "토",
  未: "토",
  申: "금",
  酉: "금",
  子: "수",
  亥: "수",
};

export function getOhangForGanzhi(ganzhi: string): OhangKey {
  const stem = ganzhi.charAt(0);
  return STEM_TO_OHANG[stem] ?? "토";
}

export function getOhangTheme(ohang: string) {
  return OHANG_THEME[ohang as OhangKey] ?? OHANG_THEME.토;
}

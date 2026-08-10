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

export const OHANG_THEME: Record<
  OhangKey,
  {
    label: string;
    bg: string;
    bgSoft: string;
    text: string;
    border: string;
    fill: string;
  }
> = {
  목: {
    label: "木 목",
    bg: "bg-emerald-600/90",
    bgSoft: "bg-emerald-950/60",
    text: "text-emerald-100",
    border: "border-emerald-400/70",
    fill: "#059669",
  },
  화: {
    label: "火 화",
    bg: "bg-red-600/90",
    bgSoft: "bg-red-950/60",
    text: "text-red-100",
    border: "border-red-400/70",
    fill: "#dc2626",
  },
  토: {
    label: "土 토",
    bg: "bg-amber-600/90",
    bgSoft: "bg-amber-950/60",
    text: "text-amber-100",
    border: "border-amber-400/70",
    fill: "#d97706",
  },
  금: {
    label: "金 금",
    bg: "bg-slate-400/90",
    bgSoft: "bg-slate-800/60",
    text: "text-slate-100",
    border: "border-slate-300/70",
    fill: "#94a3b8",
  },
  수: {
    label: "水 수",
    bg: "bg-violet-800/90",
    bgSoft: "bg-violet-950/60",
    text: "text-violet-100",
    border: "border-violet-400/70",
    fill: "#6d28d9",
  },
} as const;

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

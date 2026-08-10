import type { SajuResult } from "ssaju";
import { type OhangKey } from "./saju-dashboard-utils";

const OHANG_ORDER: OhangKey[] = ["목", "화", "토", "금", "수"];

const OHANG_HANJA: Record<OhangKey, string> = {
  목: "木",
  화: "火",
  토: "土",
  금: "金",
  수: "水",
};

export const PREMIUM_MENU_KEY = "__premium__";

export function getDominantOhang(fiveElements: Record<string, number>) {
  let best: OhangKey | null = null;
  let max = -1;

  for (const key of OHANG_ORDER) {
    const count = fiveElements[key] ?? 0;
    if (count > max) {
      max = count;
      best = key;
    }
  }

  if (!best || max <= 0) return null;
  return { key: best, count: max, label: `${best}(${OHANG_HANJA[best]})` };
}

export function getDominantTenGod(tenGods: SajuResult["tenGods"]) {
  const counts: Record<string, number> = {};
  for (const entry of [tenGods.year, tenGods.month, tenGods.day, tenGods.hour]) {
    for (const god of [entry.stem, entry.branch]) {
      if (!god || god === "(일간)") continue;
      counts[god] = (counts[god] ?? 0) + 1;
    }
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  return { name: sorted[0][0], count: sorted[0][1] };
}

export function buildPillarsInsight(sajuResult: SajuResult) {
  const geukguk = sajuResult.advanced.geukguk;
  const dayStem = sajuResult.dayStem;
  return `일간 ${dayStem} · ${geukguk}격의 명식이에요. 타고난 나의 진짜 성향과 평생의 마스터플랜을 확인하세요.`;
}

export function buildDaeunSeyunInsight(sajuResult: SajuResult) {
  const current = sajuResult.daeun.current;
  const currentSeyun = sajuResult.seyun.find((s) => s.year === sajuResult.currentYear);

  if (current && currentSeyun) {
    return `현재 ${current.startAge}~${current.endAge}세 대운 ${current.ganzhi} · ${sajuResult.currentYear}년 세운 ${currentSeyun.ganzhi}의 흐름이 맞물려 있어요. 지금 대운의 변곡점일 수 있습니다. 올해 나의 1년 흐름은 어떨까요?`;
  }

  if (current) {
    return `현재 ${current.startAge}~${current.endAge}세 대운 ${current.ganzhi} 구간이에요. 지금 대운의 흐름이 바뀌는 시기일 수 있습니다. 올해 나의 1년 흐름은 어떨까요?`;
  }

  return "지금 대운의 흐름이 바뀌는 시기일 수 있습니다. 올해 나의 1년 흐름은 어떨까요?";
}

export function buildOhangTenGodInsight(sajuResult: SajuResult) {
  const dominantOhang = getDominantOhang(sajuResult.fiveElements);
  const dominantTenGod = getDominantTenGod(sajuResult.tenGods);

  if (dominantOhang && dominantTenGod) {
    return `${dominantOhang.label} 기운이 ${dominantOhang.count}자로 가장 강하고, ${dominantTenGod.name} 십성이 두드러져요. 넘치는 ${dominantOhang.key}(${OHANG_HANJA[dominantOhang.key]}) 기운이 나의 직업과 재물에 어떤 영향을 줄까요?`;
  }

  if (dominantOhang) {
    return `${dominantOhang.label} 기운이 가장 강하네요! 넘치는 기운이 나의 직업과 재물에 어떤 영향을 줄까요?`;
  }

  if (dominantTenGod) {
    return `${dominantTenGod.name} 십성이 두드러져요. 이 기운이 직업·재물운에 어떤 메시지를 담고 있을까요?`;
  }

  return "오행과 십성의 균형이 인생의 방향을 가리킵니다. 직업과 재물운에서 어떻게 드러날까요?";
}

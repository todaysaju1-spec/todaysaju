"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import type { SajuResult } from "ssaju";
import { BRANCH_TO_OHANG, getOhangStyle, OHANG_THEME, STEM_TO_OHANG, type OhangKey } from "@/lib/saju-dashboard-utils";
import { shareMyeongsikImage, type MyeongsikSharePillar } from "@/lib/share-myeongsik";
import { useToast } from "@/components/ToastProvider";

const OHANG_ORDER: OhangKey[] = ["목", "화", "토", "금", "수"];

type SajuMyeongsikCardProps = {
  name: string;
  birthLabel: string;
  sajuResult: SajuResult;
};

function splitGanzhi(ganzhi: string | undefined) {
  const value = (ganzhi || "").trim();
  if (!value || value === "?" || value === "모름") {
    return { stem: "?", branch: "?" };
  }
  return { stem: value.charAt(0) || "?", branch: value.charAt(1) || "?" };
}

export default function SajuMyeongsikCard({ name, birthLabel, sajuResult }: SajuMyeongsikCardProps) {
  const { showToast } = useToast();
  const [sharing, setSharing] = useState(false);

  const rawPillars = [
    { key: "hour", label: "시주", ganzhi: sajuResult.pillars.hour, tg: sajuResult.tenGods.hour },
    { key: "day", label: "일주", ganzhi: sajuResult.pillars.day, tg: sajuResult.tenGods.day },
    { key: "month", label: "월주", ganzhi: sajuResult.pillars.month, tg: sajuResult.tenGods.month },
    { key: "year", label: "년주", ganzhi: sajuResult.pillars.year, tg: sajuResult.tenGods.year },
  ];

  const pillars: MyeongsikSharePillar[] = rawPillars.map((p) => {
    const { stem, branch } = splitGanzhi(p.ganzhi);
    return {
      label: p.label,
      stem,
      branch,
      stemGod: p.tg.stem === "(일간)" ? "일간" : p.tg.stem,
      branchGod: p.tg.branch,
      highlight: p.key === "day",
    };
  });

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const result = await shareMyeongsikImage({
        name,
        birthLabel,
        dayStem: sajuResult.dayStem,
        geukguk: sajuResult.advanced.geukguk,
        pillars,
        fiveElements: sajuResult.fiveElements,
      });
      showToast(
        result === "shared" ? "명식표를 공유했어요." : "명식표 이미지를 저장했어요. 인스타·카톡에 올려보세요.",
        "success",
      );
    } catch (error) {
      console.error(error);
      showToast("공유 중 오류가 났어요. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-[28px] border border-[var(--brand-primary)]/35 shadow-[0_18px_50px_rgba(90,50,20,0.18)]"
        style={{ fontFamily: "var(--font-noto-serif-kr), serif" }}
      >
        <img
          src="/saju/myeongsik-paper.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fff6e8]/55 via-[#fffaf2]/20 to-[#2a1a10]/25" />

        <img
          src="/saju/myeongsik-seal.png"
          alt="천명"
          className="absolute top-3 right-3 w-14 h-14 md:w-16 md:h-16 object-cover rounded-md opacity-90 mix-blend-multiply"
        />

        <div className="relative px-4 pt-5 pb-4 md:px-6 md:pt-6 md:pb-5">
          <p className="text-[11px] md:text-xs tracking-[0.28em] text-[#7a2e24] font-bold">四柱命理</p>
          <h3 className="text-[22px] md:text-3xl font-bold text-[#1c140c] mt-1 break-keep">{name} 명식</h3>
          <p className="text-[11px] md:text-sm text-[#5c4a3a] mt-1">{birthLabel}</p>
          <p className="text-[12px] md:text-sm font-bold text-[#8a3a1a] mt-1">
            일간 {sajuResult.dayStem} · {sajuResult.advanced.geukguk}
          </p>

          <div className="grid grid-cols-4 gap-2 md:gap-3 mt-5">
            {pillars.map((pillar) => {
              const stemStyle = getOhangStyle(STEM_TO_OHANG[pillar.stem] ?? "토", "solid");
              const branchStyle = getOhangStyle(BRANCH_TO_OHANG[pillar.branch] ?? "토", "solid");
              return (
                <div key={pillar.label} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] md:text-xs font-bold text-[#6b5344]">{pillar.label}</span>
                  <div
                    className={`w-full aspect-square rounded-2xl flex items-center justify-center ${
                      pillar.highlight ? "ring-2 ring-[#c9a227] ring-offset-2 ring-offset-[#fff6e8]" : ""
                    }`}
                    style={{ backgroundColor: stemStyle.backgroundColor }}
                  >
                    <span className="text-[28px] md:text-4xl lg:text-5xl font-bold text-white leading-none">
                      {pillar.stem}
                    </span>
                  </div>
                  <div
                    className={`w-full aspect-square rounded-2xl flex items-center justify-center ${
                      pillar.highlight ? "ring-2 ring-[#c9a227] ring-offset-2 ring-offset-[#fff6e8]" : ""
                    }`}
                    style={{ backgroundColor: branchStyle.backgroundColor }}
                  >
                    <span className="text-[28px] md:text-4xl lg:text-5xl font-bold text-white leading-none">
                      {pillar.branch}
                    </span>
                  </div>
                  <span className="text-[9px] md:text-[11px] text-[#5c4a3a] text-center leading-tight">
                    {pillar.stemGod}
                    <br />
                    {pillar.branchGod}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-3 md:gap-4 mt-5">
            {OHANG_ORDER.map((key) => {
              const style = getOhangStyle(key, "solid");
              return (
                <div key={key} className="flex flex-col items-center gap-1">
                  <span
                    className="w-8 h-8 md:w-9 md:h-9 rounded-full text-white text-xs md:text-sm font-bold flex items-center justify-center"
                    style={{ backgroundColor: style.backgroundColor }}
                  >
                    {sajuResult.fiveElements[key] ?? 0}
                  </span>
                  <span className="text-[9px] md:text-[11px] text-[#5c4a3a]">{OHANG_THEME[key].label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-[var(--brand-primary)]/50 bg-[var(--bg-elevated)] text-[var(--brand-primary)] font-bold text-sm hover:bg-[var(--brand-primary)]/10 transition-all disabled:opacity-60"
      >
        <Share2 size={16} />
        {sharing ? "명식표 만드는 중..." : "명식표 이미지로 공유하기"}
      </button>
    </div>
  );
}

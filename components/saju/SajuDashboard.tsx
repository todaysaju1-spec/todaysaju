"use client";

import { X } from "lucide-react";
import type { SajuResult } from "ssaju";
import OhangDonutChart from "./OhangDonutChart";
import MansaeryeokGrid, { PillarsInsightCta } from "./MansaeryeokGrid";
import SajuMyeongsikCard from "./SajuMyeongsikCard";

type SajuDashboardProps = {
  name: string;
  sajuResult: SajuResult;
  onClose: () => void;
  onMenuSelect?: (menuTitle: string) => void;
};

export default function SajuDashboard({ name, sajuResult, onClose, onMenuSelect }: SajuDashboardProps) {
  const { input, dayStem, advanced, gongmang, currentAge } = sajuResult;

  const birthLabel = `${input.year}.${String(input.month).padStart(2, "0")}.${String(input.day).padStart(2, "0")}${
    input.hour !== undefined
      ? ` ${String(input.hour).padStart(2, "0")}:${String(input.minute).padStart(2, "0")}`
      : " (시간 미상)"
  }`;

  return (
    <div className="fixed inset-0 z-[110] flex items-end lg:items-center justify-center p-0 lg:p-6">
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full lg:max-w-5xl max-h-[95vh] lg:max-h-[92vh] overflow-hidden flex flex-col bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/50 rounded-t-3xl lg:rounded-3xl shadow-[0_0_40px_rgba(212,175,55,0.15)] animate-in slide-in-from-bottom-8 fade-in duration-300">
        {/* 헤더 */}
        <div className="shrink-0 px-4 md:px-6 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] font-bold text-[var(--brand-primary)]">MYEONGSIK</p>
            <h2 className="text-lg md:text-xl font-bold text-[var(--text-body)]" style={{ fontFamily: "var(--font-noto-serif-kr), serif" }}>
              {name}님의 명식표
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-body)] hover:bg-[var(--border-default)]/50 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5">
          <SajuMyeongsikCard
            name={name}
            birthLabel={`${birthLabel} · ${input.gender === "남" ? "남" : "여"} · 만 ${currentAge}세`}
            sajuResult={sajuResult}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="rounded-xl bg-[var(--bg-base)]/80 border border-[var(--border-default)] px-3 py-2">
              <p className="text-[9px] md:text-xs text-[var(--text-muted)]">일간</p>
              <p className="text-sm md:text-base font-bold text-[var(--brand-primary)]">{dayStem}</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-base)]/80 border border-[var(--border-default)] px-3 py-2">
              <p className="text-[9px] md:text-xs text-[var(--text-muted)]">격국</p>
              <p className="text-sm md:text-base font-bold text-[var(--text-body)]">{advanced.geukguk}</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-base)]/80 border border-[var(--border-default)] px-3 py-2">
              <p className="text-[9px] md:text-xs text-[var(--text-muted)]">일간 강약</p>
              <p className="text-sm md:text-base font-bold text-[var(--text-body)]">
                {advanced.dayStrength.strength === "strong"
                  ? "강"
                  : advanced.dayStrength.strength === "weak"
                    ? "약"
                    : "중"}
                <span className="text-[10px] text-[var(--text-muted)] ml-1">({advanced.dayStrength.score})</span>
              </p>
            </div>
            <div className="rounded-xl bg-[var(--bg-base)]/80 border border-[var(--border-default)] px-3 py-2">
              <p className="text-[9px] md:text-xs text-[var(--text-muted)]">용신</p>
              <p className="text-sm md:text-base font-bold text-[var(--text-body)] truncate">
                {advanced.yongsin.join(", ") || "-"}
              </p>
            </div>
          </div>

          {gongmang.branchesKo.length > 0 && (
            <p className="text-[10px] md:text-xs text-[var(--text-muted)] -mt-2">
              공망: {gongmang.branchesKo.join(" · ")}
              {input.leap ? " · 윤달" : ""}
            </p>
          )}

          <PillarsInsightCta sajuResult={sajuResult} onMenuSelect={onMenuSelect} />
          <MansaeryeokGrid sajuResult={sajuResult} onMenuSelect={onMenuSelect} />
          <OhangDonutChart sajuResult={sajuResult} onMenuSelect={onMenuSelect} />
        </div>

        <div className="shrink-0 px-4 md:px-6 py-3 border-t border-[var(--border-default)] bg-[var(--bg-base)]/90">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] font-bold text-sm md:text-base hover:brightness-110 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

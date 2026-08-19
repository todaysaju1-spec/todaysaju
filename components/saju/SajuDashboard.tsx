"use client";

import { X } from "lucide-react";
import type { SajuResult } from "ssaju";
import OhangDonutChart from "./OhangDonutChart";
import MansaeryeokGrid from "./MansaeryeokGrid";

type SajuDashboardProps = {
  name: string;
  sajuResult: SajuResult;
  onClose: () => void;
  onMenuSelect?: (menuTitle: string) => void;
};

export default function SajuDashboard({ name, sajuResult, onClose, onMenuSelect }: SajuDashboardProps) {
  const { input, dayStem, advanced, gongmang, currentAge, currentYear } = sajuResult;

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
        <div className="shrink-0 px-4 md:px-6 py-4 border-b border-[var(--border-default)] bg-gradient-to-r from-[var(--bg-muted)] to-[var(--bg-elevated)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-red-500/80 text-white px-2 py-0.5 rounded-md">
                  🎁 무료 만세력
                </span>
                <span className="text-[10px] md:text-xs text-[var(--text-muted)]">전문가용 대시보드</span>
              </div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[var(--text-body)]">
                {name}님의 <span className="text-[var(--brand-primary)]">사주 명식표</span>
              </h2>
              <p className="text-xs md:text-sm lg:text-base text-[var(--text-muted)] mt-1">
                {birthLabel} · {input.gender === "남" ? "남" : "여"} · 만 {currentAge}세 · {currentYear}년 기준
              </p>
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
            <div className="rounded-xl bg-[var(--bg-base)]/80 border border-[var(--border-default)] px-3 py-2 md:py-3">
              <p className="text-[9px] md:text-xs text-[var(--text-muted)]">일간</p>
              <p className="text-sm md:text-base lg:text-lg font-bold text-[var(--brand-primary)]">{dayStem}</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-base)]/80 border border-[var(--border-default)] px-3 py-2 md:py-3">
              <p className="text-[9px] md:text-xs text-[var(--text-muted)]">격국</p>
              <p className="text-sm md:text-base lg:text-lg font-bold text-[var(--text-body)]">{advanced.geukguk}</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-base)]/80 border border-[var(--border-default)] px-3 py-2 md:py-3">
              <p className="text-[9px] md:text-xs text-[var(--text-muted)]">일간 강약</p>
              <p className="text-sm md:text-base lg:text-lg font-bold text-[var(--text-body)]">
                {advanced.dayStrength.strength === "strong"
                  ? "강"
                  : advanced.dayStrength.strength === "weak"
                    ? "약"
                    : "중"}
                <span className="text-[10px] md:text-xs text-[var(--text-muted)] ml-1">
                  ({advanced.dayStrength.score})
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-[var(--bg-base)]/80 border border-[var(--border-default)] px-3 py-2 md:py-3">
              <p className="text-[9px] md:text-xs text-[var(--text-muted)]">용신</p>
              <p className="text-sm md:text-base lg:text-lg font-bold text-[var(--text-body)] truncate">
                {advanced.yongsin.join(", ") || "-"}
              </p>
            </div>
          </div>

          {gongmang.branchesKo.length > 0 && (
            <p className="text-[10px] md:text-xs text-[var(--text-muted)] mt-2">
              공망: {gongmang.branchesKo.join(" · ")}
              {input.leap ? " · 윤달" : ""}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5">
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

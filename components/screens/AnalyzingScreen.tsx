"use client";

import { Compass } from "lucide-react";
import type { ClientTenantTheme } from "./types";

type AnalyzingScreenProps = {
  tenantTheme: ClientTenantTheme | null;
  loadingText: string;
  onViewLater: () => void;
};

// 🎬 [씬 3] 분석 중 로딩 애니메이션
export default function AnalyzingScreen({ tenantTheme, loadingText, onViewLater }: AnalyzingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 h-[50vh] animate-in fade-in duration-500 text-center">
      {tenantTheme?.mode === "character" && tenantTheme.characterLoadingImageUrl ? (
        <div className="relative w-32 h-32 flex items-center justify-center">
          <img
            src={tenantTheme.characterLoadingImageUrl}
            alt="사주를 분석 중인 명리사 캐릭터"
            className="w-full h-full rounded-full object-cover shadow-[0_0_30px_rgba(217,119,87,0.3)] border-2 border-[var(--brand-primary)]/50 animate-pulse"
          />
        </div>
      ) : (
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 border border-[var(--brand-primary)]/30 rounded-full animate-orbit">
            <div className="absolute -top-1 left-1/2 w-2.5 h-2.5 bg-[var(--brand-primary)] rounded-full shadow-[0_0_10px_var(--brand-primary)]"></div>
          </div>
          <div className="absolute inset-3 border border-[#6b3eb0]/40 rounded-full animate-orbit" style={{ animationDirection: 'reverse', animationDuration: '15s' }}></div>
          <Compass size={36} className="text-[var(--brand-primary)] animate-pulse" />
        </div>
      )}

      {/* 로딩 텍스트 */}
      <p className="text-[var(--brand-primary)] text-sm tracking-wide animate-pulse px-4 leading-relaxed font-light whitespace-pre-wrap">
        {loadingText}
      </p>

      {/* 🌟 새로 추가한 버튼 */}
      <button
        onClick={onViewLater}
        className="mt-6 px-6 py-2.5 text-xs text-[var(--text-muted)] border border-[var(--text-muted)]/50 rounded-full hover:bg-[var(--text-muted)]/10 hover:text-[var(--text-body)] transition-all"
      >
        사주 보관함에서 나중에 결과보기 ✨
      </button>
    </div>
  );
}

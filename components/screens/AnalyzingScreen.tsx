"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import type { ClientTenantTheme } from "./types";

type AnalyzingScreenProps = {
  tenantTheme: ClientTenantTheme | null;
  loadingText: string;
  onViewLater: () => void;
};

// 캐릭터 테마 전용 로딩 연출: 20/40/60/80/100% 진행률이 그려진 카드 5장을
// 순서대로 넘겨 보여준다. 실제 서버 응답 진행률과는 무관한 연출용 타이머라,
// 마지막 프레임(100%)에 도달하면 응답이 늦어져도 그대로 멈춰있는다.
const CHARACTER_LOADING_FRAMES = [
  "/character/loading-20.webp",
  "/character/loading-40.webp",
  "/character/loading-60.webp",
  "/character/loading-80.webp",
  "/character/loading-100.webp",
];
const FRAME_INTERVAL_MS = 18000;

// 🎬 [씬 3] 분석 중 로딩 애니메이션
export default function AnalyzingScreen({ tenantTheme, loadingText, onViewLater }: AnalyzingScreenProps) {
  const isCharacterTheme = tenantTheme?.mode === "character";
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!isCharacterTheme) return;
    const timer = setInterval(() => {
      setFrameIndex((prev) => Math.min(prev + 1, CHARACTER_LOADING_FRAMES.length - 1));
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isCharacterTheme]);

  if (isCharacterTheme) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500 text-center">
        <div className="relative w-full max-w-xs aspect-[307/580] rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(44,65,89,0.2)] border border-[var(--border-default)]">
          <img
            key={frameIndex}
            src={CHARACTER_LOADING_FRAMES[frameIndex]}
            alt="사주를 분석 중인 명리사 캐릭터"
            className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-500"
          />
        </div>
        <button
          onClick={onViewLater}
          className="px-6 py-2.5 text-xs text-[var(--text-muted)] border border-[var(--text-muted)]/50 rounded-full hover:bg-[var(--text-muted)]/10 hover:text-[var(--text-body)] transition-all"
        >
          사주 보관함에서 나중에 결과보기 ✨
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 h-[50vh] animate-in fade-in duration-500 text-center">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute inset-0 border border-[var(--brand-primary)]/30 rounded-full animate-orbit">
          <div className="absolute -top-1 left-1/2 w-2.5 h-2.5 bg-[var(--brand-primary)] rounded-full shadow-[0_0_10px_var(--brand-primary)]"></div>
        </div>
        <div className="absolute inset-3 border border-[#6b3eb0]/40 rounded-full animate-orbit" style={{ animationDirection: 'reverse', animationDuration: '15s' }}></div>
        <Compass size={36} className="text-[var(--brand-primary)] animate-pulse" />
      </div>

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

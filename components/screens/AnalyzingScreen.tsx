"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import type { ClientTenantTheme } from "./types";

type AnalyzingScreenProps = {
  tenantTheme: ClientTenantTheme | null;
  loadingText: string;
};

const CHARACTER_LOADING_FRAMES = [
  "/character/loading-20.webp",
  "/character/loading-40.webp",
  "/character/loading-60.webp",
  "/character/loading-80.webp",
  "/character/loading-100.webp",
];
const FRAME_INTERVAL_MS = 18000;
const PROGRESS_DURATION_MS = 90000;
const LOADING_TIPS = [
  "생년월일과 시간을 만세력과 대조하고 있어요",
  "오행과 십성의 균형을 살피고 있어요",
  "올해 세운과 대운의 흐름을 맞추고 있어요",
];

function useLoadingProgress() {
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(96, 8 + (elapsed / PROGRESS_DURATION_MS) * 88);
      setProgress(next);
      if (next >= 96) window.clearInterval(timer);
    }, 400);
    return () => window.clearInterval(timer);
  }, []);

  return progress;
}

function ProgressBlock({ progress, tip, loadingText }: { progress: number; tip: string; loadingText: string }) {
  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[var(--brand-primary)] text-xs font-bold">{Math.round(progress)}%</p>
      <p className="text-[var(--text-muted)] text-xs leading-relaxed">{tip}</p>
      <p className="text-[var(--brand-primary)] text-sm tracking-wide px-1 leading-relaxed font-light whitespace-pre-wrap">
        {loadingText}
      </p>
      <p className="text-[10px] text-[var(--text-muted)]">분석이 끝나면 결과가 자동으로 열립니다. 창을 닫지 말아 주세요.</p>
    </div>
  );
}

export default function AnalyzingScreen({ tenantTheme, loadingText }: AnalyzingScreenProps) {
  const isCharacterTheme = tenantTheme?.mode === "character";
  const [frameIndex, setFrameIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const progress = useLoadingProgress();

  useEffect(() => {
    if (!isCharacterTheme) return;
    const timer = setInterval(() => {
      setFrameIndex((prev) => Math.min(prev + 1, CHARACTER_LOADING_FRAMES.length - 1));
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isCharacterTheme]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  if (isCharacterTheme) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500 text-center">
        <div className="relative w-full max-w-xs aspect-[111/226] rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(44,65,89,0.2)] border border-[var(--border-default)]">
          <img
            key={frameIndex}
            src={CHARACTER_LOADING_FRAMES[frameIndex]}
            alt="사주를 분석 중인 명리사 캐릭터"
            className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-500"
          />
        </div>
        <ProgressBlock progress={progress} tip={LOADING_TIPS[tipIndex]} loadingText={loadingText} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 min-h-[50vh] animate-in fade-in duration-500 text-center">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute inset-0 border border-[var(--brand-primary)]/30 rounded-full animate-orbit">
          <div className="absolute -top-1 left-1/2 w-2.5 h-2.5 bg-[var(--brand-primary)] rounded-full shadow-[0_0_10px_var(--brand-primary)]"></div>
        </div>
        <div className="absolute inset-3 border border-[#6b3eb0]/40 rounded-full animate-orbit" style={{ animationDirection: "reverse", animationDuration: "15s" }}></div>
        <Compass size={36} className="text-[var(--brand-primary)] animate-pulse" />
      </div>
      <ProgressBlock progress={progress} tip={LOADING_TIPS[tipIndex]} loadingText={loadingText} />
    </div>
  );
}

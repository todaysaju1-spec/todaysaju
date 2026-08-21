"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import type { ClientTenantTheme } from "./types";

type LandingHeroProps = {
  isRealUser: boolean;
  userName: string | null;
  tenantTheme: ClientTenantTheme | null;
  onStartFree: () => void;
  onLogin: () => void;
  onContinueAsUser: () => void;
  onLogout: () => void;
};

// 🎬 [씬 1] 랜딩페이지 대문 — 히어로 이미지/타이틀 + CTA.
// 실제 계정으로 로그인된 상태면 버튼 한 번으로 바로 입력 화면으로 이동하고,
// 그 외(비로그인/게스트)는 버튼을 누르면 "무료로 보기 / 로그인" 두 선택지가 나타난다.
export default function LandingHero({
  isRealUser,
  userName,
  tenantTheme,
  onStartFree,
  onLogin,
  onContinueAsUser,
  onLogout,
}: LandingHeroProps) {
  const [showChoice, setShowChoice] = useState(false);
  const isCharacterTheme = tenantTheme?.mode === "character" && !!tenantTheme.characterHeroImageUrl;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 text-center">
      {isCharacterTheme ? (
        <div className="flex justify-center">
          <img
            src={tenantTheme!.characterHeroImageUrl!}
            alt="오늘의사주 명리사 캐릭터"
            className="w-full max-w-xs rounded-3xl object-cover shadow-[0_0_30px_rgba(217,119,87,0.25)] border border-[var(--border-default)]"
          />
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 bg-[var(--bg-hover)] border border-[var(--brand-primary)]/30 px-5 py-2.5 rounded-full">
          <Gift size={18} className="text-[var(--brand-primary)]" />
          <span className="text-sm font-bold text-[var(--brand-primary)]">매일 접속 시 '오늘의 종합사주' 1회 무료!</span>
        </div>
      )}

      <div className="space-y-5 pt-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-light leading-snug text-[var(--text-body)] tracking-wide pt-2 break-keep">
          <span className="inline-block">나의 가장 궁금한 답</span><br />
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-primary-hover)] to-[var(--brand-primary)] inline-block mt-2">사주에서 찾습니다</span>
        </h1>

        <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed pt-3">
          복잡한 회원가입 없이 단 1초 만에 시작하세요.<br />
          지금 시작하면 심층 풀이용 <span className="text-[var(--brand-primary)] font-bold text-lg">스탠다드 패스 1장</span>을 드립니다.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 mt-8 w-full">
        {isRealUser && (
          <div className="text-[var(--text-on-brand)] font-bold text-base bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-soft)] px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)] animate-in fade-in zoom-in duration-500">
            ✨ {userName || "고객"}님, 환영합니다!
          </div>
        )}

        {isRealUser ? (
          <button
            onClick={onContinueAsUser}
            className="w-full sm:w-auto sm:px-16 py-4 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] font-extrabold rounded-2xl text-lg shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all hover:scale-[1.02]"
          >
            지금 운세 보기
          </button>
        ) : !showChoice ? (
          <button
            onClick={() => setShowChoice(true)}
            className="w-full sm:w-auto sm:px-16 py-4 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] font-extrabold rounded-2xl text-lg shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all hover:scale-[1.02]"
          >
            지금 운세 보기
          </button>
        ) : (
          <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={onStartFree}
              className="w-full py-4 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] font-extrabold rounded-2xl text-lg shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all hover:scale-[1.02]"
            >
              무료로 오늘의 운세보기
            </button>
            <button
              onClick={onLogin}
              className="w-full py-4 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-alt)] border border-[var(--brand-primary)]/50 hover:border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold rounded-2xl text-base transition-all"
            >
              로그인
            </button>
          </div>
        )}

        {isRealUser && (
          <button
            onClick={onLogout}
            className="text-xs text-[var(--text-muted)] underline hover:text-[var(--text-body)] transition-colors"
          >
            다른 계정으로 로그인 (로그아웃)
          </button>
        )}
      </div>
    </div>
  );
}

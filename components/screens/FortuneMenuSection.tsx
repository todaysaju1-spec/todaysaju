"use client";

export type FortuneMenuItem = {
  icon: string;
  title: string;
  desc: string;
  isFree?: boolean;
};

type FortuneMenuSectionProps = {
  fortuneMenuItems: FortuneMenuItem[];
  isAnyActionLoading: boolean;
  isCharacterTheme?: boolean;
  onOpenFreeManseryeok: () => void;
  onPremiumClick: () => void;
  onFortuneMenuClick: (item: FortuneMenuItem) => void;
};

// 캐릭터 테마에서 일부 메뉴 카드는 이모지 대신 명리사 캐릭터 아바타를 보여준다
// (준비된 아바타 5종에 해당하는 카테고리만 — 나머지는 그대로 이모지 아이콘 사용)
const CATEGORY_AVATARS: Record<string, string> = {
  "오늘의 운세": "/character/result-total.webp",
  "금전/재물": "/character/result-money.webp",
  "연애/가족": "/character/result-love.webp",
  "직업운": "/character/result-job.webp",
  "건강운": "/character/result-health.webp",
};

// 무료 만세력 + 프리미엄 사주 + 운세 메뉴 그리드.
// step이 "analyzing"이 아닌 동안(입력/결과 화면 모두) 계속 노출되는 공용 섹션.
export default function FortuneMenuSection({
  fortuneMenuItems,
  isAnyActionLoading,
  isCharacterTheme,
  onOpenFreeManseryeok,
  onPremiumClick,
  onFortuneMenuClick,
}: FortuneMenuSectionProps) {
  return (
    <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10 pb-10">
      <div className="text-center">
        <h3 className="text-xl font-bold text-[var(--text-body)] mb-6">지금 궁금한 운세를 선택하세요</h3>

        {/* 📊 무료 만세력 대형 버튼 */}
        <div className="mb-4 relative z-20">
          <button
            type="button"
            onClick={onOpenFreeManseryeok}
            disabled={isAnyActionLoading}
            className="w-full bg-gradient-to-r from-[var(--bg-muted)] to-[var(--bg-elevated-alt)] border-2 border-red-500/50 p-6 rounded-3xl text-left relative z-20 overflow-hidden group hover:border-red-400 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute top-0 right-0 bg-red-500 text-white font-extrabold text-[10px] px-3 py-1 rounded-bl-xl z-30">
              🎁 무료
            </div>
            <div className="flex items-center gap-3 relative z-30 pr-16">
              <div className="text-3xl">📊</div>
              <div>
                <div className="text-[var(--text-body)] font-bold text-lg">내 사주 명식표 무료로 바로 보기</div>
                <div className="text-[var(--text-muted)] text-xs mt-1">
                  나의 타고난 오행, 십성, 대운/세운의 흐름을 전문가용 차트로 한눈에 확인하세요.
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* 👑 프리미엄 사주 버튼 (비회원/회원 분기 처리 완료) */}
        <div className="mb-6 relative z-20">
          <button
            onClick={onPremiumClick}
            className="w-full bg-gradient-to-r from-[var(--border-strong)] to-[var(--bg-muted)] border-2 border-[var(--brand-primary)] p-6 rounded-3xl text-left relative z-20 overflow-hidden group hover:border-[var(--brand-primary-soft)] transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isAnyActionLoading}
          >
            <div className="absolute top-0 right-0 bg-[var(--brand-primary)] text-[var(--text-on-brand)] font-extrabold text-[10px] px-3 py-1 rounded-bl-xl z-30">BEST</div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/50 px-2 py-0.5 rounded-md shadow-sm z-30">
              <span className="text-[10px] font-bold text-[var(--brand-primary)]">👑 1장</span>
            </div>
            <div className="flex items-center gap-3 relative z-30 pr-16">
              <div className="text-3xl">👑</div>
              <div>
                <div className="text-[var(--text-body)] font-bold text-lg">프리미엄 총 사주운세</div>
                <div className="text-[var(--text-muted)] text-xs mt-1">인생 총평 + 재물/직업 + 연애/가족 + 건강/행운 프리미엄 정밀 분석</div>
              </div>
            </div>
          </button>
        </div>

        {/* 운세 메뉴 그리드 (유료 테마) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {fortuneMenuItems.map((item) => {
            const avatarUrl = isCharacterTheme ? CATEGORY_AVATARS[item.title] : undefined;
            return (
              <button
                key={item.title}
                onClick={() => onFortuneMenuClick(item)}
                disabled={isAnyActionLoading}
                className="p-3.5 sm:p-4 bg-[var(--bg-surface)]/50 border border-[var(--border-default)] rounded-2xl hover:bg-[var(--bg-hover)] hover:border-[var(--brand-primary)] transition-all text-left group shadow-lg flex flex-col justify-start relative disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute top-2 right-2 z-10">
                  {item.isFree ? (
                    <span className="text-[10px] font-bold text-white bg-red-500/80 px-2 py-0.5 rounded-md shadow-sm">
                      🎁 무료
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--brand-primary)] bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/50 px-2 py-0.5 rounded-md shadow-sm">
                      🎟️ 1장
                    </span>
                  )}
                </div>

                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={item.title}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-[var(--brand-primary)]/40 mb-2 sm:mb-2.5 relative z-10"
                  />
                ) : (
                  <div className="text-2xl mb-2 sm:mb-2.5 relative z-10">{item.icon}</div>
                )}
                <div className="font-bold text-[var(--text-body)] group-hover:text-[var(--brand-primary)] text-[13px] sm:text-sm md:text-base break-keep leading-snug relative z-10">
                  {item.title}
                </div>
                <div className="text-[10px] sm:text-[11px] md:text-xs text-[var(--text-muted)] mt-1 sm:mt-1.5 break-keep leading-tight relative z-10">
                  {item.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

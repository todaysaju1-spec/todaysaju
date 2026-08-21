"use client";

import ButtonSpinner from "@/components/ButtonSpinner";

type LoginChoiceModalProps = {
  onClose: () => void;
  onKakao: () => void;
  onGoogle: () => void;
  onEmail: () => void;
  isKakaoLoading: boolean;
  isGoogleLoading: boolean;
  isAnyActionLoading: boolean;
};

// "지금 운세 보기" 버튼을 누르면 뜨는 로그인 방법 선택 모달.
export default function LoginChoiceModal({
  onClose,
  onKakao,
  onGoogle,
  onEmail,
  isKakaoLoading,
  isGoogleLoading,
  isAnyActionLoading,
}: LoginChoiceModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-5 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/50 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-body)] text-xl leading-none"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold text-[var(--text-body)] text-center mb-1">로그인하고 시작하기</h3>
        <p className="text-xs text-[var(--text-muted)] text-center mb-6">1초 만에 가입 없이 바로 시작하세요.</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onKakao}
            disabled={isAnyActionLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] text-lg font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(254,229,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isKakaoLoading ? (
              <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3C6.477 3 2 6.425 2 10.648c0 2.706 1.706 5.07 4.3 6.355-.26.965-1.01 3.76-1.04 3.882-.04.144.05.155.12.11 1.05-.67 4.12-2.82 4.12-2.82.82.16 1.66.25 2.5.25 5.523 0 10-3.425 10-7.648C22 6.425 17.523 3 12 3z" fill="#000000"/>
                </svg>
                <span>카카오로 1초 만에 시작</span>
              </>
            )}
          </button>

          <button
            onClick={onGoogle}
            disabled={isAnyActionLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 text-lg font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google 계정으로 시작</span>
              </>
            )}
          </button>

          <button
            onClick={onEmail}
            className="w-full flex items-center justify-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-alt)] border border-[var(--brand-primary)]/50 hover:border-[var(--brand-primary)] text-[var(--brand-primary)] text-sm font-bold py-3.5 rounded-xl transition-all shadow-[0_0_10px_rgba(212,175,55,0.08)]"
          >
            <span>✉️</span>
            <span>이메일 계정으로 시작</span>
          </button>
        </div>
      </div>
    </div>
  );
}

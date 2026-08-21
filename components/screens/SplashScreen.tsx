"use client";

type SplashScreenProps = {
  heroImageUrl: string;
  onEnter: () => void;
};

// 🎬 [씬 0] 캐릭터 테마 전용 풀스크린 스플래시.
// 헤더/메뉴 없이 히어로 포스터 이미지만 화면 전체에 꽉 차게 보여주고,
// 포스터 아무 곳이나 탭하면 일반 화면(헤더+실제 CTA 버튼+운세 메뉴)으로 넘어간다.
export default function SplashScreen({ heroImageUrl, onEnter }: SplashScreenProps) {
  return (
    <button
      type="button"
      onClick={onEnter}
      aria-label="지금 운세 보기"
      className="w-full min-h-screen flex items-center justify-center bg-[var(--bg-base)] cursor-pointer p-0 border-0"
    >
      <img
        src={heroImageUrl}
        alt="오늘의사주 명리사 캐릭터 — 탭하여 시작하기"
        className="w-full h-screen object-cover animate-in fade-in duration-700"
      />
    </button>
  );
}

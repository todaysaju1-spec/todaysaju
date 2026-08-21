"use client";

type MysticalSplashProps = {
  variant: "dark" | "light";
  onEnter: () => void;
};

// 🎬 [씬 0] 다크/라이트 테마 전용 풀스크린 스플래시.
// 캐릭터 이미지 대신, 회전하는 풍수 나침반 + 움직이는 별자리를 SVG/CSS 애니메이션으로 그린다.
// 이미지가 아니라 코드로 그리기 때문에 나중에 고객 취향에 따라 색/배경만 바꿔서 재사용하기 쉽다.
export default function MysticalSplash({ variant, onEnter }: MysticalSplashProps) {
  const isDark = variant === "dark";

  const bg = isDark
    ? "radial-gradient(circle at 50% 38%, #2a0b4c 0%, #12052a 45%, #05020c 100%)"
    : "radial-gradient(ellipse at 50% 30%, #E7EAF0 0%, #C9CFD9 45%, #9AA3B2 100%)";
  const ringColor = isDark ? "#D4AF37" : "#3A4257";
  const starColor = isDark ? "#F3E5AB" : "#5B6478";
  const textColor = isDark ? "#F3E5AB" : "#2B3242";

  // 별자리 클러스터 몇 개를 나침반 주변에 흩뿌려 둔다 (좌표는 % 기준, 화면 크기에 상관없이 배치됨)
  const constellations = [
    { cx: 18, cy: 22, scale: 1, points: [[0, 0], [14, -8], [26, 2], [40, -10]] },
    { cx: 78, cy: 18, scale: 0.85, points: [[0, 10], [10, -4], [22, 6], [30, -6]] },
    { cx: 82, cy: 72, scale: 1.1, points: [[0, 0], [-12, 10], [-2, 20], [-18, 26]] },
    { cx: 14, cy: 76, scale: 0.9, points: [[0, 0], [16, 6], [10, 20], [26, 18]] },
  ];

  return (
    <button
      type="button"
      onClick={onEnter}
      aria-label="지금 운세 보기"
      className="w-full min-h-screen relative overflow-hidden flex flex-col items-center justify-center cursor-pointer p-0 border-0"
      style={{ background: bg }}
    >
      <style>{`
        @keyframes mystical-spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mystical-spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes mystical-twinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        @keyframes mystical-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        .mystical-ring-outer { animation: mystical-spin-cw 90s linear infinite; transform-origin: 50% 50%; }
        .mystical-ring-mid { animation: mystical-spin-ccw 60s linear infinite; transform-origin: 50% 50%; }
        .mystical-needle { animation: mystical-spin-cw 40s linear infinite; transform-origin: 50% 50%; }
        .mystical-star { animation: mystical-twinkle 3.5s ease-in-out infinite; }
        .mystical-constellations { animation: mystical-spin-ccw 160s linear infinite; transform-origin: 50% 50%; }
        .mystical-hint { animation: mystical-pulse 2.4s ease-in-out infinite; }
      `}</style>

      {/* 은은한 안개/별빛 레이어 */}
      {isDark && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => {
            const size = Math.random() * 2 + 1;
            return (
              <div
                key={i}
                className="mystical-star absolute rounded-full"
                style={{
                  width: size,
                  height: size,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  background: starColor,
                  animationDelay: `${Math.random() * 3}s`,
                  boxShadow: `0 0 6px ${starColor}`,
                }}
              />
            );
          })}
        </div>
      )}
      {!isDark && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* 수묵화 느낌의 겹쳐진 산 실루엣 — 멀수록 옅고 흐리게, 가까울수록 짙고 또렷하게 */}
          <path
            d="M0,60 Q15,40 28,52 T55,44 T80,54 T100,46 L100,100 L0,100 Z"
            fill="#8892A3"
            opacity="0.18"
            style={{ filter: "blur(4px)" }}
          />
          <path
            d="M0,72 Q20,52 38,64 T68,56 T100,66 L100,100 L0,100 Z"
            fill="#6B7690"
            opacity="0.28"
            style={{ filter: "blur(3px)" }}
          />
          <path
            d="M0,86 Q22,68 42,80 T78,70 T100,82 L100,100 L0,100 Z"
            fill="#4A5468"
            opacity="0.4"
            style={{ filter: "blur(2px)" }}
          />
        </svg>
      )}

      {/* 나침반 주변을 도는 별자리 레이어 */}
      <svg
        viewBox="0 0 100 100"
        className="mystical-constellations absolute inset-0 w-full h-full pointer-events-none"
      >
        {constellations.map((c, i) => (
          <g key={i} stroke={starColor} strokeWidth="0.15" opacity="0.8">
            {c.points.slice(1).map((p, j) => (
              <line
                key={j}
                x1={c.cx + c.points[j][0] * c.scale * 0.3}
                y1={c.cy + c.points[j][1] * c.scale * 0.3}
                x2={c.cx + p[0] * c.scale * 0.3}
                y2={c.cy + p[1] * c.scale * 0.3}
              />
            ))}
            {c.points.map((p, j) => (
              <circle
                key={j}
                className="mystical-star"
                cx={c.cx + p[0] * c.scale * 0.3}
                cy={c.cy + p[1] * c.scale * 0.3}
                r="0.6"
                fill={starColor}
                style={{ animationDelay: `${(i + j) * 0.4}s` }}
              />
            ))}
          </g>
        ))}
      </svg>

      {/* 중앙 풍수 나침반 */}
      <svg viewBox="0 0 200 200" className="relative w-56 h-56 sm:w-72 sm:h-72" style={{ overflow: "visible" }}>
        {/* 바깥 링: 24방위 눈금 */}
        <g className="mystical-ring-outer">
          <circle cx="100" cy="100" r="92" fill="none" stroke={ringColor} strokeWidth="1" opacity="0.5" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * 360;
            return (
              <line
                key={i}
                x1="100"
                y1="10"
                x2="100"
                y2="20"
                stroke={ringColor}
                strokeWidth="1.2"
                opacity="0.6"
                transform={`rotate(${angle} 100 100)`}
              />
            );
          })}
        </g>

        {/* 중간 링: 팔괘 자리 표시 */}
        <g className="mystical-ring-mid">
          <circle cx="100" cy="100" r="66" fill="none" stroke={ringColor} strokeWidth="1" opacity="0.55" />
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * 360;
            const broken = i % 3 === 0;
            return (
              <g key={i} transform={`rotate(${angle} 100 100)`}>
                {broken ? (
                  <>
                    <line x1="94" y1="36" x2="98" y2="36" stroke={ringColor} strokeWidth="1.4" opacity="0.7" />
                    <line x1="102" y1="36" x2="106" y2="36" stroke={ringColor} strokeWidth="1.4" opacity="0.7" />
                  </>
                ) : (
                  <line x1="94" y1="36" x2="106" y2="36" stroke={ringColor} strokeWidth="1.4" opacity="0.7" />
                )}
              </g>
            );
          })}
        </g>

        {/* 안쪽 고정 링 */}
        <circle cx="100" cy="100" r="40" fill="none" stroke={ringColor} strokeWidth="1" opacity="0.5" />

        {/* 회전하는 바늘 */}
        <g className="mystical-needle">
          <line x1="100" y1="100" x2="100" y2="58" stroke={ringColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="100" y1="100" x2="100" y2="142" stroke={ringColor} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </g>

        {/* 중심 태극 */}
        <circle cx="100" cy="100" r="10" fill="none" stroke={ringColor} strokeWidth="1.5" />
        <path
          d="M100,90 A10,10 0 0,1 100,110 A5,5 0 0,1 100,100 A5,5 0 0,0 100,90 Z"
          fill={ringColor}
          opacity="0.85"
        />
      </svg>

      <p
        className="mystical-hint mt-10 text-sm sm:text-base font-medium tracking-wide"
        style={{ color: textColor }}
      >
        지금 운세 보기
      </p>
    </button>
  );
}

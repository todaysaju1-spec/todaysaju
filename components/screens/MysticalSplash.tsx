"use client";

type MysticalSplashProps = {
  variant: "dark" | "light";
  onEnter: () => void;
};

// 나경(패철)의 실제 24방위 순서 — 12지지 + 8천간 + 4유(간·손·곤·건)를 시계방향으로 배치
const DIRECTIONS_24 = [
  "子", "癸", "丑", "艮", "寅", "甲", "卯", "乙", "辰", "巽", "巳", "丙",
  "午", "丁", "未", "坤", "申", "庚", "酉", "辛", "戌", "乾", "亥", "壬",
];

// 중앙 아이콘 주변을 도는 작은 별자리 점들 — 몇 개만 색을 다르게 줘서 포인트를 준다
const INNER_STARS = [
  { angle: 15, r: 46, color: null },
  { angle: 48, r: 44, color: "#4A90D9" },
  { angle: 82, r: 47, color: null },
  { angle: 118, r: 45, color: null },
  { angle: 152, r: 46, color: "#3DB88B" },
  { angle: 190, r: 44, color: null },
  { angle: 222, r: 47, color: null },
  { angle: 258, r: 45, color: "#D9574A" },
  { angle: 296, r: 46, color: null },
  { angle: 332, r: 44, color: null },
];

// 🎬 [씬 0] 다크/라이트 테마 전용 풀스크린 스플래시.
// 캐릭터 이미지 대신, 실제 24방위 나경(풍수 나침반)을 SVG/CSS 애니메이션으로 그린다.
// 이미지가 아니라 코드로 그리기 때문에 나중에 색상/배경만 바꿔서 다른 무드로 재사용하기 쉽다.
export default function MysticalSplash({ variant, onEnter }: MysticalSplashProps) {
  const isDark = variant === "dark";

  const bg = isDark
    ? "radial-gradient(circle at 50% 42%, #1a0f05 0%, #0d0803 45%, #030201 100%)"
    : "radial-gradient(ellipse at 50% 30%, #E7EAF0 0%, #C9CFD9 45%, #9AA3B2 100%)";
  const ringColor = isDark ? "#C9922E" : "#3A4257";
  const glowColor = isDark ? "#F0B23A" : "transparent";
  const textColor = isDark ? "#F0D9A8" : "#2B3242";
  const dotColor = isDark ? "#E3B95C" : "#6B7690";

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
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes mystical-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        .mystical-ring-outer { animation: mystical-spin-cw 140s linear infinite; transform-origin: 50% 50%; }
        .mystical-ring-hanja { animation: mystical-spin-ccw 100s linear infinite; transform-origin: 50% 50%; }
        .mystical-ring-inner { animation: mystical-spin-cw 70s linear infinite; transform-origin: 50% 50%; }
        .mystical-needle { animation: mystical-spin-cw 45s linear infinite; transform-origin: 50% 50%; }
        .mystical-star { animation: mystical-twinkle 3.2s ease-in-out infinite; }
        .mystical-hint { animation: mystical-pulse 2.4s ease-in-out infinite; }
      `}</style>

      {/* 은은한 격자 텍스처 (구석에서만 살짝 보이도록) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(${ringColor} 1px, transparent 1px), linear-gradient(90deg, ${ringColor} 1px, transparent 1px)`,
          backgroundSize: "34px 34px",
        }}
      />

      {isDark && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 36 }).map((_, i) => {
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
                  background: textColor,
                  animationDelay: `${Math.random() * 3}s`,
                  boxShadow: `0 0 6px ${textColor}`,
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
          <path d="M0,60 Q15,40 28,52 T55,44 T80,54 T100,46 L100,100 L0,100 Z" fill="#8892A3" opacity="0.18" style={{ filter: "blur(4px)" }} />
          <path d="M0,72 Q20,52 38,64 T68,56 T100,66 L100,100 L0,100 Z" fill="#6B7690" opacity="0.28" style={{ filter: "blur(3px)" }} />
          <path d="M0,86 Q22,68 42,80 T78,70 T100,82 L100,100 L0,100 Z" fill="#4A5468" opacity="0.4" style={{ filter: "blur(2px)" }} />
        </svg>
      )}

      {/* 중앙 나경(풍수 나침반) */}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          boxShadow: isDark ? `0 0 90px 20px ${glowColor}22, 0 0 40px ${glowColor}33 inset` : undefined,
        }}
      >
        <svg viewBox="0 0 200 200" className="relative w-64 h-64 sm:w-80 sm:h-80" style={{ overflow: "visible" }}>
          <defs>
            <radialGradient id="compassGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={glowColor} stopOpacity={isDark ? 0.35 : 0} />
              <stop offset="70%" stopColor={glowColor} stopOpacity={isDark ? 0.08 : 0} />
              <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {isDark && <circle cx="100" cy="100" r="98" fill="url(#compassGlow)" />}

          {/* 바탕 원반 */}
          <circle cx="100" cy="100" r="92" fill={isDark ? "#0d0703" : "none"} opacity={isDark ? 0.55 : 0} />

          {/* 바깥 링: 눈금 */}
          <g className="mystical-ring-outer">
            <circle cx="100" cy="100" r="92" fill="none" stroke={ringColor} strokeWidth="1" opacity="0.6" />
            {Array.from({ length: 48 }).map((_, i) => (
              <line
                key={i}
                x1="100" y1="8" x2="100" y2={i % 2 === 0 ? "16" : "13"}
                stroke={ringColor} strokeWidth="0.8" opacity="0.55"
                transform={`rotate(${(i / 48) * 360} 100 100)`}
              />
            ))}
          </g>

          {/* 24방위 한자 링 */}
          <g className="mystical-ring-hanja">
            <circle cx="100" cy="100" r="78" fill="none" stroke={ringColor} strokeWidth="0.6" opacity="0.4" />
            {DIRECTIONS_24.map((char, i) => (
              <text
                key={i}
                x="100"
                y="27"
                textAnchor="middle"
                fontSize="8.5"
                fill={ringColor}
                opacity="0.85"
                style={{ fontFamily: "serif" }}
                transform={`rotate(${(i / 24) * 360} 100 100)`}
              >
                {char}
              </text>
            ))}
          </g>

          {/* 안쪽 별자리 점 링 */}
          <g className="mystical-ring-inner">
            <circle cx="100" cy="100" r="56" fill="none" stroke={ringColor} strokeWidth="0.5" opacity="0.35" />
            {INNER_STARS.map((s, i) => {
              const rad = (s.angle * Math.PI) / 180;
              const x = 100 + s.r * Math.cos(rad);
              const y = 100 + s.r * Math.sin(rad);
              const next = INNER_STARS[(i + 1) % INNER_STARS.length];
              const nRad = (next.angle * Math.PI) / 180;
              const nx = 100 + next.r * Math.cos(nRad);
              const ny = 100 + next.r * Math.sin(nRad);
              return (
                <g key={i}>
                  <line x1={x} y1={y} x2={nx} y2={ny} stroke={ringColor} strokeWidth="0.3" opacity="0.3" />
                  <circle
                    className="mystical-star"
                    cx={x} cy={y} r={s.color ? "2.6" : "1.6"}
                    fill={s.color || dotColor}
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                </g>
              );
            })}
          </g>

          {/* 회전하는 바늘 */}
          <g className="mystical-needle">
            <line x1="100" y1="100" x2="100" y2="46" stroke={ringColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
            <line x1="100" y1="100" x2="100" y2="154" stroke={ringColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
          </g>

          {/* 중심 원반 + 지붕(명당) 아이콘 */}
          <circle cx="100" cy="100" r="34" fill={isDark ? "#120a04" : "#EEF0F3"} stroke={ringColor} strokeWidth="1.2" opacity="0.9" />
          <g transform="translate(100 100)" fill={ringColor} opacity="0.95">
            <path d="M-16,6 L-16,14 L16,14 L16,6 L18,6 L0,-14 L-18,6 Z" />
            <rect x="-3" y="6" width="6" height="8" fill={isDark ? "#120a04" : "#EEF0F3"} />
          </g>
        </svg>
      </div>

      <p className="mystical-hint mt-10 text-sm sm:text-base font-medium tracking-wide" style={{ color: textColor }}>
        지금 운세 보기
      </p>
    </button>
  );
}

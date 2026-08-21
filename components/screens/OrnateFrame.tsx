"use client";

import type { ReactNode } from "react";

type OrnateFrameProps = {
  size?: "lg" | "sm";
  className?: string;
  /** false면 장식 없이 children만 그대로 렌더링 (다른 테마에서 이 컴포넌트를 그대로 써도 무해하도록) */
  active?: boolean;
  children: ReactNode;
};

// 전통 나경/한복 소품에서 보이는 이중 테두리 + 모서리 장식 프레임.
// 순수 CSS(테두리 겹침)로만 그려서 캐릭터 테마의 브랜드 컬러(var(--brand-primary))를
// 그대로 따라간다 — 지금은 캐릭터 테마의 동양화/한복 분위기에 맞춰 그 화면들에서만
// active={true}로 켜서 쓴다.
export default function OrnateFrame({ size = "lg", className = "", active = true, children }: OrnateFrameProps) {
  if (!active) return <>{children}</>;

  const inset = size === "lg" ? 5 : 3;
  const corner = size === "lg" ? 12 : 8;
  const borderW = size === "lg" ? 2 : 1.5;

  const cornerStyle = (pos: "tl" | "tr" | "bl" | "br"): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      width: corner,
      height: corner,
      pointerEvents: "none",
    };
    if (pos === "tl") return { ...base, top: -1, left: -1, borderTop: `${borderW}px solid var(--brand-primary)`, borderLeft: `${borderW}px solid var(--brand-primary)` };
    if (pos === "tr") return { ...base, top: -1, right: -1, borderTop: `${borderW}px solid var(--brand-primary)`, borderRight: `${borderW}px solid var(--brand-primary)` };
    if (pos === "bl") return { ...base, bottom: -1, left: -1, borderBottom: `${borderW}px solid var(--brand-primary)`, borderLeft: `${borderW}px solid var(--brand-primary)` };
    return { ...base, bottom: -1, right: -1, borderBottom: `${borderW}px solid var(--brand-primary)`, borderRight: `${borderW}px solid var(--brand-primary)` };
  };

  return (
    <div className={`relative ${className}`}>
      {/* 안쪽 이중 테두리 라인 */}
      <div
        className="absolute pointer-events-none"
        style={{ inset, border: "1px solid var(--brand-primary)", opacity: 0.6 }}
      />
      {/* 네 모서리 장식 */}
      <div style={cornerStyle("tl")} />
      <div style={cornerStyle("tr")} />
      <div style={cornerStyle("bl")} />
      <div style={cornerStyle("br")} />
      {children}
    </div>
  );
}

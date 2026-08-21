"use client";

import type { ReactNode } from "react";

type OrnateFrameProps = {
  size?: "lg" | "sm";
  className?: string;
  /** false면 장식 없이 children만 그대로 렌더링 (다른 테마에서 이 컴포넌트를 그대로 써도 무해하도록) */
  active?: boolean;
  children: ReactNode;
};

// 창호지문(한지 창살문) 느낌의 액자형 프레임 — 각진 테두리 안에 격자 살 무늬가 은은하게
// 비치는 "매트"가 있고, 그 안에 기존 카드(둥근 모서리 그대로)가 놓인다. 이렇게 하면
// 안쪽 카드의 둥근 모서리와 바깥 테두리가 서로 부딪히지 않는다(액자 매트 안에 놓인
// 둥근 사진 같은 느낌). 격자/테두리 색은 var(--brand-primary) 토큰을 그대로 쓴다.
export default function OrnateFrame({ size = "lg", className = "", active = true, children }: OrnateFrameProps) {
  if (!active) return <>{children}</>;

  const mat = size === "lg" ? 7 : 4;
  const lattice = size === "lg" ? 13 : 9;
  const latticeLine = "color-mix(in srgb, var(--brand-primary) 45%, transparent)";

  return (
    <div
      className={`relative rounded-md ${className}`}
      style={{
        padding: mat,
        border: "1.5px solid var(--brand-primary)",
        backgroundImage: `repeating-linear-gradient(${latticeLine} 0 1px, transparent 1px ${lattice}px), repeating-linear-gradient(90deg, ${latticeLine} 0 1px, transparent 1px ${lattice}px)`,
        backgroundColor: "var(--bg-base)",
      }}
    >
      {children}
    </div>
  );
}

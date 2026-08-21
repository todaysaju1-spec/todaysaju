"use client";

import type { ReactNode } from "react";

type OrnateFrameProps = {
  size?: "lg" | "sm";
  className?: string;
  /** false면 장식 없이 children만 그대로 렌더링 (다른 테마에서 이 컴포넌트를 그대로 써도 무해하도록) */
  active?: boolean;
  children: ReactNode;
};

// 전통 현판(懸板) 느낌의 이중 테두리 액자 프레임 — 짙은 남색 판(브랜드 컬러) 매트 안에
// 얇은 골드 테두리를 한 번 더 두르고, 그 안에 기존 카드(둥근 모서리 그대로)가 놓인다.
// 안쪽 카드의 둥근 모서리와 바깥 액자가 서로 부딪히지 않도록, 매트에는 여백만 주고
// 별도 모서리 장식은 넣지 않는다. 색은 var(--brand-primary)/var(--text-on-brand) 토큰을
// 그대로 쓰므로 새 테마를 추가해도 이 컴포넌트는 손댈 필요가 없다.
export default function OrnateFrame({ size = "lg", className = "", active = true, children }: OrnateFrameProps) {
  if (!active) return <>{children}</>;

  const mat = size === "lg" ? 6 : 4;
  const innerBorder = size === "lg" ? 5 : 3;

  return (
    <div
      className={`relative rounded-md ${className}`}
      style={{
        padding: mat,
        backgroundColor: "var(--brand-primary)",
      }}
    >
      <div
        className="absolute rounded-[3px] pointer-events-none"
        style={{ inset: innerBorder, border: "1px solid var(--text-on-brand)", opacity: 0.55 }}
      />
      {children}
    </div>
  );
}

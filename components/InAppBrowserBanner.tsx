"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { isDismissedWithinMs, markDismissedNow } from "@/lib/safe-storage";

const IN_APP_BANNER_DISMISS_KEY = "in_app_browser_banner_dismissed_at";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

function isInAppBrowser() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  return /KAKAOTALK|Instagram|FBAN|FBAV|Line\//i.test(ua);
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InAppBrowserBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneMode() || isDismissedWithinMs(IN_APP_BANNER_DISMISS_KEY, DISMISS_DURATION_MS)) {
      return;
    }
    if (isInAppBrowser()) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    markDismissedNow(IN_APP_BANNER_DISMISS_KEY);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="sticky top-0 z-[60] w-full bg-[#1a0b2e]/95 border-b border-[#D4AF37]/40 backdrop-blur-md px-3 py-2.5">
      <div className="max-w-6xl mx-auto flex items-start gap-2">
        <p className="flex-1 text-[11px] sm:text-xs text-gray-200 leading-relaxed">
          안정적인 서비스를 위해{" "}
          <strong className="text-[#FACC15]">[우측 상단 메뉴 ➡️ 다른 브라우저(크롬/사파리)로 열기]</strong>
          를 눌러주세요.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="안내 닫기"
          className="shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

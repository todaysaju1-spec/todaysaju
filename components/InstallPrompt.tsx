"use client";

import { useEffect, useState } from "react";
import { X, Share, Plus } from "lucide-react";
import { isDismissedWithinMs, markDismissedNow } from "@/lib/safe-storage";

const DISMISS_STORAGE_KEY = "install_prompt_dismissed_at";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOSDevice() {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isDismissedRecently() {
  return isDismissedWithinMs(DISMISS_STORAGE_KEY, DISMISS_DURATION_MS);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (isStandaloneMode() || isDismissedRecently()) return;

    const ios = isIOSDevice();
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (ios) {
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    markDismissedNow(DISMISS_STORAGE_KEY);
    setVisible(false);
    setShowIOSGuide(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error("PWA 설치 프롬프트 에러:", error);
    }
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 md:left-auto md:right-6 md:max-w-md">
        <div className="relative flex items-center gap-3 rounded-2xl border border-yellow-500/50 bg-purple-950/90 backdrop-blur-md px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-snug">
              ✨ [오늘의사주] 홈 화면에 추가하고
            </p>
            <p className="text-xs text-yellow-200/90 mt-0.5">매일 무료 운세 보기</p>
          </div>

          <button
            type="button"
            onClick={handleInstall}
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F0D060] px-3.5 py-2 text-xs font-extrabold text-[#120524] hover:brightness-110 transition-all shadow-md"
          >
            홈에 추가
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="닫기"
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIOSGuide(false)}
          />

          <div className="relative mx-4 mb-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="mx-auto mb-3 flex justify-center">
              <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#D4AF37]" />
            </div>

            <div className="rounded-2xl border border-yellow-500/50 bg-purple-950/95 backdrop-blur-md p-5 shadow-2xl">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
                aria-label="안내 닫기"
              >
                <X size={18} />
              </button>

              <h3 className="text-base font-bold text-[#D4AF37] mb-3 pr-6">
                iPhone 홈 화면 추가 방법
              </h3>

              <div className="space-y-3 text-sm text-gray-200 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                    <Share size={14} className="text-[#D4AF37]" />
                  </span>
                  <span>
                    하단 <strong className="text-white">공유 버튼(📤)</strong>을 눌러 주세요
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                    <Plus size={14} className="text-[#D4AF37]" />
                  </span>
                  <span>
                    메뉴에서 <strong className="text-white">[홈 화면에 추가 ➕]</strong>를 선택해 주세요!
                  </span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-yellow-500/20 text-center">
                <p className="text-xs text-gray-400 animate-bounce">
                  ↓ Safari 하단 공유 버튼을 확인해 주세요
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

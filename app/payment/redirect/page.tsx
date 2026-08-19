"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { safeSessionGetJSON, safeSessionRemoveItem } from "@/lib/safe-storage";

const DEFAULT_PACKAGE_ID = "std-1";

type PendingPackage = {
  id: string;
  category: "standard" | "premium";
  price: number;
  tickets: number;
  label: string;
};

function resolvePendingPackageId(): string {
  const pkg = safeSessionGetJSON<PendingPackage | null>("pending_payment_package", null);
  return pkg?.id || DEFAULT_PACKAGE_ID;
}

function PaymentRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleRedirect = async () => {
      const paymentId = searchParams.get("paymentId");
      const code = searchParams.get("code");
      const message = searchParams.get("message") || "";

      if (code) {
        const isCancelled =
          code === "FAILURE_TYPE_USER_CANCEL" ||
          message.includes("취소") ||
          message.toLowerCase().includes("cancel");

        if (isCancelled) {
          alert("결제가 취소되었습니다.");
        } else {
          alert(`결제 실패: ${message || code}`);
        }
        router.replace("/");
        return;
      }

      if (paymentId) {
        const packageId = resolvePendingPackageId();

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          alert("로그인 정보를 확인할 수 없습니다. 메인 페이지에서 다시 로그인해 주세요.");
          router.replace("/");
          return;
        }

        const confirmRes = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ paymentId, packageId }),
        });

        const confirmJson = await confirmRes.json();
        safeSessionRemoveItem("pending_payment_package");

        if (!confirmRes.ok) {
          console.error("결제 검증 실패:", confirmJson.error);
          alert(`결제는 완료되었으나 티켓 반영 중 오류가 발생했습니다: ${confirmJson.error}\n고객센터로 문의해 주세요.`);
          router.replace("/");
          return;
        }

        alert("✅ 결제가 완료되었습니다! 티켓이 충전되었습니다! 🎉");
        router.replace("/");
        return;
      }

      router.replace("/");
    };

    handleRedirect();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0a0514] flex items-center justify-center text-gray-400 animate-pulse">
      결제 결과를 확인하는 중...
    </div>
  );
}

export default function PaymentRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0514] flex items-center justify-center text-gray-400 animate-pulse">
          결제 결과를 확인하는 중...
        </div>
      }
    >
      <PaymentRedirectContent />
    </Suspense>
  );
}

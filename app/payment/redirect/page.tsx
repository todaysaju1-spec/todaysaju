"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PaymentRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
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
    } else if (paymentId) {
      alert(`✅ 결제가 성공적으로 완료되었습니다!\n주문번호: ${paymentId}`);
    }

    router.replace("/");
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

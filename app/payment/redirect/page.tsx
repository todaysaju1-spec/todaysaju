"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DEFAULT_PACKAGE = {
  amount_krw: 3900,
  ticket_type: "standard" as const,
  ticket_count: 1,
  order_name: "[오늘의사주] 스탠다드 패스 1회권",
  label: "1회권",
};

type PendingPackage = {
  category: "standard" | "premium";
  price: number;
  tickets: number;
  label: string;
};

type ResolvedPackage = {
  amount_krw: number;
  ticket_type: "standard" | "premium";
  ticket_count: number;
  order_name: string;
  label: string;
  isPremium: boolean;
  ticketField: "standard_ticket" | "premium_ticket";
};

function resolvePaymentPackage(): ResolvedPackage {
  try {
    const raw = sessionStorage.getItem("pending_payment_package");
    if (raw) {
      const pkg = JSON.parse(raw) as PendingPackage;
      const passName = pkg.category === "premium" ? "프리미엄 패스" : "스탠다드 패스";
      const isPremium = pkg.category === "premium";
      return {
        amount_krw: pkg.price,
        ticket_type: pkg.category,
        ticket_count: pkg.tickets,
        order_name: `[오늘의사주] ${passName} ${pkg.label}`,
        label: pkg.label,
        isPremium,
        ticketField: isPremium ? "premium_ticket" : "standard_ticket",
      };
    }
  } catch (error) {
    console.error("pending_payment_package 파싱 실패:", error);
  }

  return {
    amount_krw: DEFAULT_PACKAGE.amount_krw,
    ticket_type: DEFAULT_PACKAGE.ticket_type,
    ticket_count: DEFAULT_PACKAGE.ticket_count,
    order_name: DEFAULT_PACKAGE.order_name,
    label: DEFAULT_PACKAGE.label,
    isPremium: false,
    ticketField: "standard_ticket",
  };
}

async function savePaymentReceipt(
  user: { id: string; email?: string | null; user_metadata?: { email?: string } },
  pkg: ResolvedPackage,
  paymentId: string
) {
  const { error: logError } = await supabase.from("payment_logs").insert({
    user_id: user.id,
    user_email: user.email || user.user_metadata?.email || "이메일 없음",
    order_name: pkg.order_name,
    amount_krw: pkg.amount_krw,
    ticket_type: pkg.ticket_type,
    ticket_count: pkg.ticket_count,
    payment_id: paymentId,
    pay_method: "CARD",
    status: "PAID",
  });

  if (logError) {
    console.error("결제 내역 로그 저장 실패:", logError);
  }
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
        const pkg = resolvePaymentPackage();

        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user) {
          alert("로그인 정보를 확인할 수 없습니다. 메인 페이지에서 다시 로그인해 주세요.");
          router.replace("/");
          return;
        }

        const { data: existingLog } = await supabase
          .from("payment_logs")
          .select("id")
          .eq("payment_id", paymentId)
          .maybeSingle();

        if (existingLog) {
          sessionStorage.removeItem("pending_payment_package");
          alert(`✅ 결제가 완료되었습니다!\n[${pkg.label}] ${pkg.ticket_count}장이 충전되었습니다! 🎉`);
          router.replace("/");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("standard_ticket, premium_ticket")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("프로필 조회 에러:", profileError);
          alert("결제는 완료되었으나 티켓 반영 중 오류가 발생했습니다. 고객센터로 문의해 주세요.");
          router.replace("/");
          return;
        }

        const currentCount = pkg.isPremium
          ? profile?.premium_ticket || 0
          : profile?.standard_ticket || 0;
        const newCount = currentCount + pkg.ticket_count;

        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ [pkg.ticketField]: newCount })
          .eq("id", user.id);

        if (updateError) {
          console.error("티켓 충전 DB 에러:", updateError);
          alert("결제는 완료되었으나 티켓 반영 중 오류가 발생했습니다. 고객센터로 문의해 주세요.");
          router.replace("/");
          return;
        }

        // 티켓 충전 성공 직후 payment_logs에 결제 영수증 저장
        await savePaymentReceipt(user, pkg, paymentId);

        sessionStorage.removeItem("pending_payment_package");
        alert(`✅ 결제가 완료되었습니다!\n[${pkg.label}] ${pkg.ticket_count}장이 충전되었습니다! 🎉`);
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

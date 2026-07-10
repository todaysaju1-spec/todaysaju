'use client';

import { useEffect, useRef } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { useRouter } from 'next/navigation';

// 💡 대표의 찐 테스트 API 키 (스크린샷에서 가져옴!)
const clientKey = "test_ck_KNbdOvk5rkaKy4K1G19o3n07xlzm"; 
const customerKey = "VIP_CUSTOMER_001"; // 나중에 실제 유저 정보로 바꿀 임시 ID

export default function PaymentPage() {
  const router = useRouter();
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  
  // 랜딩페이지에 있던 할인 적용가 5만 원!
  const price = 50000; 

  useEffect(() => {
    (async () => {
      // 1. 토스 결제 플러그인 로드 (이펙트 패널 켜는 중...)
      const paymentWidget = await loadPaymentWidget(clientKey, customerKey);

      // 2. 결제 수단 UI 렌더링 (카드, 계좌이체 등)
      paymentWidget.renderPaymentMethods(
        '#payment-method',
        { value: price } 
      );

      // 3. 약관 동의 UI 렌더링
      paymentWidget.renderAgreement('#agreement');

      paymentWidgetRef.current = paymentWidget;
    })();
  }, []);

  const handlePayment = async () => {
    const paymentWidget = paymentWidgetRef.current;
    try {
      // 4. 결제 요청 액션 (최종 렌더링 버튼 클릭!)
      await paymentWidget?.requestPayment({
        orderId: `ORDER_${new Date().getTime()}`, // 주문번호 (겹치지 않게 타임스탬프)
        orderName: '용유총상담소 사주 분석', // 영수증에 찍힐 이름
        successUrl: `${window.location.origin}/payment/success`, // 결제 성공 시 갈 페이지 (이것도 나중에 만들 거임)
        failUrl: `${window.location.origin}/payment/fail`, // 결제 실패 시 갈 페이지
      });
    } catch (err) {
      console.error('결제 에러:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4 flex flex-col items-center justify-center font-serif">
      <div className="w-full max-w-2xl bg-[#111] border border-[#D4AF37]/30 rounded-xl p-8 shadow-[0_0_40px_rgba(212,175,55,0.1)]">
        
        {/* 상단 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#D4AF37] mb-2 tracking-widest">결제 정보 확인</h1>
          <p className="text-gray-400 text-sm">용유총상담소 평생 명리 지도</p>
        </div>

        {/* 토스 결제 위젯이 렌더링될 투명 도화지(Div) */}
        <div className="bg-white rounded-lg mb-6 overflow-hidden">
          <div id="payment-method" />
        </div>
        
        <div className="bg-white rounded-lg mb-8 overflow-hidden">
          <div id="agreement" />
        </div>

        {/* 하단 버튼들 */}
        <div className="flex gap-4">
          <button 
            onClick={() => router.back()}
            className="flex-1 py-4 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors rounded-sm"
          >
            뒤로 가기
          </button>
          <button 
            onClick={handlePayment}
            className="flex-[2] py-4 bg-[#D4AF37] text-black font-bold text-lg rounded-sm hover:bg-[#F3E5AB] transition-colors shadow-[0_0_15px_rgba(212,175,55,0.4)]"
          >
            {price.toLocaleString()}원 결제하기
          </button>
        </div>

      </div>
    </div>
  );
}
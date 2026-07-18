'use client';

import { useRef, useState } from 'react';

export default function Footer() {
  const formRef = useRef(null);
  const [policyType, setPolicyType] = useState<"terms" | "privacy" | "refund" | null>(null);

  const openKBEscrow = (e: any) => {
    e.preventDefault();
    window.open('', 'KB_AUTHMARK', 'height=604, width=648, status=yes, toolbar=no, menubar=no, location=no');
    if (formRef.current) {
      (formRef.current as any).action = 'https://okbfex.kbstar.com/quics';
      (formRef.current as any).target = 'KB_AUTHMARK';
      (formRef.current as any).submit();
    }
  };

  return (
    <>
      <footer className="w-full py-10 mt-auto bg-gray-900 border-t border-gray-700 text-gray-300 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-8">
          
          <div className="flex-1 space-y-4 text-sm leading-relaxed">
            {/* 약관 링크 */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
              <button onClick={() => setPolicyType("terms")} className="hover:text-white transition-colors">이용약관</button>
              <div className="w-px h-3 bg-gray-600"></div>
              <button onClick={() => setPolicyType("privacy")} className="hover:text-white transition-colors font-bold">개인정보처리방침</button>
              <div className="w-px h-3 bg-gray-600"></div>
              <button onClick={() => setPolicyType("refund")} className="hover:text-[#D4AF37] transition-colors font-bold">환불정책</button>
            </div>

            {/* 사업자 정보 */}
            <div className="space-y-2">
              <p className="font-semibold text-white text-base">플럭스미디어</p>
              <p><strong>대표자:</strong> 이동희</p>
              <p><strong>사업자등록번호:</strong> 522-26-02380</p>
              <p><strong>통신판매업신고:</strong> 2026-부천소사-0565</p>
              <p><strong>사업장:</strong> 경기도 부천시 소사구 소사로 257, 6층 C59호(태한빌딩)</p>
              <p><strong>고객센터:</strong> 010-7979-3621 | <strong>이메일:</strong> todaysaju1@gmail.com</p>
              <p className="text-xs text-gray-500 mt-4">© 2024 FluxMedia. All rights reserved.</p>
            </div>
          </div>

          {/* 에스크로 마크 */}
          <div className="flex-shrink-0 bg-white p-3 rounded-lg shadow-inner">
            <form ref={formRef} name="KB_AUTHMARK_FORM" method="get" style={{ display: 'none' }}>
              <input type="hidden" name="page" value="C021590" />
              <input type="hidden" name="cc" value="b034066:b035526" />
              <input type="hidden" name="mhValue" value="b2e889e3f8e498308e7951661314e011" />
            </form>
            <a href="#" onClick={openKBEscrow} className="block">
              <img src="http://img1.kbstar.com/img/escrow/escrowcmark.gif" alt="KB국민은행 에스크로" border="0" className="block cursor-pointer" />
            </a>
          </div>

        </div>
      </footer>

      {/* 약관 모달창 */}
      {policyType && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-5 animate-in fade-in">
          <div className="bg-[#120524] border border-[#D4AF37]/50 w-full max-w-md max-h-[80vh] rounded-3xl flex flex-col shadow-2xl relative overflow-hidden">
            <div className="p-5 border-b border-[#3b1d6b] flex justify-between items-center bg-[#0a0514]">
              <h3 className="text-base font-bold text-[#D4AF37]">
                {policyType === "terms" && "이용약관"}
                {policyType === "privacy" && "개인정보처리방침"}
                {policyType === "refund" && "환불정책"}
              </h3>
              <button onClick={() => setPolicyType(null)} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap space-y-4">
              {policyType === "terms" && (
                <><p className="font-bold text-white mb-2">제1조 (목적)</p><p>본 약관은 플럭스미디어가 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p></>
              )}
              {policyType === "privacy" && (
                <><p className="font-bold text-white mb-2">1. 수집하는 개인정보 항목</p><p>- 필수항목: 생년월일, 성별, 태어난 시간, 결제 기록 등</p></>
              )}
              {policyType === "refund" && (
                <><p className="font-bold text-[#F0D060] text-sm mb-3">⚠️ 디지털 콘텐츠 환불 불가 규정</p><p>본 서비스는 디지털 콘텐츠 특성상 포인트 사용 및 열람 이후에는 단순 변심으로 인한 환불이 절대 불가합니다.</p></>
              )}
            </div>
            <div className="p-4 bg-[#0a0514]">
              <button onClick={() => setPolicyType(null)} className="w-full py-3 bg-[#1c0d33] hover:bg-[#2a144a] text-[#a48cd1] rounded-xl font-bold">확인했습니다</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
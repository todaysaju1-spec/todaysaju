'use client';

import { useRef, useState } from 'react';
import { MessageCircle } from "lucide-react";

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
              <p className="mt-2">
                <a 
                  href="http://pf.kakao.com/_MbvfX/chat" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#D4AF37] hover:underline"
                >
                  <MessageCircle size={14} />
                  카카오톡 고객센터 문의하기
                </a>
              </p>
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
              
              {/* 1. 이용약관 */}
              {policyType === "terms" && (
                <div className="space-y-4">
                  <p className="font-bold text-white mb-2">제1조 (목적)</p>
                  <p>본 약관은 플럭스미디어(이하 "회사")가 운영하는 웹사이트에서 제공하는 인터넷 관련 서비스(이하 "서비스"라 한다)를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>

                  <p className="font-bold text-white mt-4 mb-2">제2조 (정의)</p>
                  <p>1. "서비스"란 회사가 이용자에게 컴퓨터 등 정보통신설비를 이용하여 운세, 사주 분석 결과 등의 디지털 콘텐츠를 제공하는 가상의 영업장 및 그 서비스를 의미합니다.<br/>
                  2. "이용자"란 회사 웹사이트에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.<br/>
                  3. "이용권(티켓)"이란 서비스 내에서 유료 콘텐츠(기본 사주, 프리미엄 사주 등)를 이용하기 위해 구매하는 가상의 결제 수단을 말합니다.</p>

                  <p className="font-bold text-white mt-4 mb-2">제3조 (약관의 명시와 개정)</p>
                  <p>1. 회사는 이 약관의 내용과 상호, 대표자 성명, 영업소 소재지 주소, 전화번호, 이메일 주소, 사업자등록번호 등을 이용자가 쉽게 알 수 있도록 초기 서비스 화면(전면) 하단에 게시합니다.<br/>
                  2. 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」 등 관련 법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.<br/>
                  3. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 적용일자 7일 전부터 웹사이트를 통해 공지합니다.</p>

                  <p className="font-bold text-white mt-4 mb-2">제4조 (서비스의 제공 및 변경)</p>
                  <p>1. 회사는 다음과 같은 업무를 수행합니다.<br/>
                  &nbsp;&nbsp;① 운세, 사주 등에 관한 디지털 콘텐츠 정보 제공<br/>
                  &nbsp;&nbsp;② 유료 서비스 이용을 위한 이용권(티켓) 구매 지원<br/>
                  &nbsp;&nbsp;③ 기타 회사가 정하는 업무<br/>
                  2. 회사는 기술적 사양의 변경 등의 경우에는 장차 체결되는 계약에 의해 제공할 재화 또는 용역의 내용을 변경할 수 있습니다.</p>

                  <p className="font-bold text-white mt-4 mb-2">제5조 (이용권 구매 및 이용)</p>
                  <p>1. 이용자는 회사가 제공하는 결제 수단(신용카드, 간편결제 등)을 통하여 이용권을 구매할 수 있습니다.<br/>
                  2. 구매한 이용권은 서비스 내의 유료 콘텐츠 열람 시 1회씩 사용되며, 다른 목적(현금화 등)으로 사용될 수 없습니다.</p>

                  <p className="font-bold text-white mt-4 mb-2">제6조 (면책 조항)</p>
                  <p>1. 회사가 제공하는 운세 및 사주 정보는 오락 및 참고용 디지털 콘텐츠이며, 그 결과의 정확성이나 신뢰성에 대해 어떠한 법적 책임도 지지 않습니다.<br/>
                  2. 회사는 이용자가 서비스 결과를 바탕으로 내린 결정이나 행동으로 인해 발생한 손해에 대하여 책임지지 않습니다.<br/>
                  3. 천재지변, 통신 장애 등 불가항력적인 사유로 서비스 제공이 일시 중단될 수 있으며, 이로 인한 손해에 대해서는 회사가 면책됩니다.</p>

                  <p className="font-bold text-white mt-4 mb-2">제7조 (관할 법원)</p>
                  <p>회사와 이용자 간에 발생한 분쟁에 관한 소송은 회사의 본점 소재지를 관할하는 법원을 전속 관할로 합니다.</p>
                </div>
              )}

              {/* 2. 개인정보처리방침 */}
              {policyType === "privacy" && (
                <div className="space-y-4">
                  <p className="font-bold text-white mb-2">플럭스미디어(이하 "회사")는 「개인정보 보호법」 등 관련 법령을 준수하며, 정보주체의 개인정보 보호 및 권익을 보호하기 위해 다음과 같이 개인정보 처리방침을 두고 있습니다.</p>
                  
                  <p className="font-bold text-white mt-4 mb-2">1. 수집하는 개인정보 항목 및 수집 방법</p>
                  <p>회사는 사주/운세 서비스 제공 및 결제 처리를 위해 아래와 같은 개인정보를 수집하고 있습니다.<br/>
                  - 필수항목: 이름(또는 닉네임), 생년월일, 성별, 태어난 시간, 이메일 주소<br/>
                  - 결제 시 수집항목: 결제 기록, 결제 수단 정보 (PG사 통하여 수집)<br/>
                  - 자동 수집항목: 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보</p>
                  
                  <p className="font-bold text-white mt-4 mb-2">2. 개인정보의 수집 및 이용 목적</p>
                  <p>- 서비스 제공: 맞춤형 사주/운세 결과 분석 및 리포트 제공<br/>
                  - 회원 관리: 본인 확인, 서비스 부정이용 방지, 가입 의사 확인, 불만 등 민원처리<br/>
                  - 결제 및 정산: 유료 콘텐츠 제공에 따른 이용권 구매 및 결제, 환불 처리</p>
                  
                  <p className="font-bold text-white mt-4 mb-2">3. 개인정보의 제3자 제공 및 위탁</p>
                  <p>회사는 원활한 서비스 제공을 위해 아래와 같이 외부 전문업체에 개인정보 처리를 위탁하고 있습니다.<br/>
                  - 결제 처리: (주)포트원, 카카오페이 등 PG사 (결제 및 환불 업무)<br/>
                  - 데이터 보관: Supabase (클라우드 DB 서버 연동)</p>
                  
                  <p className="font-bold text-white mt-4 mb-2">4. 개인정보의 보유 및 이용기간</p>
                  <p>원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 아래와 같이 일정 기간 보존합니다.<br/>
                  - 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)<br/>
                  - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</p>
                  
                  <p className="font-bold text-white mt-4 mb-2">5. 정보주체의 권리와 행사 방법</p>
                  <p>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 동의 철회 및 가입 해지(탈퇴)를 요청할 수 있습니다.</p>
                  
                  <p className="font-bold text-white mt-4 mb-2">6. 개인정보 보호책임자</p>
                  <p>- 이름: 이동희<br/>- 이메일: todaysaju1@gmail.com</p>
                </div>
              )}

              {/* 3. 환불정책 (신규 PG사 가이드 반영) */}
              {policyType === "refund" && (
                <div className="space-y-4">
                  <p className="font-bold text-[#F0D060] text-sm mb-3">⚠️ 이용권 유효기간 및 환불 규정</p>
                  
                  <p className="font-bold text-white mb-2">1. 유효기간</p>
                  <ul className="list-disc pl-4 mb-4 space-y-1">
                    <li>본 이용권의 유효기간은 구매일로부터 90일입니다.</li>
                    <li>유효기간(90일)이 경과한 이용권은 기한 만료로 자동 소멸되며, 연장 및 환불이 불가합니다.</li>
                  </ul>

                  <p className="font-bold text-white mb-2">2. 전액 환불</p>
                  <ul className="list-disc pl-4 mb-4 space-y-1">
                    <li>결제일로부터 7일 이내에, 이용권을 단 1회도 사용하지 않은 미사용 건에 한하여 100% 전액 환불됩니다.</li>
                  </ul>

                  <p className="font-bold text-white mb-2">3. 부분 환불 및 위약금</p>
                  <ul className="list-disc pl-4 mb-4 space-y-1">
                    <li>결제일로부터 7일이 경과하였거나, 이용권을 1회 이상 사용한 후 중도 해지 및 환불을 요청하실 경우 아래 기준에 따라 정산 후 환불됩니다.</li>
                    <li className="text-[#D4AF37] font-bold mt-2 mb-2 bg-[#D4AF37]/10 p-2 rounded">
                      환불 금액 = 실제 결제 금액 - (사용한 횟수 × 1회권 정상가) - 위약금(결제 금액의 10%)
                    </li>
                    <li>다회권(3회권, 10회권 등)의 부분 환불 시, 적용된 할인가가 아닌 <strong className="text-white">'1회권 정상가'</strong>를 기준으로 사용 금액이 공제됩니다.</li>
                    <li>공제 금액의 총합(사용분 정상가 + 위약금)이 실제 결제 금액과 같거나 초과할 경우 잔여 환불금이 발생하지 않으므로 환불이 불가합니다.</li>
                  </ul>

                  <p className="font-bold text-white mb-2">4. 기타 예외 사항</p>
                  <ul className="list-disc pl-4 mb-4 space-y-1">
                    <li>이벤트, 리뷰 작성 등을 통해 당사로부터 무상으로 지급받은 프로모션 이용권은 환불 및 현금 변환 대상에서 제외됩니다.</li>
                  </ul>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-[#0a0514]">
              <button onClick={() => setPolicyType(null)} className="w-full py-3 bg-[#1c0d33] hover:bg-[#2a144a] text-[#a48cd1] rounded-xl font-bold transition-colors">
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
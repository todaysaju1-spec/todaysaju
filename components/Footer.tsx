'use client'; // 클릭 이벤트 사용을 위해 맨 위에 꼭 넣어주세요!

import { useRef } from 'react';

export default function Footer() {
  // 폼 제출을 제어하기 위한 Ref
  const formRef = useRef(null);

  // KB 에스크로 팝업창 띄우는 함수
  const openKBEscrow = (e) => {
    e.preventDefault();
    window.open('', 'KB_AUTHMARK', 'height=604, width=648, status=yes, toolbar=no, menubar=no, location=no');
    
    if (formRef.current) {
      formRef.current.action = 'https://okbfex.kbstar.com/quics';
      formRef.current.target = 'KB_AUTHMARK';
      formRef.current.submit();
    }
  };

  return (
    /* 👈 배경색을 어둡게(bg-gray-900), 글자색을 밝게(text-gray-300) 변경 */
    <footer className="w-full py-10 mt-auto bg-gray-900 border-t border-gray-700 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-8">
        
        {/* 1. 사업자 정보 영역 */}
        <div className="flex-1 space-y-2 text-sm leading-relaxed">
          <p className="font-semibold text-white text-base">플럭스미디어</p>
          <p><strong>대표자:</strong> 이동희</p>
          <p><strong>사업자등록번호:</strong> 522-26-02380</p>
          <p><strong>통신판매업신고:</strong> 발급 진행 중</p>
          <p><strong>사업장:</strong> 경기도 부천시 소사구 소사로 257, 6층 C59호(태한빌딩)</p>
          <p><strong>고객센터:</strong> [010-7979-3621] | <strong>이메일:</strong> [todaysaju1@gmail.com]</p>
          <p className="text-xs text-gray-500 mt-4">© 2024 FluxMedia. All rights reserved.</p>
        </div>

        {/* 2. 에스크로 인증마크 영역 (배경이 어두워도 잘 보이게 흰색 패딩 살짝 추가) */}
        <div className="flex-shrink-0 bg-white p-3 rounded-lg shadow-inner">
          {/* 화면엔 안 보이지만 데이터를 은행으로 쏘는 숨겨진 폼 */}
          <form ref={formRef} name="KB_AUTHMARK_FORM" method="get" style={{ display: 'none' }}>
            <input type="hidden" name="page" value="C021590" />
            <input type="hidden" name="cc" value="b034066:b035526" />
            <input type="hidden" name="mHValue" value="b2e889e3f8e498308e7951661314e011" />
          </form>
          
          {/* 마크 이미지 및 클릭 버튼 */}
          <a href="#" onClickOpen={openKBEscrow} className="block">
            <img 
              src="http://img1.kbstar.com/img/escrow/escrowcmark.gif" 
              alt="KB국민은행 에스크로 구매안전서비스" 
              border="0" 
              className="block cursor-pointer"
            />
          </a>
        </div>

      </div>
    </footer>
  );
}
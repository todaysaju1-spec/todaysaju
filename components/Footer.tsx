'use client'; // 클릭 이벤트(window.open)를 사용하기 위해 맨 위에 꼭 넣어주세요!

import { useRef } from 'react';

export default function Footer() {
  // 폼 제출을 제어하기 위한 Ref
  const formRef = useRef(null);

  // KB 에스크로 팝업창 띄우는 함수 (Next.js에 맞게 변환 완료!)
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
    <footer style={{ padding: '40px 20px', backgroundColor: '#f9f9f9', fontSize: '14px', color: '#666' }}>
      
      {/* 1. 통신판매업 및 필수 사업자 정보 (여기에 대표님 정보를 적어주세요) */}
      <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
        <p><strong>상호명:</strong> 플럭스미디어 | <strong>대표자:</strong> 이동희</p>
        <p><strong>사업자등록번호:</strong> 522-26-02380</p>
        <p><strong>통신판매업신고:</strong> 발급 진행 중 (신고증 나오면 번호 입력)</p>
        <p><strong>사업장 소재지:</strong> 경기도 부천시 소사구 소사로 257, 6층 C59호(태한빌딩)</p>
        <p><strong>고객센터:</strong> [010-7979-3621] | <strong>이메일:</strong> [todaysaju1@gmail.com]</p>
      </div>

      {/* 2. KB 국민은행 에스크로 인증마크 (대표님 고유 코드 적용 완료!) */}
      <div>
        {/* 화면엔 안 보이지만 데이터를 은행으로 쏘는 숨겨진 폼 */}
        <form ref={formRef} name="KB_AUTHMARK_FORM" method="get" style={{ display: 'none' }}>
          <input type="hidden" name="page" value="C021590" />
          <input type="hidden" name="cc" value="b034066:b035526" />
          <input type="hidden" name="mHValue" value="b2e889e3f8e498308e7951661314e011" />
        </form>
        
        {/* 마크 이미지 및 클릭 버튼 */}
        <a href="#" onClick={openKBEscrow}>
          <img 
            src="http://img1.kbstar.com/img/escrow/escrowcmark.gif" 
            alt="KB국민은행 에스크로 구매안전서비스" 
            border="0" 
            style={{ cursor: 'pointer' }}
          />
        </a>
      </div>

    </footer>
  );
}
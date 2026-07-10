'use client';
import { useRouter } from 'next/navigation';

export default function VIPModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  // 토스 통합 결제창(위젯) 페이지로 화면 전환!
  const handlePaymentClick = () => {
    router.push('/payment'); 
  };

  return (
    // V2 트랙: 배경 딤(Dim) 처리 (화면 꽉 채우는 반투명 블랙)
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      
      {/* V3 트랙: 모달 본체 (블랙 배경 & 골드 스트로크) */}
      <div className="bg-[#111111] border border-amber-500/50 rounded-xl p-8 w-[400px] max-w-[90%] flex flex-col items-center shadow-[0_0_30px_rgba(245,158,11,0.1)]">
        
        <h2 className="text-amber-500 text-2xl font-bold mb-2">운명의 안내자 연결</h2>
        <p className="text-slate-400 text-sm mb-8 text-center">원하시는 결제 방식을 위젯에서 선택해 주세요.</p>
        
        {/* 통합 결제 버튼 (단일 버튼 팩폭 적용 완료!) */}
        <button 
          onClick={handlePaymentClick}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold py-4 rounded mb-4 transition-all duration-300"
        >
          💳 VIP 결제 진행하기 (카드/송금)
        </button>
        
        {/* 닫기 버튼 */}
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 text-sm mt-2 transition-colors border-b border-transparent hover:border-slate-300 pb-0.5"
        >
          닫기
        </button>
        
      </div>
    </div>
  );
}
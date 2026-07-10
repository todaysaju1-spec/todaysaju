// 1. 함수 이름 앞에 'async(비동기)'를 붙여서 "이 컷은 렌더링 대기 시간이 좀 필요해!"라고 선언해 주는 거야.
export default async function CustomerReportPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 2. 프리미어 프록시 렌더링 기다리듯, 주소창 변수 도착할 때까지 'await'로 잠깐 기다려주기!
  const resolvedParams = await params;
  
  // 3. 도착한 외계어 주소를 예쁜 한글로 디코딩 이펙트 먹이기!
  const customerId = decodeURIComponent(resolvedParams.id);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center p-6">
      
      {/* 프리미엄 리포트 메인 컨테이너 */}
      <div className="w-full max-w-2xl bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-2xl p-8 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
        
        {/* 헤더 타이틀 */}
        <h1 className="text-2xl font-bold text-[#D4AF37] mb-6 text-center">
          ✨ {customerId} 님의 프리미엄 사주 리포트
        </h1>
        
        {/* 본문 레이어 */}
        <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap min-h-[300px] flex items-center justify-center border border-dashed border-zinc-700 rounded-xl">
          <p className="text-zinc-500 animate-pulse">
            (여기에 곧 n8n 배관을 타고 온 AI 사주 전문이 렌더링 될 예정입니다...)
          </p>
        </div>

        {/* 하단 장식 */}
        <div className="mt-8 text-center text-xs text-zinc-600">
          © 2026 FLUX MEDIA · Premium Saju Studio
        </div>

      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Sparkles, Lock, Wallet, ArrowRight, Star, Moon, Compass, CheckCircle2, Gift, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Supabase 연동 클라이언트

export default function TodaySajuLanding() {
  // 화면 전환 스테이트: 로그인전 -> 정보입력 -> 분석중 -> 결과창(무료+꼬리질문)
  const [step, setStep] = useState<"login" | "input" | "analyzing" | "result">("login");
  
  // 유저 상태 (MVP 테스트용 초기값)
  const [userInfo, setUserInfo] = useState({ 
    name: "", 
    birth: "", 
    hour: "12",   // 시간용 추가
    min: "00",    // 분용 추가
    gender: "남자" 
  });
  const [points, setPoints] = useState(1000); // 가입 축하금 1,000P 기본 지급!
  const [hasUsedDailyFree, setHasUsedDailyFree] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [loadingText, setLoadingText] = useState("당신이 태어난 날의 우주 궤도를 계산 중입니다...");
// 💡 [추가] 랜덤 별자리 데이터를 담을 state
const [stars, setStars] = useState<any[]>([]);

// 💡 [추가] 브라우저에 화면이 뜬(마운트 된) 직후에만 랜덤 값을 계산합니다.
useEffect(() => {
  const generatedStars = [...Array(35)].map(() => ({
    width: Math.random() * 3 + 1 + 'px',
    height: Math.random() * 3 + 1 + 'px',
    top: Math.random() * 100 + '%',
    left: Math.random() * 100 + '%',
    '--duration': Math.random() * 3 + 2 + 's',
    '--delay': Math.random() * 2 + 's',
  }));
  setStars(generatedStars);
}, []);
  // ── 구글 간편 로그인 로직 ──
  const handleGoogleLogin = async () => {
    // 실제 Supabase OAuth 로그인 연동 구문
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      console.error("로그인 에러:", error.message);
      // 로컬 테스트(GCP API 미연동 시)를 위해 UI 전환 패스!
      alert("💡 [MVP 테스트 모드] 구글 연동 대기 중! 임시 계정으로 입장을 진행합니다.");
      setStep("input");
    }
  };

  // ── 사주 분석 시작 ──
  // --- 사주 분석 시작 (B2B 화이트라벨 DB 연동) ---
  const handleAnalyze = async () => {
    // 1. 필수 입력값 체크
    if (!userInfo.name || !userInfo.birth) {
      alert("이름과 생년월일을 정확히 입력해주세요!");
      return;
    }

    // 분석 로딩 화면으로 전환
    setStep("analyzing");

    try {
      // 2. 현재 로그인한 유저 확인
      const { data: { session } } = await supabase.auth.getSession();

      // 💡 [화이트라벨 핵심] 가맹점 코드 
      // (나중엔 접속한 도메인 주소에 따라 알아서 바뀌게 세팅할 겁니다. 지금은 테스트용 A가맹점!)
      const currentTenantId = "client_a";

      // 3. 로그인한 유저라면? -> Supabase 금고(user_profiles)에 쏙 집어넣기!
      if (session?.user) {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            id: session.user.id,                 // 유저 고유번호
            tenant_id: currentTenantId,          // [핵심] 가맹점 꼬리표
            display_name: userInfo.name,         // 이름
            birth_date: userInfo.birth,          // 생년월일
            birth_hour: userInfo.hour,           // 태어난 시
            birth_min: userInfo.min,             // 태어난 분
            gender: userInfo.gender              // 성별
          });

        if (error) {
          console.error("DB 저장 에러:", error);
        } else {
          console.log(`✅ [${currentTenantId}] 가맹점 손님 DB 저장 완료!`);
        }
      } else {
        // 로그인 안 한 체험(MVP) 손님은 에러 안 나게 패스
        console.log("게스트 모드: DB 저장은 생략하고 바로 분석을 진행합니다.");
      }
    } catch (error) {
      console.error("처리 중 에러 발생:", error);
    }

    // 4. 기존 애니메이션 효과 (그대로 유지)
    setTimeout(() => {
      setLoadingText("오늘 밤하늘의 별과 당신의 사주 원국을 대조하고 있습니다...");
    }, 1800);

    setTimeout(() => {
      setStep("result");
      setHasUsedDailyFree(true); // 오늘의 무료 운세 소진 처리!
    }, 4000);
  };

  // 📋 [핵심] 메뉴 클릭 시 회원 여부에 따라 '풀이' 혹은 '로그인 유도' 실행
  const handleMenuClick = async (title: string, category: string, desc: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // 1. 비회원일 경우: 가입 유도 (게이트 시스템)
      alert("🎁 회원가입하고 더 정밀한 상세 풀이를 확인하세요!\n1초 만에 가입하면 1,000 포인트를 드립니다.");
      handleGoogleLogin(); // 👈 구글 로그인 창을 바로 띄우는 마법의 명령어로 교체!
      return;
    }

    // 2. 회원일 경우: 바로 분석 로직 실행
    alert(`✨ ${title} 분석을 시작합니다!\nAI가 지금 당신의 사주를 정밀 분석 중입니다...`);
    setStep("analyzing"); 
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0514] text-[#e0d6f5] font-sans selection:bg-[#D4AF37]/30">
      
      {/* 🌠 별빛 & 우주 CSS 효과 */}
      <style>{`
        .cosmic-bg { background: radial-gradient(circle at 50% 0%, #2a0b4c 0%, #0a0514 60%, #000000 100%); }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 10px #D4AF37; }
        }
        .star { position: absolute; background-color: #D4AF37; border-radius: 50%; animation: twinkle var(--duration) infinite ease-in-out var(--delay); }
        @keyframes orbit { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-orbit { animation: orbit 20s linear infinite; }
      `}</style>

      {/* 배경 레이어 */}
      <div className="absolute inset-0 cosmic-bg z-0 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        {stars.map((starStyle, i) => (
          <div key={i} className="star" style={starStyle as React.CSSProperties} />
        ))}
      </div>

      {/* ── 상단 헤더 ── */}
      <header className="fixed top-0 w-full flex justify-between items-center p-4 md:p-5 bg-[#0a0514]/80 backdrop-blur-md z-50 border-b border-[#30155c]/50 max-w-xl mx-auto left-0 right-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep("login")}>
          <Star className="text-[#D4AF37] w-5 h-5 fill-[#D4AF37]" />
          <span className="text-[#D4AF37] font-bold tracking-widest text-base md:text-lg">오늘의사주</span>
          <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded border border-[#D4AF37]/40">PRO</span>
        </div>
        
        {step !== "login" && (
          <button 
            onClick={() => setShowChargeModal(true)}
            className="flex items-center gap-2 bg-[#1c0d33] border border-[#D4AF37]/40 px-3.5 py-1.5 rounded-full hover:bg-[#D4AF37]/10 transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)]"
          >
            <Wallet size={15} className="text-[#D4AF37]" />
            <span className="text-xs md:text-sm font-bold text-[#D4AF37]">{points.toLocaleString()} P</span>
            <span className="text-[10px] bg-[#D4AF37] text-black font-extrabold px-1.5 py-0.2 rounded-full">+ 충전</span>
          </button>
        )}
      </header>

      <div className="max-w-md mx-auto pt-24 pb-20 px-5 flex flex-col min-h-screen justify-center relative z-10">
        
        {/* 📋 [씬 1] 구글 간편 로그인 (온보딩) - 가독성 스케일업 버전 */}
        {(step === "login" || step === "input") && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 text-center">
              
              <div className="space-y-5 pt-6">
                <div className="inline-flex items-center gap-2 bg-[#1e0c3a] border border-[#D4AF37]/30 px-5 py-2.5 rounded-full">
                  <Gift size={18} className="text-[#D4AF37]" />
                  <span className="text-sm font-bold text-[#D4AF37]">매일 접속 시 '오늘의 종합사주' 1회 무료!</span>
                </div>
                
                {/* 메인 타이틀 크기 대폭 확대 */}
               {/* 메인 타이틀 줄바꿈 및 가독성 최적화 */}
               <h1 className="text-3xl sm:text-4xl md:text-5xl font-light leading-snug text-white tracking-wide pt-2 break-keep">
                  <span className="inline-block">우주의 궤도에서 읽는</span><br />
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F0D060] to-[#D4AF37] inline-block mt-2">당신의 진짜 운명</span>
                </h1>
                
                {/* 서브 텍스트 크기 확대 */}
                <p className="text-sm md:text-base text-[#a48cd1] leading-relaxed pt-3">
                  복잡한 회원가입 없이 단 1초 만에 시작하세요.<br />
                  지금 시작하면 심층 풀이용 <span className="text-[#D4AF37] font-bold text-lg">1,000 포인트</span>를 드립니다.
                </p>
              </div>

              {/* 구글 로그인 & MVP 모드 버튼 그룹 */}
              <div className="flex flex-col items-center justify-center gap-5 mt-8 w-full z-10 relative">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-[#1a0b2e] text-lg font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Google 계정으로 1초 만에 시작</span>
                </button>

                <div className="flex items-center gap-4 py-4 mt-2 w-full">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#3b1d6b]"></div>
                  <span className="text-sm text-[#a48cd1] font-medium tracking-wide">또는 직접 입력하여 체험하기</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#3b1d6b]"></div>
                </div>
              </div>
            </div>
          )}

          {/* 📋 [씬 2] 생년월일시 입력 (가독성 폭발 버전) */}
          {(step === "login" || step === "input") && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500 mt-4">
              
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-white tracking-wide">사주 명식 입력</h2>
                <p className="text-sm text-[#a48cd1]">정확한 풀이를 위해 태어난 시간을 입력해주세요.</p>
              </div>

              <div className="bg-[#15072a]/90 backdrop-blur-xl p-7 rounded-3xl border border-[#44237d]/60 shadow-2xl space-y-7">
                
                {/* 1. 성함 */}
                <div>
                  <label className="block text-sm font-medium text-[#a48cd1] mb-2 ml-1">성함 (또는 닉네임)</label>
                  <input
                    type="text"
                    placeholder="예: 홍길동"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                    className="w-full bg-[#0a0514] border border-[#3b1d6b] rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                {/* 2. 성별 */}
                <div>
                  <label className="block text-sm font-medium text-[#a48cd1] mb-2 ml-1">성별</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["남자", "여자"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setUserInfo({...userInfo, gender: g})}
                        className={`py-4 rounded-xl text-base font-bold border transition-all ${
                          userInfo.gender === g
                            ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]"
                            : "bg-[#0a0514] border-[#3b1d6b] text-gray-400 hover:border-gray-600"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. 생년월일 & 태어난 시간 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#a48cd1] mb-2 ml-1">생년월일 (6자리)</label>
                    <input
                      type="number"
                      placeholder="950505"
                      value={userInfo.birth}
                      onChange={(e) => setUserInfo({...userInfo, birth: e.target.value})}
                      className="w-full bg-[#0a0514] border border-[#3b1d6b] rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#a48cd1] mb-2 ml-1">태어난 시간</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={userInfo.hour} 
                        onChange={(e) => setUserInfo({...userInfo, hour: e.target.value})}
                        className="w-full bg-[#0a0514] border border-[#3b1d6b] rounded-xl px-2 py-4 text-base text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                      >
                        <option value="99">모름</option>
                        {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{h}시</option>)}
                      </select>
                      
                      <select 
                        value={userInfo.min} 
                        onChange={(e) => setUserInfo({...userInfo, min: e.target.value})}
                        className="w-full bg-[#0a0514] border border-[#3b1d6b] rounded-xl px-2 py-4 text-base text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                          <option key={m} value={m}>{m}분</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. 제출 버튼 */}
                <button
                  onClick={handleAnalyze}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#1a0b2e] text-lg font-bold py-5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                >
                  오늘의 무료 사주 확인하기 <ArrowRight size={20} />
                </button>

              </div>
            </div>
          )}

        {/* 🎬 [씬 3] 로딩 애니메이션 */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center space-y-8 h-[50vh] animate-in fade-in duration-500 text-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 border border-[#D4AF37]/30 rounded-full animate-orbit">
                <div className="absolute -top-1 left-1/2 w-2.5 h-2.5 bg-[#D4AF37] rounded-full shadow-[0_0_10px_#D4AF37]"></div>
              </div>
              <div className="absolute inset-3 border border-[#6b3eb0]/40 rounded-full animate-orbit" style={{ animationDirection: 'reverse', animationDuration: '15s' }}></div>
              <Compass size={36} className="text-[#D4AF37] animate-pulse" />
            </div>
            <p className="text-[#D4AF37] text-sm tracking-wide animate-pulse px-4 leading-relaxed font-light">
              {loadingText}
            </p>
          </div>
        )}

        {/* 🎬 [씬 4] 오늘의 무료 사주 & 관심분야 꼬리질문 (핵심 도파민 루프) */}
        {step === "result" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* 1. 오늘의 무료 종합 사주 리포트 (미끼 투척) */}
            <div className="bg-gradient-to-br from-[#1c0d33] to-[#0d051c] p-6 rounded-3xl border-2 border-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Today's Free
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-[#D4AF37]" size={18} />
                <h3 className="text-base font-bold text-white">
                  {userInfo.name}님의 오늘(<span className="text-[#D4AF37]">丙午일</span>) 운세
                </h3>
              </div>
              
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-4">
                오늘 하루는 사주 원국에 숨어있던 <strong className="text-[#F3E5AB]">'귀인(기회)의 별'</strong>이 강하게 빛나는 날입니다. 
                막혀있던 문서나 인간관계에서 뜻밖의 실마리가 풀릴 수 있습니다. 
                다만, 오후 3시 이후 감정적인 지출이나 성급한 결정은 피하는 것이 유리합니다.
              </p>

              <div className="bg-[#0a0514]/80 rounded-xl p-3 border border-[#3b1d6b] flex items-center justify-between text-xs text-[#a48cd1]">
                <span>✨ 내일 밤 12시 무료 사주 1회 갱신</span>
                <span className="text-[#D4AF37] font-bold flex items-center gap-1"><CheckCircle2 size={12}/> 출석 완료</span>
              </div>
            </div>

            {/* 📋 [결과 화면] 8개 운세 메뉴 (자판기식 그리드) */}
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-6">지금 궁금한 운세를 선택하세요</h3>
              
              {/* 8개 메뉴 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: "⚡", title: "월별 풀이", desc: "주의할 날/기간" },
                  { icon: "📈", title: "연도별 흐름", desc: "해마다의 기운" },
                  { icon: "💼", title: "직업운", desc: "적합한 직업" },
                  { icon: "💰", title: "금전/재물", desc: "돈 들어오는 시기" },
                  { icon: "✨", title: "삶의 전환점", desc: "운이 바뀌는 시기" },
                  { icon: "❤️", title: "연애/가족", desc: "관계의 흐름" },
                  { icon: "🌿", title: "건강운", desc: "체력 관리 시기" },
                  { icon: "⏳", title: "인생 흐름", desc: "지금 내 운의 위치" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMenuClick(item.title, item.title, item.desc)}
                    className="p-4 bg-[#15072a]/50 border border-[#3b1d6b] rounded-2xl hover:bg-[#1e0c3a] hover:border-[#D4AF37] transition-all text-left group shadow-lg"
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="font-bold text-white group-hover:text-[#D4AF37] text-sm md:text-base">{item.title}</div>
                    <div className="text-[10px] md:text-xs text-[#a48cd1] mt-1">{item.desc}</div>
                  </button>
                }))}
              </div>
            </div>
          </div>
            </div>
          
        
      </div>

      {/* 💳 [모달] 포인트 충전소 (무통장 입금 MVP) */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-5 animate-in fade-in">
          <div className="bg-[#120524] border border-[#D4AF37]/50 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white text-center mb-1">포인트 충전소</h3>
            <p className="text-xs text-[#a48cd1] text-center mb-5">계좌이체 확인 후 1~3분 내 즉시 충전됩니다.</p>
            
            <div className="space-y-2.5 mb-5">
              {[
                { won: "5,000원", pt: 5000, label: "기본 충전" },
                { won: "10,000원", pt: 12000, label: "+2,000P 보너스!", bonus: true },
              ].map((m, idx) => (
                <div key={idx} 
                  onClick={() => setPoints(prev => prev + m.pt)}
                  className={`p-3.5 rounded-2xl border flex justify-between items-center cursor-pointer transition-all ${
                    m.bonus ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-[#3b1d6b] bg-[#0a0514]"
                  }`}
                >
                  <span className="text-sm font-medium text-white">{m.won} 입금</span>
                  <div className="text-right">
                    <span className="text-base font-bold text-[#D4AF37] block">{m.pt.toLocaleString()} P</span>
                    <span className="text-[10px] text-[#F3E5AB]">{m.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0a0514] rounded-xl p-4 mb-6 border border-[#3b1d6b] text-center">
              <p className="text-[11px] text-[#a48cd1] mb-1">무통장 입금 계좌</p>
              <p className="text-sm font-mono font-bold text-[#D4AF37] tracking-wider">국민은행 123456-00-123456</p>
              <p className="text-[11px] text-gray-500 mt-0.5">예금주: 플럭스 미디어</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowChargeModal(false)} className="flex-1 py-3 bg-[#1c0d33] text-[#a48cd1] rounded-xl text-xs font-bold">
                닫기
              </button>
              <button 
                onClick={() => {
                  alert("✅ 입금 알림이 접수되었습니다!\n(관리자 확인 후 즉시 포인트가 지급됩니다.)");
                  setShowChargeModal(false);
                }} 
                className="flex-[2] py-3 bg-gradient-to-r from-[#D4AF37] to-[#F0D060] text-[#120524] rounded-xl text-xs font-extrabold shadow-lg"
              >
                입금 완료했어요
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
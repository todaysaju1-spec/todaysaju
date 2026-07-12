"use client";

import { useState, useEffect } from "react";
import { Sparkles, Lock, Wallet, ArrowRight, Star, Moon, Compass, CheckCircle2, Gift, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Supabase 연동 클라이언트
import { calculateSaju } from "ssaju";

export default function TodaySajuLanding() {
  // 화면 전환 스테이트: 로그인전 -> 정보입력 -> 분석중 -> 결과창(무료+꼬리질문)
  const [step, setStep] = useState<"login" | "input" | "analyzing" | "result">("login");
  
  // 유저 상태 (결혼/자녀/시간모름 옵션 추가)
  const [userInfo, setUserInfo] = useState({
    name: "",
    birth: "",
    hour: "12",
    min: "00",
    gender: "남자",
    calendarType: "양력", // 양력, 음력
    isTimeKnown: false,   // 시간 입력 여부
    maritalStatus: "싱글",  // 기혼, 연애, 싱글
    hasChildren: "없음",   // 있음, 없음
  });
  const [user, setUser] = useState<any>(null);
  const [points, setPoints] = useState(1000); // 가입 축하금 1,000P 기본 지급!
  const [hasUsedDailyFree, setHasUsedDailyFree] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [loadingText, setLoadingText] = useState("당신이 태어난 날의 우주 궤도를 계산 중입니다...");
  const [sajuResultText, setSajuResultText] = useState("");
  // 💡 [추가] 랜덤 별자리 데이터를 담을 state
const [stars, setStars] = useState<any[]>([]);
// 꼬리질문 상태 (새로 추가)
const [selectedQuestion, setSelectedQuestion] = useState("");
const [followUpResult, setFollowUpResult] = useState("");
const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
const [suggestedQuestions, setSuggestedQuestions] = useState([
  "💬 내일의 연애운은?", "💰 이번 주 금전운 흐름은?", "🏢 다가오는 직장/사업운은?", "❤️ 내 귀인은 언제쯤 나타날까?"
]);
const [showPartner, setShowPartner] = useState(false);
const [partnerInfo, setPartnerInfo] = useState({ 
  name: "", 
  birth: "", 
  hour: "12", 
  min: "00", 
  gender: "남자", 
  calendarType: "양력",
  isTimeKnown: false
});
const [showPremiumGate, setShowPremiumGate] = useState(false);
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
useEffect(() => {
  // 🌟 [추가됨] Supabase 은행에서 내 진짜 포인트 가져오는 함수
  const fetchMyPoints = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("points")
      .eq("id", userId)
      .single();
    
    if (data && data.points !== undefined) {
      setPoints(data.points); // 내 진짜 잔고를 지갑(화면)에 업데이트!
    }
  };

  // 1. 현재 로그인 상태 확인
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user || null);
    if (session?.user) {
      fetchMyPoints(session.user.id); // 로그인되어 있으면 잔고 확인
    }
  });

  // 2. 로그인/로그아웃 등 상태가 변할 때마다 자동 감지
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null);
    if (session?.user) {
      fetchMyPoints(session.user.id); // 로그인하면 잔고 확인
    } else {
      setPoints(1000); // 로그아웃하면 다시 기본값으로
    }
  });

  return () => subscription.unsubscribe();
}, []);

// 로그아웃 함수
const handleLogout = async () => {
  await supabase.auth.signOut();
  setUser(null);
  alert("로그아웃 되었습니다.");
};
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

 // --- 사주 분석 시작 (B2B 화이트라벨 DB 연동 + ssaju + n8n) ---
 const handleAnalyze = async () => {
  if (!userInfo.name || !userInfo.birth) {
    alert("이름과 생년월일을 정확히 입력해주세요!");
    return;
  }

  setStep("analyzing");
  setLoadingText("만세력 데이터를 분석하여 사주 원국을 구성하고 있습니다...");

  try {
    // 1. Supabase 유저 데이터 저장
    const { data: { session } } = await supabase.auth.getSession();
    const currentTenantId = "client_a";

    if (session?.user) {
      const { error } = await supabase.from('user_profiles').upsert({
        id: session.user.id,
        tenant_id: currentTenantId,
        display_name: userInfo.name,
        birth_date: userInfo.birth,
        birth_hour: userInfo.hour,
        birth_min: userInfo.min,
        gender: userInfo.gender,
        partner_name: showPartner ? partnerInfo.name : null,
partner_birth: showPartner ? partnerInfo.birth : null,
partner_gender: showPartner ? partnerInfo.gender : null,
partner_hour: showPartner ? partnerInfo.hour : null,
partner_min: showPartner ? partnerInfo.min : null,
partner_calendar_type: showPartner ? partnerInfo.calendarType : null,
partner_is_time_known: showPartner ? partnerInfo.isTimeKnown : false
      });
      if (error) {
        console.error("DB 저장 에러 상세 내역:", error);
        alert(`DB 에러 발생! 원인: ${error.message} \n상세: ${error.details}`);
      }
    }

    // 2. ssaju를 이용해 프론트엔드에서 즉시 만세력 계산
    const yearPrefix = parseInt(userInfo.birth.slice(0, 2)) > 30 ? 1900 : 2000;
    const birthYear = yearPrefix + parseInt(userInfo.birth.slice(0, 2));
    const birthMonth = parseInt(userInfo.birth.slice(2, 4));
    const birthDay = parseInt(userInfo.birth.slice(4, 6));

    const sajuResult = calculateSaju({
      year: birthYear,
      month: birthMonth,
      day: birthDay,
      hour: userInfo.hour === "99" ? undefined : parseInt(userInfo.hour),
      minute: userInfo.hour === "99" ? undefined : parseInt(userInfo.min),
      gender: userInfo.gender === "남자" ? "남" : "여",
    });
    
    const llmFriendlyData = sajuResult.toCompact();

    // 3. 계산된 만세력 데이터를 n8n 서버로 전송
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    
    if (!webhookUrl || webhookUrl.includes("dummy.com")) {
      console.warn("⚠️ n8n 웹훅 URL이 설정되지 않아 임시 화면으로 넘어갑니다.");
      setTimeout(() => { setStep("result"); setHasUsedDailyFree(true); }, 2000);
      return;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "analyze_saju",
        name: userInfo.name,
        sajuData: llmFriendlyData,
        maritalStatus: userInfo.maritalStatus, // 👈 n8n으로 결혼유무 전송
        hasChildren: userInfo.hasChildren,      // 👈 n8n으로 자녀유무 전송
        partnerData: showPartner ? partnerInfo : null
      }),
    });

    if (response.ok) {
      const data = await response.json(); 
      setSajuResultText(data.result_text); 
      setStep("result");
      setHasUsedDailyFree(true);
    } else {
      alert("운세 서버 통신이 지연되고 있습니다. 다시 시도해주세요.");
      setStep("input");
    }
  } catch (error) {
    console.error("처리 중 에러 발생:", error);
    alert("서버 통신 중 에러가 발생했습니다.");
    setStep("input");
  }
};

// 꼬리질문 분석 함수
// 꼬리질문 분석 함수
const handleFollowUp = async (question: string) => {
  setSelectedQuestion(question);
  setIsFollowUpLoading(true);
  setFollowUpResult("");

  try {
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ""; 
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "follow_up",
        name: userInfo.name,
        sajuData: sajuResultText, 
        question: question,       
        maritalStatus: userInfo.maritalStatus,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data.result_text;
      
      // 💡 핵심: AI가 던져준 '||' 기호를 기준으로 답변과 질문을 가위질합니다!
      if (rawText.includes("||")) {
        const parts = rawText.split("||");
        setFollowUpResult(parts[0].trim()); // 첫 번째 조각(답변)은 결과창에 출력
        
        // 나머지 조각들(추천 질문)은 칩 버튼으로 싹 갈아끼우기
        const newQuestions = parts.slice(1).map((q: string) => q.trim()).filter((q: string) => q !== "");
        if (newQuestions.length > 0) {
          setSuggestedQuestions(newQuestions); 
        }
      } else {
        setFollowUpResult(rawText); // '||'가 없으면 통째로 출력
      }
    } else {
      setFollowUpResult("서버 통신이 지연되고 있습니다. 다시 시도해주세요.");
    }
  } catch (error) {
    console.error("Error:", error);
    setFollowUpResult("답변을 불러오는 중 문제가 발생했습니다.");
  } finally {
    setIsFollowUpLoading(false);
  }
};

  // 📋 [핵심] 메뉴 클릭 시 회원 여부에 따라 '풀이' 혹은 '로그인 유도' 실행
  const handleMenuClick = async (title: string, category: string, desc: string) => {
    // 1. 로그인 여부 확인 (게이트 시스템 유지)
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert("🎁 회원가입하고 더 정밀한 상세 풀이를 확인하세요!\n1초 만에 가입하면 1,000 포인트를 드립니다.");
      handleGoogleLogin();
      return;
    }

    // 2. 사주 정보 유무 확인 (새로고침 시 에러 방지)
    if (!userInfo.name || !userInfo.birth) {
      alert("사주 정보가 초기화되었습니다. 메인 화면에서 다시 입력해주세요.");
      setStep("input");
      return;
    }

    // 3. 로딩 화면 띄우기 및 분석 시작
    setStep("analyzing");
    
    try {
      // 4. 만세력 데이터 상세 계산 (n8n 전송용)
      const yearPrefix = parseInt(userInfo.birth.slice(0, 2)) > 30 ? 1900 : 2000;
      const birthYear = yearPrefix + parseInt(userInfo.birth.slice(0, 2));
      const birthMonth = parseInt(userInfo.birth.slice(2, 4));
      const birthDay = parseInt(userInfo.birth.slice(4, 6));

      const sajuResult = calculateSaju({
        year: birthYear,
        month: birthMonth,
        day: birthDay,
        hour: userInfo.hour === "99" ? undefined : parseInt(userInfo.hour),
        minute: userInfo.hour === "99" ? undefined : parseInt(userInfo.min),
        gender: userInfo.gender === "남자" ? "남" : "여",
      });
      const llmFriendlyData = sajuResult.toCompact();

      // 5. n8n으로 전송 (action: menu_click)
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "menu_click", // 👈 8개 메뉴 클릭 신호
          name: userInfo.name,
          sajuData: llmFriendlyData,
          category: title, // 클릭한 메뉴 이름 (직업운, 건강운 등)
          maritalStatus: userInfo.maritalStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSajuResultText(data.result_text); // 메인 결과창 텍스트를 전문 리포트로 교체
        setStep("result");
        window.scrollTo({ top: 0, behavior: 'smooth' }); // 화면 맨 위로 부드럽게 스크롤
      } else {
        alert("서버 통신이 지연되고 있습니다. 다시 시도해주세요.");
        setStep("result");
      }
    } catch (error) {
      console.error("처리 중 에러 발생:", error);
      alert("서버 에러가 발생했습니다.");
      setStep("result");
    }
  };
// 👑 프리미엄 사주 호출 함수
const handlePremiumClick = async () => {
  // 1. 로그인/정보 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("🎁 회원가입 후 이용 가능합니다!");
    handleGoogleLogin();
    return;
  }
  
  // 2. 포인트 잔액 확인
  if (points < 2000) { 
    alert("포인트가 부족합니다. 충전 후 이용해주세요!");
    setShowChargeModal(true);
    return;
  }

  setStep("analyzing");
  setLoadingText("사주, 재물, 연애, 건강 전문가 4인이 당신의 운명을 정밀 분석 중입니다...");

  try {
    // 3. 만세력 데이터 계산 (기존 로직 그대로 재사용)
    const yearPrefix = parseInt(userInfo.birth.slice(0, 2)) > 30 ? 1900 : 2000;
    const birthYear = yearPrefix + parseInt(userInfo.birth.slice(0, 2));
    const birthMonth = parseInt(userInfo.birth.slice(2, 4));
    const birthDay = parseInt(userInfo.birth.slice(4, 6));

    const sajuResult = calculateSaju({
      year: birthYear,
      month: birthMonth,
      day: birthDay,
      hour: userInfo.hour === "99" ? undefined : parseInt(userInfo.hour),
      minute: userInfo.hour === "99" ? undefined : parseInt(userInfo.min),
      gender: userInfo.gender === "남자" ? "남" : "여",
    });
    const llmFriendlyData = sajuResult.toCompact();

    // 4. n8n 프리미엄 노드 호출
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "premium_saju", // 👈 n8n의 프리미엄 노드 분기점
        name: userInfo.name,
        sajuData: llmFriendlyData,
        maritalStatus: userInfo.maritalStatus,
        partnerData: showPartner ? partnerInfo : null 
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setSajuResultText(data.result_text);
      setStep("result");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert("서버 통신이 지연되고 있습니다. 다시 시도해주세요.");
      setStep("result");
    }
  } catch (error) {
    console.error(error);
    alert("프리미엄 분석 중 오류가 발생했습니다.");
    setStep("result");
  }
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
        
        {user && (
          <div className="flex items-center gap-2 md:gap-3">
            {/* 유저 이름 표시 */}
            <div className="text-xs text-gray-300 hidden sm:block">
              <span className="font-bold text-white">{user.user_metadata?.name || "고객"}</span>님
            </div>
            
            {/* 포인트 및 충전 버튼 */}
            <button 
              onClick={() => setShowChargeModal(true)}
              className="flex items-center gap-1.5 md:gap-2 bg-[#1c0d33] border border-[#D4AF37]/40 px-3 py-1.5 rounded-full hover:bg-[#D4AF37]/10 transition-all shadow-[0_0_10px_rgba(212,175,55,0.15)]"
            >
              <Wallet size={14} className="text-[#D4AF37]" />
              <span className="text-xs md:text-sm font-bold text-[#D4AF37]">{points.toLocaleString()} P</span>
              <span className="text-[9px] md:text-[10px] bg-[#D4AF37] text-black font-extrabold px-1.5 py-0.5 rounded-full hidden xs:inline-block">+ 충전</span>
            </button>
          </div>
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

              {/* 구글 로그인 & 상태 감지 버튼 그룹 */}
              <div className="flex flex-col items-center justify-center gap-5 mt-8 w-full z-10 relative">
                {user ? (
                  // [로그인 O] 로그인이 되어 있을 때 보이는 화면
                  <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-500">
                    <div className="text-[#1a0b2e] font-bold text-lg bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                      ✨ {user.user_metadata?.name || "고객"}님, 환영합니다!
                    </div>
                    <button 
                      onClick={handleLogout} 
                      className="text-xs text-gray-400 underline hover:text-white transition-colors"
                    >
                      다른 계정으로 로그인 (로그아웃)
                    </button>
                  </div>
                ) : (
                  // [로그인 X] 로그인이 안 되어 있을 때 보이는 구글 버튼
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
                )}

                {/* 안내선 */}
                <div className="flex items-center justify-center gap-4 py-4 mt-2 w-full opacity-50">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#3b1d6b]"></div>
                  <span className="text-sm text-[#a48cd1] font-medium tracking-wide">사주 명식 입력</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#3b1d6b]"></div>
                </div>
              </div>
            </div>
          )}

      {/* 📋 [씬 2] 디테일한 사주 정보 입력 폼 (숨김 해제 및 즉시 표시) */}
      {(step === "login" || step === "input") && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 mt-2">
          {/* 입력 폼 배경 */}
          <div className="bg-[#15072a]/90 backdrop-blur-xl p-7 rounded-3xl border border-[#44237d]/60 shadow-2xl space-y-6 text-left relative z-20">
            
            {/* 1. 성함 */}
            <div>
              <label className="block text-sm font-medium text-[#a48cd1] mb-2 ml-1">성함</label>
              <input type="text" placeholder="예: 홍길동" value={userInfo.name}
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                className="w-full bg-[#0a0514] border border-[#3b1d6b] rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>

            {/* 2. 성별 & 양력/음력 (그리드) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#a48cd1] mb-2 ml-1">성별</label>
                <div className="grid grid-cols-2 gap-2">
                  {["남", "여"].map((g) => (
                    <button key={g} type="button" onClick={() => setUserInfo({ ...userInfo, gender: g === "남" ? "남자" : "여자" })}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all ${userInfo.gender === (g === "남" ? "남자" : "여자") ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]" : "bg-[#0a0514] border-[#3b1d6b] text-gray-400 hover:border-gray-500"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a48cd1] mb-2 ml-1">양력/음력</label>
                <div className="grid grid-cols-2 gap-2">
                  {["양력", "음력"].map((c) => (
                    <button key={c} type="button" onClick={() => setUserInfo({ ...userInfo, calendarType: c })}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all ${userInfo.calendarType === c ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]" : "bg-[#0a0514] border-[#3b1d6b] text-gray-400 hover:border-gray-500"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-[#a48cd1] mb-2 ml-1">생년월일 (6자리)</label>
              <input type="number" placeholder="950505" value={userInfo.birth}
                onChange={(e) => setUserInfo({ ...userInfo, birth: e.target.value })}
                className="w-full bg-[#0a0514] border border-[#3b1d6b] rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* 4. 태어난 시간 */}
            <div>
              <label className="block text-sm font-medium text-[#a48cd1] mb-2 ml-1">태어난 시간</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button type="button" onClick={() => setUserInfo({ ...userInfo, isTimeKnown: false, hour: "99" })}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${!userInfo.isTimeKnown ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]" : "bg-[#0a0514] border-[#3b1d6b] text-gray-400"}`}>
                  ❔ 시간 모름
                </button>
                <button type="button" onClick={() => setUserInfo({ ...userInfo, isTimeKnown: true, hour: "12" })}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${userInfo.isTimeKnown ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]" : "bg-[#0a0514] border-[#3b1d6b] text-gray-400"}`}>
                  🕒 시간 입력
                </button>
              </div>
              {/* 시간 입력칸 (시간을 안다고 선택했을 때만 보임) */}
              {userInfo.isTimeKnown && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95">
                  <select value={userInfo.hour} onChange={(e) => setUserInfo({ ...userInfo, hour: e.target.value })} className="w-full bg-[#0a0514] border border-[#3b1d6b] rounded-xl px-2 py-3 text-white">
                    {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{h}시</option>)}
                  </select>
                  <select value={userInfo.min} onChange={(e) => setUserInfo({ ...userInfo, min: e.target.value })} className="w-full bg-[#0a0514] border border-[#3b1d6b] rounded-xl px-2 py-3 text-white">
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => <option key={m} value={m}>{m}분</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* 5. 결혼/자녀 유무 */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#3b1d6b]/50">
              <div>
                <label className="block text-sm font-medium text-[#a48cd1] mb-2 ml-1">결혼 유무</label>
                <div className="grid grid-cols-3 gap-1">
                  {["기혼", "연애", "싱글"].map((s) => (
                    <button key={s} type="button" onClick={() => setUserInfo({ ...userInfo, maritalStatus: s })}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${userInfo.maritalStatus === s ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]" : "bg-[#0a0514] border-[#3b1d6b] text-gray-400"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a48cd1] mb-2 ml-1">자녀 유무</label>
                <div className="grid grid-cols-2 gap-1">
                  {["있음", "없음"].map((k) => (
                    <button key={k} type="button" onClick={() => setUserInfo({ ...userInfo, hasChildren: k })}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${userInfo.hasChildren === k ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]" : "bg-[#0a0514] border-[#3b1d6b] text-gray-400"}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
{/* 6. 파트너 정보 입력 (추가) */}
<div className="mt-6 p-4 bg-[#1a0b2e] rounded-xl border border-[#44237d]">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-300 font-bold">❤️ 파트너/배우자 정보 (선택)</label>
                <button 
                  type="button"
                  onClick={() => setShowPartner(!showPartner)}
                  className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded hover:bg-[#D4AF37]/30 transition-all"
                >
                  {showPartner ? "접기" : "입력하기"}
                </button>
              </div>
              
              {showPartner && (
  <div className="space-y-4 mt-4 animate-in slide-in-from-top-2 duration-300">
    <input 
      placeholder="파트너 성함" 
      className="w-full bg-[#0a0514] p-3 rounded-xl text-sm text-white border border-[#3b1d6b]"
      onChange={(e) => setPartnerInfo({...partnerInfo, name: e.target.value})}
    />
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => setPartnerInfo({...partnerInfo, gender: "남자"})}
        className={`py-2 rounded-lg text-xs font-bold border ${partnerInfo.gender === "남자" ? "bg-[#D4AF37]/20 border-[#D4AF37]" : "bg-[#0a0514] border-[#3b1d6b]"}`}>남자</button>
      <button type="button" onClick={() => setPartnerInfo({...partnerInfo, gender: "여자"})}
        className={`py-2 rounded-lg text-xs font-bold border ${partnerInfo.gender === "여자" ? "bg-[#D4AF37]/20 border-[#D4AF37]" : "bg-[#0a0514] border-[#3b1d6b]"}`}>여자</button>
    </div>
    <input 
      placeholder="생년월일 (6자리)" 
      className="w-full bg-[#0a0514] p-3 rounded-xl text-sm text-white border border-[#3b1d6b]"
      onChange={(e) => setPartnerInfo({...partnerInfo, birth: e.target.value})}
    />
    <div className="flex gap-2">
      <button type="button" onClick={() => setPartnerInfo({...partnerInfo, isTimeKnown: false})}
        className={`flex-1 py-2 rounded-lg text-xs border ${!partnerInfo.isTimeKnown ? "border-[#D4AF37]" : "border-[#3b1d6b]"}`}>시간 모름</button>
      <button type="button" onClick={() => setPartnerInfo({...partnerInfo, isTimeKnown: true})}
        className={`flex-1 py-2 rounded-lg text-xs border ${partnerInfo.isTimeKnown ? "border-[#D4AF37]" : "border-[#3b1d6b]"}`}>시간 입력</button>
    </div>
    {partnerInfo.isTimeKnown && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 mt-2">
              <select 
                value={partnerInfo.hour} 
                onChange={(e) => setPartnerInfo({...partnerInfo, hour: e.target.value})} 
                className="w-full bg-[#0a0514] border border-[#3b1d6b] rounded-xl px-2 py-3 text-white text-sm"
              >
                {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{h}시</option>)}
              </select>
              <select 
                value={partnerInfo.min} 
                onChange={(e) => setPartnerInfo({...partnerInfo, min: e.target.value})} 
                className="w-full bg-[#0a0514] border border-[#3b1d6b] rounded-xl px-2 py-3 text-white text-sm"
              >
                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => <option key={m} value={m}>{m}분</option>)}
              </select>
            </div>
          )}
  </div>
)}
            </div>

            {/* 분석 버튼 */}
            <button onClick={handleAnalyze} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#1a0b2e] text-lg font-bold py-4 rounded-xl mt-4 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all flex items-center justify-center gap-2">
              대한민국 1% 사주, 지금 확인 <ArrowRight size={20} />
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
  {userInfo.name}님의 <span className="text-[#D4AF37]">오늘</span> 운세
</h3>
              </div>
              
              <div className="text-gray-300 text-xs md:text-sm leading-relaxed mb-4 whitespace-pre-wrap">
        {sajuResultText.replaceAll("**", "")}
      </div>

      {/* --- 꼬리질문 UI 시작 --- */}
      <div className="mt-8 pt-6 border-t border-[#3b1d6b]/50 animate-in fade-in slide-in-from-bottom-4 duration-700 mb-6">
              
              {/* 1. 최초 상태 (결과가 없을 때 상단에 표시) */}
              {!followUpResult && !isFollowUpLoading && (
                <>
                  <h4 className="text-[#F3E5AB] text-sm font-bold mb-4 flex items-center gap-2">
                    ✨ 더 궁금한 내용이 있나요?
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFollowUp(q)}
                        className="bg-[#1a0b2e] border border-[#44237d] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 text-gray-300 hover:text-[#F3E5AB] text-xs px-4 py-2.5 rounded-full transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 2. 로딩 애니메이션 */}
              {isFollowUpLoading && (
                <div className="text-center py-6 bg-[#0a0514]/50 rounded-xl border border-[#3b1d6b]/30">
                  <div className="animate-spin w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-xs text-[#a48cd1]">명리학자가 {userInfo.name}님의 질문을 분석하고 있습니다...</p>
                </div>
              )}
              
              {/* 3. 추가 질문 결과 창 & 새로운 꼬리질문 버튼 */}
              {followUpResult && !isFollowUpLoading && (
                <div className="bg-[#0a0514] border border-[#D4AF37]/40 rounded-xl p-5 shadow-[0_0_15px_rgba(212,175,55,0.1)] animate-in fade-in zoom-in-95">
                  <p className="text-xs font-bold text-[#D4AF37] mb-3 pb-2 border-b border-[#D4AF37]/20">💡 {selectedQuestion}</p>
                  <div className="text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                    {followUpResult}
                  </div>
                  
                  {/* 👇 새로 생성된 버튼들이 결과창 맨 밑에 뜹니다! 👇 */}
                  <div className="mt-6 pt-4 border-t border-[#D4AF37]/20">
                    <p className="text-[#F3E5AB] text-sm font-bold mb-3 flex items-center gap-2">
                      ✨ 다음은 무엇이 궁금하신가요?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleFollowUp(q)}
                          className="bg-[#1a0b2e] border border-[#44237d] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 text-gray-300 hover:text-[#F3E5AB] text-xs px-4 py-2.5 rounded-full transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* --- 꼬리질문 UI 끝 --- */}

              <div className="bg-[#0a0514]/80 rounded-xl p-3 border border-[#3b1d6b] flex items-center justify-between text-xs text-[#a48cd1]">
                <span>✨ 내일 밤 12시 무료 사주 1회 갱신</span>
                <span className="text-[#D4AF37] font-bold flex items-center gap-1"><CheckCircle2 size={12}/> 출석 완료</span>
              </div>
            </div>

            {/* 📋 [결과 화면] 8개 운세 메뉴 (자판기식 그리드) */}
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-6">지금 궁금한 운세를 선택하세요</h3>
             {/* 👑 프리미엄 사주 버튼 (강조) */}
<div className="mb-6 relative z-20"> {/* 👈 요기 z-20 추가! */}
  <button
    onClick={() => {
      // 1. 유저 정보가 없으면 (로그인 안 됨)
      if (!user) {
        alert("🎁 회원가입 후 이용 가능합니다!");
        handleGoogleLogin();
      } else {
        // 2. 유저 정보가 있으면 모달창 띄우기
        setShowPremiumGate(true); 
      }
    }}
    className="w-full bg-gradient-to-r from-[#44237d] to-[#1a0b2e] border-2 border-[#D4AF37] p-6 rounded-3xl text-left relative z-20 overflow-hidden group hover:border-[#F3E5AB] transition-all cursor-pointer"
  >
    <div className="absolute top-0 right-0 bg-[#D4AF37] text-[#1a0b2e] font-extrabold text-[10px] px-3 py-1 rounded-bl-xl z-30">BEST</div>
    <div className="flex items-center gap-3 relative z-30">
      <div className="text-3xl">👑</div>
      <div>
        <div className="text-white font-bold text-lg">프리미엄 인생 마스터플랜</div>
        <div className="text-[#a48cd1] text-xs mt-1">인생 총평 + 재물/직업 + 연애/가족 + 건강/행운 (4,000자 정밀 분석)</div>
      </div>
    </div>
  </button>
</div>
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
                ))}
              </div>
            </div>
          </div>
          </div>
        )}

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
      {/* 👑 [모달] 프리미엄 결제 관문 (여기에 있어야 화면에 보입니다!) */}
      {showPremiumGate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-5 animate-in fade-in">
          <div className="bg-[#120524] border border-[#D4AF37]/50 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="text-center space-y-4">
              <div className="text-4xl">👑</div>
              <div>
                <h3 className="text-xl font-bold text-white">프리미엄 마스터플랜</h3>
                <p className="text-sm text-[#a48cd1] mt-1">4,000자 정밀 분석을 시작할까요?</p>
              </div>
              
              <div className="bg-[#0a0514] p-4 rounded-2xl border border-[#3b1d6b] my-4">
                <p className="text-xs text-[#a48cd1]">차감 예정 포인트</p>
                <p className="text-2xl font-bold text-[#D4AF37]">2,000 P</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowPremiumGate(false)} 
                className="flex-1 py-3 bg-[#1c0d33] text-[#a48cd1] rounded-xl font-bold text-sm"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  setShowPremiumGate(false); // 1. 모달창 닫기
                  if (points >= 2000) {
                    setPoints(prev => prev - 2000); // 2. 포인트 차감
                    handlePremiumClick(); // 3. 👈 대망의 n8n 프리미엄 분석 엔진 가동!
                  } else {
                    alert("포인트가 부족합니다!");
                    setShowChargeModal(true); // 포인트 부족 시 충전창 띄우기
                  }
                }} 
                className="flex-[2] py-3 bg-gradient-to-r from-[#D4AF37] to-[#F0D060] text-[#120524] rounded-xl font-bold text-sm shadow-lg"
              >
                분석 시작하기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ---------------------------------------------------- */}
    </main>
  );

}
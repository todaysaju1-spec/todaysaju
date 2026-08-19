"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Wallet, ArrowRight, Star, Moon, Compass, CheckCircle2, Gift, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Supabase 연동 클라이언트
import { calculateSaju, type SajuResult } from "ssaju";
import { safeGetJSON, safeSetJSON, safeSetItem, safeSessionSetJSON } from "@/lib/safe-storage";
import { getPartnerWebhookFields, hasPartnerBirthInput } from "@/lib/partner-saju-payload";
import { calculateSajuFromUserInfo } from "@/lib/saju-dashboard-utils";
import { PREMIUM_MENU_KEY } from "@/lib/saju-dashboard-insights";
import { STANDARD_PACKAGES, PREMIUM_PACKAGES } from "@/lib/ticket-packages";
import ButtonSpinner from "@/components/ButtonSpinner";
import { useToast } from "@/components/ToastProvider";
import SajuDashboard from "@/components/saju/SajuDashboard";

const PORTONE_STORE_ID = "store-252438e8-5d98-47ec-b2a6-e040643cf1a6";
const PORTONE_CHANNEL_KEY = "channel-key-fd3937f3-b47f-4de6-9a08-16c085c44f46";

const FREE_SAJU_TITLE = "오늘의 무료 사주";
const FREE_SAJU_TYPE = "free";
const FREE_SAJU_LIMIT_MESSAGE =
  "오늘의 무료 사주는 하루에 한 번만 제공됩니다. [사주 보관함]에서 오늘 받은 운세를 다시 확인해 보세요! 🍀";

const PARTNER_INFO_STORAGE_KEY = "saved_partner_info";

type FortuneMenuItem = {
  icon: string;
  title: string;
  desc: string;
  isFree?: boolean;
};

const FORTUNE_MENU_ITEMS: FortuneMenuItem[] = [
  { icon: "☀️", title: "오늘의 운세", desc: "오늘 하루의 기운" },
  { icon: "💭", title: "상대방 속마음", desc: "나를 향한 진짜 태도" },
  { icon: "⚡", title: "월별 풀이", desc: "주의할 날/기간" },
  { icon: "📈", title: "연도별 흐름", desc: "해마다의 기운" },
  { icon: "💼", title: "직업운", desc: "적합한 직업" },
  { icon: "💰", title: "금전/재물", desc: "돈 들어오는 시기" },
  { icon: "✨", title: "삶의 전환점", desc: "운이 바뀌는 시기" },
  { icon: "❤️", title: "연애/가족", desc: "관계의 흐름" },
  { icon: "🌿", title: "건강운", desc: "체력 관리 시기" },
  { icon: "⏳", title: "인생 흐름", desc: "지금 내 운의 위치" },
];

type StoredPartnerInfo = {
  name: string;
  birth: string;
  hour: string;
  min: string;
  gender: string;
  calendarType: string;
  isTimeKnown: boolean;
};

const savePartnerInfoToStorage = (info: StoredPartnerInfo) => {
  safeSetJSON(PARTNER_INFO_STORAGE_KEY, info);
};

const loadPartnerInfoFromStorage = (): StoredPartnerInfo | null => {
  return safeGetJSON<StoredPartnerInfo | null>(PARTNER_INFO_STORAGE_KEY, null);
};

const normalizeStoredPartnerInfo = (saved: StoredPartnerInfo): StoredPartnerInfo => ({
  name: saved.name || "",
  birth: saved.birth || "",
  hour: saved.hour || "12",
  min: saved.min || "00",
  gender: saved.gender || "여자",
  calendarType: saved.calendarType || "양력",
  isTimeKnown: saved.isTimeKnown ?? false,
});

const getKSTDayBounds = () => {
  const kstDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  return {
    kstDateStr,
    start: `${kstDateStr}T00:00:00+09:00`,
    end: `${kstDateStr}T23:59:59.999+09:00`,
  };
};

const hasTodayFreeSajuInDB = async (userId: string): Promise<boolean> => {
  const { start, end } = getKSTDayBounds();
  const { data, error } = await supabase
    .from("saju_history")
    .select("id, title, type")
    .eq("user_id", userId)
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) {
    console.error("무료 사주 중복 체크 에러:", error);
    return false;
  }

  return (data ?? []).some(
    (row) => row.title === FREE_SAJU_TITLE || row.type === FREE_SAJU_TYPE
  );
};

type SajuWebhookResult =
  | { ok: true; data: { result_text: string; standardTicket?: number; premiumTicket?: number } }
  | { ok: false; status: number; error: string };

// n8n 웹훅을 브라우저에서 직접 호출하지 않고, 로그인 세션 + 무료/티켓 사용량 검증을 거치는 서버 API를 통해서만 호출합니다.
async function callSajuWebhook(payload: Record<string, unknown>): Promise<SajuWebhookResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    return { ok: false, status: 401, error: "로그인이 필요합니다." };
  }

  const res = await fetch("/api/saju/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    return { ok: false, status: res.status, error: json.error || "요청 처리 중 오류가 발생했습니다." };
  }

  return { ok: true, data: json };
}

export default function TodaySajuLanding() {
  const router = useRouter();
  const { showToast } = useToast();
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
  const [standardTicket, setStandardTicket] = useState(0);
  const [premiumTicket, setPremiumTicket] = useState(0);
  const [hasUsedDailyFree, setHasUsedDailyFree] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [loadingText, setLoadingText] = useState("명식(命式)을 세우고 타고난 기운의 흐름을 짚어보고 있습니다.\n(예상 소요 시간: 1~2분)");
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
// 어떤 메뉴를 얼마에 결제할지 담아두는 '장바구니' 역할입니다.
const [pendingPayment, setPendingPayment] = useState<any>(null); 
const [showGuestModal, setShowGuestModal] = useState(false);
// 🎟️ 오늘의 무료 사주 중복 사용 시 티켓 차감 모달
const [isAlreadyUsedModalOpen, setIsAlreadyUsedModalOpen] = useState(false);
const [isTicketProcessing, setIsTicketProcessing] = useState(false);
const [showEmailLoginModal, setShowEmailLoginModal] = useState(false);
const [emailInput, setEmailInput] = useState("");
const [passwordInput, setPasswordInput] = useState("");
// 🗂️ 보관함 전용 상태 모음
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any>(null); // 리스트에서 클릭한 상세 내역
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  type LoadingAction =
    | "google"
    | "kakao"
    | "email"
    | "history"
    | "myInfo"
    | "partnerInfo"
    | "analyze"
    | "portone"
    | "deposit"
    | "pending"
    | "menu"
    | "premium";

  const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(null);
  const isLoading = (action: LoadingAction) => loadingAction === action;
  const isAnyActionLoading = loadingAction !== null;

  const renderLoadingContent = (action: LoadingAction, label: ReactNode) =>
    isLoading(action) ? (
      <span className="inline-flex items-center justify-center gap-2">
        <ButtonSpinner />
        처리 중...
      </span>
    ) : (
      label
    );
 // 이용권 구매용 상태 추가
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [depositorName, setDepositorName] = useState("");
  const [showSajuDashboard, setShowSajuDashboard] = useState(false);
  const [dashboardSajuResult, setDashboardSajuResult] = useState<SajuResult | null>(null);

  const getTicketUsageLabel = (type: string) =>
    type === "premium" ? "👑 프리미엄 패스 1장" : "🎟️ 스탠다드 패스 1장";
  // (기존 코드) 꼬리질문 상태 아래나 편한 곳에 추가해 주세요!
  const [showResultForm, setShowResultForm] = useState(false); // 👈 결과창 접이식 폼 스위치
  const [isAgreed, setIsAgreed] = useState(false);
  // 🪄 내 사주 명식 자동 불러오기
  const fetchMySavedInfo = async () => {
    if (!user) {
      showToast("로그인 후 이용 가능합니다!", "warning");
      return;
    }
    if (isAnyActionLoading) return;

    setLoadingAction("myInfo");
    try {
      const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();

      if (data && data.birth_date) {
        setUserInfo(prev => ({
          ...prev,
          name: data.display_name || "",
          birth: data.birth_date || "",
          hour: data.birth_hour || "12",
          min: data.birth_min || "00",
          gender: data.gender || "남자",
          maritalStatus: data.marital_status || "싱글",
          hasChildren: data.has_children || "없음",
          isTimeKnown: data.birth_hour !== "99"
        }));
        showToast("✨ 저장된 사주 명식을 불러왔습니다.", "success");
      } else {
        showToast("아직 저장된 사주 정보가 없습니다.\n최초 1회 사주를 분석하시면 정보가 자동 저장됩니다!", "info");
      }
    } catch (err) {
      console.error("내 정보 불러오기 실패:", err);
      showToast("정보를 불러오는 중 오류가 발생했습니다.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  // 🪄 파트너 사주 명식 자동 불러오기
  const fetchPartnerSavedInfo = async () => {
    if (!user) {
      showToast("로그인 후 이용 가능합니다!", "warning");
      return;
    }
    if (isAnyActionLoading) return;

    setLoadingAction("partnerInfo");
    try {
      const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();

      if (data && data.partner_birth) {
        const loadedPartner = normalizeStoredPartnerInfo({
          name: data.partner_name || "",
          birth: data.partner_birth || "",
          hour: data.partner_hour || "12",
          min: data.partner_min || "00",
          gender: data.partner_gender || "여자",
          calendarType: data.partner_calendar_type || "양력",
          isTimeKnown: data.partner_is_time_known || false,
        });
        setPartnerInfo(loadedPartner);
        savePartnerInfoToStorage(loadedPartner);
        setShowPartner(true);
        showToast("✨ 저장된 파트너 정보를 불러왔습니다.", "success");
      } else {
        showToast("아직 저장된 파트너 정보가 없습니다.\n분석 시 파트너 정보를 입력하시면 자동 저장됩니다!", "info");
      }
    } catch (err) {
      console.error("파트너 정보 불러오기 실패:", err);
      showToast("정보를 불러오는 중 오류가 발생했습니다.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSavePartnerInfo = () => {
    if (!partnerInfo.name?.trim() && !partnerInfo.birth?.trim()) {
      showToast("저장할 파트너 정보를 입력해 주세요.", "warning");
      return;
    }
    savePartnerInfoToStorage(partnerInfo);
    showToast("💾 파트너 정보가 저장되었습니다.", "success");
  };

  const fetchMyTickets = async (userId: string) => {
    const { data } = await supabase
      .from("user_profiles")
      .select("standard_ticket, premium_ticket")
      .eq("id", userId)
      .single();

    if (data) {
      setStandardTicket(data.standard_ticket ?? 0);
      setPremiumTicket(data.premium_ticket ?? 0);
    }
  };

  const syncDailyFreeStatus = async (userId: string) => {
    const used = await hasTodayFreeSajuInDB(userId);
    setHasUsedDailyFree(used);
    if (used) {
      safeSetItem(`free_saju_${userId}`, getKSTDayBounds().kstDateStr);
    }
  };

  const syncUserEmail = async (authUser: {
    id: string;
    email?: string | null;
    user_metadata?: { email?: string };
  }) => {
    const authEmail = authUser.email || authUser.user_metadata?.email;
    if (!authEmail) return;

    const { data: profile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("id", authUser.id)
      .maybeSingle();

    if (fetchError) {
      console.error("이메일 동기화 조회 에러:", fetchError);
      return;
    }

    if (profile?.email) return;

    if (!profile) {
      const { error } = await supabase.from("user_profiles").upsert({
        id: authUser.id,
        email: authEmail,
      });
      if (error) console.error("이메일 동기화 upsert 에러:", error);
      return;
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({ email: authEmail })
      .eq("id", authUser.id);

    if (error) console.error("이메일 동기화 update 에러:", error);
  };

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
  const savedPartner = loadPartnerInfoFromStorage();
  if (!savedPartner) return;

  const normalized = normalizeStoredPartnerInfo(savedPartner);
  setPartnerInfo(normalized);
  if (normalized.name || normalized.birth) {
    setShowPartner(true);
  }
}, []);

useEffect(() => {
  if (!partnerInfo.name?.trim() && !partnerInfo.birth?.trim()) return;
  savePartnerInfoToStorage(partnerInfo);
}, [partnerInfo]);

useEffect(() => {
  // 1. 현재 로그인 상태 확인
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user || null);
    if (session?.user) {
      fetchMyTickets(session.user.id);
      syncDailyFreeStatus(session.user.id);
      syncUserEmail(session.user);
    }
  });

  // 2. 로그인/로그아웃 등 상태가 변할 때마다 자동 감지
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null);
    if (session?.user) {
      fetchMyTickets(session.user.id);
      syncDailyFreeStatus(session.user.id);
      syncUserEmail(session.user);
    } else {
      setStandardTicket(0);
      setPremiumTicket(0);
      setHasUsedDailyFree(false);
    }
  });

  return () => subscription.unsubscribe();
}, []);

useEffect(() => {
  if (step === "analyzing" || step === "result") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}, [step]);

// 로그아웃 함수
const handleLogout = async () => {
  await supabase.auth.signOut();
  setUser(null);
  setShowHistoryModal(false);
  setSelectedHistory(null);
  setStep("login");
  alert("로그아웃 되었습니다.");
};

const WITHDRAW_CONFIRM_MESSAGE =
  "⚠️ 정말 회원 탈퇴하시겠습니까?\n\n• 보유 중인 스탠다드/프리미엄 티켓이 모두 소멸됩니다.\n• 저장된 사주 보관함 내역이 초기화됩니다.\n• 탈퇴 후 재가입하셔도 기존 티켓은 복구되지 않습니다.\n\n정말 탈퇴를 진행하시려면 [확인]을 눌러주세요.";

const handleWithdraw = async () => {
  if (!user) return;
  if (!window.confirm(WITHDRAW_CONFIRM_MESSAGE)) return;

  setIsWithdrawing(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      alert("세션이 만료되었습니다. 다시 로그인해 주세요.");
      return;
    }

    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId: user.id }),
    });

    const result = await res.json();
    if (!res.ok) {
      alert(result.error || "탈퇴 처리 중 오류가 발생했습니다.");
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setShowHistoryModal(false);
    setSelectedHistory(null);
    setHistoryList([]);
    setStandardTicket(0);
    setPremiumTicket(0);
    setStep("login");
    router.replace("/");
  } catch (err) {
    console.error("회원 탈퇴 에러:", err);
    alert("탈퇴 처리 중 오류가 발생했습니다.");
  } finally {
    setIsWithdrawing(false);
  }
};

// 💾 [사주 기록] 분석 결과를 saju_history에 새 행으로 INSERT (계정 프로필과 무관)
const saveSajuHistory = async (type: string, title: string, content: string) => {
  if (!user) return; // 로그인 안 했으면 패스
  const { error } = await supabase.from('saju_history').insert({
    user_id: user.id,
    type: type,
    title: title,
    content: content
  });
  if (error) console.error("사주 내역 저장 실패:", error);
};

// 👤 [회원 정보] 내 계정 프로필(user_profiles) 저장
// 지인 사주를 볼 때 입력한 이름/생년월일이 내 프로필을 덮어쓰지 않도록,
// 저장된 프로필이 없거나(최초 1회) 저장된 이름과 동일할 때(=본인 명식)만 반영합니다.
const saveMyProfile = async (userId: string) => {
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('display_name, birth_date')
    .eq('id', userId)
    .maybeSingle();

  const isFirstTime = !existingProfile?.birth_date;
  const isOwnerInfo = existingProfile?.display_name === userInfo.name;

  // 이미 내 명식이 저장되어 있는데 다른 사람 이름이 입력된 경우 → 프로필 그대로 유지
  if (!isFirstTime && !isOwnerInfo) return;

  const { error } = await supabase.from('user_profiles').upsert({
    id: userId,
    display_name: userInfo.name,
    birth_date: userInfo.birth,
    birth_hour: userInfo.hour,
    birth_min: userInfo.min,
    gender: userInfo.gender,
    marital_status: userInfo.maritalStatus,
    has_children: userInfo.hasChildren,
    partner_name: hasPartnerBirthInput(partnerInfo) ? partnerInfo.name : null,
    partner_birth: hasPartnerBirthInput(partnerInfo) ? partnerInfo.birth : null,
    partner_gender: hasPartnerBirthInput(partnerInfo) ? partnerInfo.gender : null,
    partner_hour: hasPartnerBirthInput(partnerInfo) ? partnerInfo.hour : null,
    partner_min: hasPartnerBirthInput(partnerInfo) ? partnerInfo.min : null,
    partner_calendar_type: hasPartnerBirthInput(partnerInfo) ? partnerInfo.calendarType : null,
    partner_is_time_known: hasPartnerBirthInput(partnerInfo) ? partnerInfo.isTimeKnown : false
  });

  if (error) {
    console.error("프로필 저장 에러 상세 내역:", error);
  }
};

// 🗂️ [수정] DB에서 내 사주 기록을 가져오는 함수 (안전성 강화 버전)
const fetchMyHistory = async () => {
  if (!user) {
    setShowGuestModal(true);
    return;
  }
  if (isAnyActionLoading) return;

  setLoadingAction("history");
  try {
    await fetchMyTickets(user.id);

    const { data, error } = await supabase
      .from('saju_history')
      .select('*')
      .eq('user_id', user.id) 
      .order('created_at', { ascending: false });

    if (error) {
      console.error("보관함 불러오기 에러 상세:", error.message || error);
      alert("데이터베이스 연결 중입니다. 페이지를 새로고침(F5) 후 다시 시도해주세요!");
    } else {
      setHistoryList(data || []);
      setShowHistoryModal(true);
    }
  } catch (err) {
    console.error("보관함 실행 중 예외 발생:", err);
    alert("보관함을 불러오는 중 오류가 발생했습니다.");
  } finally {
    setLoadingAction(null);
  }
};

  // ── 구글 간편 로그인 로직 ──
  const handleGoogleLogin = async () => {
    if (isAnyActionLoading) return;
    setLoadingAction("google");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        console.error("로그인 에러:", error.message);
        alert("💡 [MVP 테스트 모드] 구글 연동 대기 중! 임시 계정으로 입장을 진행합니다.");
        setStep("input");
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleKakaoLogin = async () => {
    if (isAnyActionLoading) return;
    setLoadingAction("kakao");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) {
        console.error("카카오 로그인 에러:", error.message);
        alert("카카오 로그인 연동 중 문제가 발생했습니다.");
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCloseEmailLoginModal = () => {
    setShowEmailLoginModal(false);
    setEmailInput("");
    setPasswordInput("");
  };

  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailInput.trim() || !passwordInput) {
      alert("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    if (isAnyActionLoading) return;

    setLoadingAction("email");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });

      if (error || !data.session) {
        alert("이메일 또는 비밀번호가 일치하지 않습니다.");
        return;
      }

      handleCloseEmailLoginModal();
      setStep("input");
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePortOnePayment = async () => {
    if (!selectedPackage) {
      alert("결제할 상품을 먼저 선택해 주세요.");
      return;
    }
    if (isAnyActionLoading) return;

    const passName = selectedPackage.category === "premium" ? "프리미엄 패스" : "스탠다드 패스";
    const orderName = `[오늘의사주] ${passName} ${selectedPackage.label}`;

    setLoadingAction("portone");
    try {
      const PortOne = await import("@portone/browser-sdk/v2");
      const paymentId = `payment-${Date.now()}${Math.random().toString(36).slice(2, 11)}`;
      const redirectUrl =
        typeof window !== "undefined" ? `${window.location.origin}/payment/redirect` : undefined;

      safeSessionSetJSON("pending_payment_package", selectedPackage);

      const response = await PortOne.requestPayment({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_CHANNEL_KEY,
        paymentId,
        orderName,
        totalAmount: selectedPackage.price,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        windowType: {
          pc: "IFRAME",
          mobile: "REDIRECTION",
        },
        redirectUrl,
      });

      if (!response) {
        alert("결제 응답을 받지 못했습니다. 다시 시도해 주세요.");
        return;
      }

      if (response.code !== undefined) {
        const message = response.message || "";
        const isCancelled =
          response.code === "FAILURE_TYPE_USER_CANCEL" ||
          message.includes("취소") ||
          message.toLowerCase().includes("cancel");

        if (isCancelled) {
          alert("결제가 취소되었습니다.");
        } else {
          alert(`결제 실패: ${message || response.code}`);
        }
        return;
      }

      if (!user) {
        alert("로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        alert("로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.");
        return;
      }

      const confirmRes = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          paymentId: response.paymentId || paymentId,
          packageId: selectedPackage.id,
        }),
      });

      const confirmJson = await confirmRes.json();

      if (!confirmRes.ok) {
        console.error("결제 검증 실패:", confirmJson.error);
        alert(`결제는 완료되었으나 티켓 반영 중 오류가 발생했습니다: ${confirmJson.error}\n고객센터로 문의해주세요.`);
        return;
      }

      setStandardTicket(confirmJson.standardTicket);
      setPremiumTicket(confirmJson.premiumTicket);

      alert(`✅ 결제가 완료되었습니다!\n[${selectedPackage.label}] ${selectedPackage.tickets}장이 충전되었습니다! 🎉`);
      setShowChargeModal(false);
      setSelectedPackage(null);
    } catch (err) {
      console.error("PortOne 결제 에러:", err);
      alert("결제 처리 중 오류가 발생했습니다.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDepositSubmit = async () => {
    if (!selectedPackage) return alert("구매할 이용권을 선택해 주세요!");
    if (!depositorName.trim()) return alert("입금자명을 입력해 주세요!");
    if (!user) return alert("로그인 정보가 없습니다. 다시 로그인해 주세요.");
    if (isAnyActionLoading) return;

    setLoadingAction("deposit");
    try {
      const { error } = await supabase.from("deposit_requests").insert({
        user_id: user.id,
        user_email: user.email || user.user_metadata?.email || "이메일 없음",
        depositor_name: depositorName,
        amount_krw: selectedPackage.price,
        ticket_type: selectedPackage.category,
        ticket_count: selectedPackage.tickets,
      });

      if (error) {
        console.error("신청 에러:", error);
        alert("신청 중 오류가 발생했습니다. 다시 시도해 주세요.");
      } else {
        alert("✅ 입금 알림이 접수되었습니다!\n관리자 확인 후 1~3분 내로 티켓이 지급됩니다.");
        setShowChargeModal(false);
        setSelectedPackage(null);
        setDepositorName("");
      }
    } finally {
      setLoadingAction(null);
    }
  };
  // ── 사주 분석 시작 ──

// 🎟️ 오늘의 무료 사주를 이미 사용한 경우, 스탠다드 티켓 1장을 차감하고 다시 분석
const handleUseTicketAndRetry = async () => {
  if (!user) return;
  if (standardTicket < 1) {
    alert("스탠다드 티켓이 부족합니다. 이용권을 구매해 주세요!");
    setIsAlreadyUsedModalOpen(false);
    setShowChargeModal(true);
    return;
  }
  try {
    setIsTicketProcessing(true);
    setIsAlreadyUsedModalOpen(false);
    // 티켓 차감은 서버(/api/saju/webhook)가 분석 성공 후 처리합니다.
    await handleAnalyze({ skipFreeLimitCheck: true, saveAsTicketRetry: true });
  } catch (error) {
    console.error("티켓 사용 에러:", error);
    alert("티켓 차감 중 오류가 발생했습니다.");
  } finally {
    setIsTicketProcessing(false);
  }
};

 // --- 사주 분석 시작 (B2B 화이트라벨 DB 연동 + ssaju + n8n) ---
 const handleAnalyze = async (options?: { skipFreeLimitCheck?: boolean; saveAsTicketRetry?: boolean }) => {
  if (!userInfo.name || !userInfo.birth) {
    alert("이름과 생년월일을 정확히 입력해주세요!");
    return;
  }
  if (isAnyActionLoading && !isLoading("analyze")) return;

  setLoadingAction("analyze");
  try {
    if (!options?.skipFreeLimitCheck && user) {
      const alreadyUsed = await hasTodayFreeSajuInDB(user.id);
      if (alreadyUsed) {
        setHasUsedDailyFree(true);
        safeSetItem(`free_saju_${user.id}`, getKSTDayBounds().kstDateStr);
        alert(FREE_SAJU_LIMIT_MESSAGE);
        return;
      }
    }

    setStep("analyzing");
    setLoadingText("명식(命式)을 세우고 타고난 기운의 흐름을 짚어보고 있습니다.\n(예상 소요 시간: 1~2분)");
    // 1. 회원 정보(user_profiles)는 본인 명식일 때만 저장 — 지인 사주 입력값으로 덮어쓰지 않음
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      await syncUserEmail(session.user);
      await saveMyProfile(session.user.id);
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

    // 3. 계산된 만세력 데이터를 서버 API로 전송 (서버가 n8n 호출 + 무료/티켓 사용량을 검증)
    const webhookResult = await callSajuWebhook({
      action: "analyze_saju",
      useTicket: options?.skipFreeLimitCheck ? true : undefined,
      name: userInfo.name,
      sajuData: llmFriendlyData,
      maritalStatus: userInfo.maritalStatus,
      hasChildren: userInfo.hasChildren,
      partnerFields: getPartnerWebhookFields(partnerInfo),
    });

    if (webhookResult.ok) {
      const data = webhookResult.data;
      const rawResult = data.result_text;
      // ... (기존 @@@ 자르는 로직 그대로 유지) ...
      if (rawResult.includes("@@@")) {
        const [mainText, questionsPart] = rawResult.split("@@@");
        setSajuResultText(mainText.trim());
        const dynamicQuestions = questionsPart.split("||").map((q: string) => q.trim()).filter((q: string) => q !== "").map((q: string) => `✨ ${q}`);
        setSuggestedQuestions(dynamicQuestions);
      } else {
        setSajuResultText(rawResult);
      }

      setStep("result");
      setHasUsedDailyFree(true);

      if (typeof data.standardTicket === "number") {
        setStandardTicket(data.standardTicket);
      }

      const { kstDateStr } = getKSTDayBounds();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        safeSetItem(`free_saju_${session.user.id}`, kstDateStr);
      }

      if (!options?.skipFreeLimitCheck) {
        saveSajuHistory(FREE_SAJU_TYPE, FREE_SAJU_TITLE, data.result_text);
      } else if (options.saveAsTicketRetry) {
        saveSajuHistory("standard", "오늘의 운세 (티켓 재조회)", data.result_text);
      } else {
        saveSajuHistory("standard", `[${userInfo.name}]님의 일일 운세`, data.result_text);
      }

      if (hasPartnerBirthInput(partnerInfo)) {
        savePartnerInfoToStorage(partnerInfo);
      }
    } else {
      alert(webhookResult.error || "운세 서버 통신이 지연되고 있습니다. 다시 시도해주세요.");
      setStep("input");
    }
  } catch (error) {
    console.error("처리 중 에러 발생:", error);
    alert("서버 통신 중 에러가 발생했습니다.");
    setStep("input");
  } finally {
    setLoadingAction(null);
  }
};

// 꼬리질문 분석 함수
// 꼬리질문 분석 함수
const handleFollowUp = async (question: string) => {
  if (isFollowUpLoading) return;

  setSelectedQuestion(question);
  setIsFollowUpLoading(true);
  setFollowUpResult("");

  try {
    const webhookResult = await callSajuWebhook({
      action: "follow_up",
      name: userInfo.name,
      sajuData: sajuResultText,
      question: question,
      maritalStatus: userInfo.maritalStatus,
    });

    if (webhookResult.ok) {
      const data = webhookResult.data;
      const rawText = data.result_text;
      let cleanText = rawText; // DB 저장용 텍스트

      // 💡 핵심: AI가 던져준 '||' 기호를 기준으로 답변과 질문을 가위질합니다!
      if (rawText.includes("||")) {
        const parts = rawText.split("||");
        cleanText = parts[0].trim(); // 기호 앞부분(순수 답변)만 빼냅니다.
        setFollowUpResult(cleanText); // 결과창에 출력

        // 나머지 조각들(추천 질문)은 칩 버튼으로 싹 갈아끼우기
        const newQuestions = parts.slice(1).map((q: string) => q.trim()).filter((q: string) => q !== "");
        if (newQuestions.length > 0) {
          setSuggestedQuestions(newQuestions);
        }
      } else {
        setFollowUpResult(rawText);
      }

      if (typeof data.standardTicket === "number") {
        setStandardTicket(data.standardTicket);
      }

      // 👇 꼬리질문 내용도 DB에 저장!
      saveSajuHistory("followup", question, cleanText);

    } else {
      setFollowUpResult(webhookResult.error || "서버 통신이 지연되고 있습니다. 다시 시도해주세요.");
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
    if (isAnyActionLoading) return;

    setLoadingAction("menu");
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setShowGuestModal(true);
        return;
      }

      await syncUserEmail(session.user);

      if (!userInfo.name || !userInfo.birth) {
        alert("사주 정보가 초기화되었습니다. 메인 화면에서 다시 입력해주세요.");
        setStep("input");
        return;
      }

      setStep("analyzing");
      setLoadingText(`선택하신 [${title}]의 흐름을 명리학적으로 깊이 짚어보고 있습니다.\n(예상 소요 시간: 1~2분)`);
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

      // 5. 서버 API로 전송 (action: menu_click) — 서버가 티켓 차감 + n8n 호출을 함께 처리
      const webhookResult = await callSajuWebhook({
        action: "menu_click",
        name: userInfo.name,
        sajuData: llmFriendlyData,
        category: title,
        maritalStatus: userInfo.maritalStatus,
        hasChildren: userInfo.hasChildren,
        partnerFields: getPartnerWebhookFields(partnerInfo),
      });

      if (webhookResult.ok) {
        const data = webhookResult.data;
        const rawResult = data.result_text;
      if (rawResult.includes("@@@")) {
        const [mainText, questionsPart] = rawResult.split("@@@");
        setSajuResultText(mainText.trim());
        const dynamicQuestions = questionsPart.split("||").map(q => q.trim()).filter(q => q !== "").map(q => `✨ ${q}`);
        setSuggestedQuestions(dynamicQuestions);
      } else {
        setSajuResultText(rawResult);
      }
        setStep("result");
        window.scrollTo({ top: 0, behavior: 'smooth' }); // 화면 맨 위로 부드럽게 스크롤
        if (typeof data.standardTicket === "number") {
          setStandardTicket(data.standardTicket);
        }
        saveSajuHistory("menu", title, data.result_text);
      } else {
        alert(webhookResult.error || "서버 통신이 지연되고 있습니다. 다시 시도해주세요.");
        setStep("result");
      }
    } catch (error) {
      console.error("처리 중 에러 발생:", error);
      alert("서버 에러가 발생했습니다.");
      setStep("result");
    } finally {
      setLoadingAction(null);
    }
  };

const handlePremiumClick = async () => {
  if (isAnyActionLoading) return;

  setLoadingAction("premium");
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("🎁 회원가입 후 이용 가능합니다!");
      handleGoogleLogin();
      return;
    }

    await syncUserEmail(session.user);

    setStep("analyzing");
    setLoadingText("대운(大運)과 세운(歲運)을 교차하여 심층 마스터플랜을 구성 중입니다.\n운명의 전체 궤도를 분석하는 정밀 작업으로 약 5~9분 정도 소요됩니다.");
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
    const partnerFields = getPartnerWebhookFields(partnerInfo);

    // 4. 서버 API로 프리미엄 노드 호출 — 서버가 프리미엄 티켓 차감 + n8n 호출을 함께 처리
    const webhookResult = await callSajuWebhook({
      action: "premium_saju",
      name: userInfo.name,
      sajuData: llmFriendlyData,
      maritalStatus: userInfo.maritalStatus,
      hasChildren: userInfo.hasChildren,
      partnerFields,
    });

    if (webhookResult.ok) {
      const data = webhookResult.data;
      const rawResult = data.result_text;
        if (rawResult.includes("@@@")) {
          const [mainText, questionsPart] = rawResult.split("@@@");
          setSajuResultText(mainText.trim());
          const dynamicQuestions = questionsPart.split("||").map(q => q.trim()).filter(q => q !== "").map(q => `✨ ${q}`);
          setSuggestedQuestions(dynamicQuestions);
        } else {
          setSajuResultText(rawResult);
        }
      setStep("result");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (typeof data.premiumTicket === "number") {
        setPremiumTicket(data.premiumTicket);
      }
      saveSajuHistory("premium", "프리미엄 인생 마스터플랜", data.result_text);
    } else {
      alert(webhookResult.error || "서버 통신이 지연되고 있습니다. 다시 시도해주세요.");
      setStep("result");
    }
  } catch (error) {
    console.error(error);
    alert("프리미엄 분석 중 오류가 발생했습니다.");
    setStep("result");
  } finally {
    setLoadingAction(null);
  }
};

  const handlePendingPaymentConfirm = async () => {
    if (!pendingPayment || !user) return;
    if (isAnyActionLoading) return;

    setLoadingAction("pending");
    try {
      // 실제 티켓 차감은 서버(/api/saju/webhook)가 각 분석 요청 처리 성공 후에 수행합니다.
      // 여기서는 명백히 잔여 티켓이 없는 경우에만 미리 안내해 불필요한 요청을 막습니다.
      const isPremium = pendingPayment.type === "premium";
      const currentTicketCount = isPremium ? premiumTicket : standardTicket;

      if (currentTicketCount < 1) {
        alert("이용권이 부족합니다. 이용권 구매 후 이용해주세요!");
        setPendingPayment(null);
        setShowChargeModal(true);
        return;
      }

      const action = pendingPayment;
      setPendingPayment(null);
      setLoadingAction(null);

      setShowSajuDashboard(false);
      setDashboardSajuResult(null);

      if (action.type === "premium") {
        await handlePremiumClick();
      } else if (action.type === "menu") {
        await handleMenuClick(action.payload.title, action.payload.title, action.payload.desc);
      } else if (action.type === "followup") {
        await handleFollowUp(action.payload);
      } else if (action.type === "other_saju") {
        await handleAnalyze({ skipFreeLimitCheck: true });
      }
    } catch (err) {
      console.error("이용권 차감 후 분석 시작 실패:", err);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOpenFreeManseryeok = () => {
    if (isAnyActionLoading) return;

    if (!userInfo.name?.trim() || !userInfo.birth?.trim()) {
      showToast("먼저 상단에 사주 명식(이름·생년월일)을 입력해 주세요.", "warning");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const result = calculateSajuFromUserInfo(userInfo);
    if (!result) {
      showToast("생년월일 형식을 확인해 주세요. (6자리, 예: 900515)", "warning");
      return;
    }

    setDashboardSajuResult(result);
    setShowSajuDashboard(true);
  };

  const handleFortuneMenuClick = (item: FortuneMenuItem) => {
    if (isAnyActionLoading) return;

    if (item.isFree) {
      handleOpenFreeManseryeok();
      return;
    }

    if (!user) {
      setShowGuestModal(true);
      return;
    }

    setPendingPayment({ type: "menu", title: item.title, payload: item });
  };

  const handleDashboardMenuSelect = (menuTitle: string) => {
    if (!user) {
      setShowGuestModal(true);
      return;
    }

    if (menuTitle === PREMIUM_MENU_KEY) {
      setPendingPayment({ type: "premium", title: "프리미엄 인생 마스터플랜", payload: null });
      return;
    }

    const item = FORTUNE_MENU_ITEMS.find((m) => m.title === menuTitle);
    if (item && !item.isFree) {
      setPendingPayment({ type: "menu", title: item.title, payload: item });
    }
  };

  const modalOverlayZ = showSajuDashboard ? "z-[120]" : "z-[100]";

  return (
    <main className="min-h-screen relative overflow-hidden bg-[var(--bg-base)] text-[var(--text-body)] font-sans selection:bg-[var(--brand-primary)]/30">
      
      {/* 🌠 별빛 & 우주 CSS 효과 */}
      <style>{`
        .cosmic-bg { background: radial-gradient(circle at 50% 0%, #2a0b4c 0%, var(--bg-base) 60%, #000000 100%); }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 10px var(--brand-primary); }
        }
        .star { position: absolute; background-color: var(--brand-primary); border-radius: 50%; animation: twinkle var(--duration) infinite ease-in-out var(--delay); }
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
      <header className="fixed top-0 w-full flex justify-between items-center p-4 md:p-5 bg-[var(--bg-base)]/80 backdrop-blur-md z-50 border-b border-[#30155c]/50 max-w-xl mx-auto left-0 right-0">
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setStep("login")}>
          <Star className="text-[var(--brand-primary)] w-5 h-5 fill-[var(--brand-primary)] shrink-0" />
          <span className="text-[var(--brand-primary)] font-bold tracking-widest text-base md:text-lg whitespace-nowrap">오늘의사주</span>
          <span className="text-[10px] bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] px-1.5 py-0.5 rounded border border-[var(--brand-primary)]/40 shrink-0">PRO</span>
        </div>
        
        {user && (
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            {/* 유저 이름 표시 */}
            <div className="text-xs text-[var(--text-muted)] hidden sm:block whitespace-nowrap">
              <span className="font-bold text-[var(--text-body)]">{user.user_metadata?.name || "고객"}</span>님
            </div>
            
            <button 
              onClick={fetchMyHistory}
              disabled={isLoading("history")}
              className="flex items-center justify-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--text-muted)]/50 px-2 py-1.5 sm:px-3 rounded-full hover:bg-[var(--brand-primary)]/20 hover:border-[var(--brand-primary)] transition-all shadow-[0_0_10px_rgba(212,175,55,0.1)] group shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm">🗂️</span>
              <span className="hidden sm:inline-block text-xs md:text-sm font-bold text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors whitespace-nowrap">
                {isLoading("history") ? "불러오는 중..." : "마이페이지"}
              </span>
            </button>

            {/* 🌟 이용권 잔액 및 구매 버튼 */}
            <div className="flex items-center bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-full p-1 pl-2 sm:pl-3 shadow-[0_0_10px_rgba(212,175,55,0.15)] shrink-0">
              <span className="text-xs sm:text-sm font-bold mr-1.5 sm:mr-2 flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                <span className="text-[var(--text-body)]">🎟️</span>
                <span className="text-[var(--brand-primary)]">{standardTicket}</span>
                <span className="text-[var(--text-muted)] mx-0.5">|</span>
                <span className="text-[var(--text-body)]">👑</span>
                <span className="text-[var(--brand-primary)]">{premiumTicket}</span>
              </span>
              <button
                onClick={() => setShowChargeModal(true)}
                className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] text-xs font-extrabold px-2 sm:px-3 py-1.5 rounded-full hover:scale-105 transition-transform whitespace-nowrap shrink-0"
              >
                <span className="sm:hidden">구매</span>
                <span className="hidden sm:inline">이용권 구매</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-md mx-auto pt-24 pb-20 px-5 flex flex-col min-h-screen justify-center relative z-10">
        
        {/* 📋 [씬 1] 구글 간편 로그인 (온보딩) - 가독성 스케일업 버전 */}
        {(step === "login" || step === "input") && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 text-center">
              
              <div className="space-y-5 pt-6">
                <div className="inline-flex items-center gap-2 bg-[var(--bg-hover)] border border-[var(--brand-primary)]/30 px-5 py-2.5 rounded-full">
                  <Gift size={18} className="text-[var(--brand-primary)]" />
                  <span className="text-sm font-bold text-[var(--brand-primary)]">매일 접속 시 '오늘의 종합사주' 1회 무료!</span>
                </div>
                
                {/* 메인 타이틀 크기 대폭 확대 */}
               {/* 메인 타이틀 줄바꿈 및 가독성 최적화 */}
               <h1 className="text-3xl sm:text-4xl md:text-5xl font-light leading-snug text-[var(--text-body)] tracking-wide pt-2 break-keep">
                  <span className="inline-block">나의 가장 궁금한 답</span><br />
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-primary-hover)] to-[var(--brand-primary)] inline-block mt-2">사주에서 찾습니다</span>
                </h1>
                
                {/* 서브 텍스트 크기 확대 */}
                <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed pt-3">
                  복잡한 회원가입 없이 단 1초 만에 시작하세요.<br />
                  지금 시작하면 심층 풀이용 <span className="text-[var(--brand-primary)] font-bold text-lg">스탠다드 패스 1장</span>을 드립니다.
                </p>
              </div>

              {/* 구글 로그인 & 상태 감지 버튼 그룹 */}
              <div className="flex flex-col items-center justify-center gap-5 mt-8 w-full z-10 relative">
                {user ? (
                  // [로그인 O] 로그인이 되어 있을 때 보이는 화면
                  <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-500">
                    <div className="text-[var(--text-on-brand)] font-bold text-lg bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-soft)] px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                      ✨ {user.user_metadata?.name || "고객"}님, 환영합니다!
                    </div>
                    <button 
                      onClick={handleLogout} 
                      className="text-xs text-[var(--text-muted)] underline hover:text-[var(--text-body)] transition-colors"
                    >
                      다른 계정으로 로그인 (로그아웃)
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 w-full">
                    {/* 카카오 로그인 버튼 */}
                    <button
                      onClick={handleKakaoLogin}
                      disabled={isAnyActionLoading}
                      className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] text-lg font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(254,229,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading("kakao") ? (
                        <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
                      ) : (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3C6.477 3 2 6.425 2 10.648c0 2.706 1.706 5.07 4.3 6.355-.26.965-1.01 3.76-1.04 3.882-.04.144.05.155.12.11 1.05-.67 4.12-2.82 4.12-2.82.82.16 1.66.25 2.5.25 5.523 0 10-3.425 10-7.648C22 6.425 17.523 3 12 3z" fill="#000000"/>
                          </svg>
                          <span>카카오로 1초 만에 시작</span>
                        </>
                      )}
                    </button>

                    {/* 구글 로그인 버튼 */}
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isAnyActionLoading}
                      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 text-lg font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading("google") ? (
                        <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
                      ) : (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          <span>Google 계정으로 시작</span>
                        </>
                      )}
                    </button>

                    {/* 이메일 로그인 버튼 */}
                    <button
                      onClick={() => setShowEmailLoginModal(true)}
                      className="w-full flex items-center justify-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-alt)] border border-[var(--brand-primary)]/50 hover:border-[var(--brand-primary)] text-[var(--brand-primary)] text-sm font-bold py-3.5 rounded-xl transition-all shadow-[0_0_10px_rgba(212,175,55,0.08)]"
                    >
                      <span>✉️</span>
                      <span>이메일 계정으로 시작</span>
                    </button>
                  </div>
                )}

                {/* 안내선 */}
                <div className="flex items-center justify-center gap-4 py-4 mt-2 w-full opacity-50">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[var(--border-default)]"></div>
                  <span className="text-sm text-[var(--text-muted)] font-medium tracking-wide">사주 명식 입력</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[var(--border-default)]"></div>
                </div>
              </div>
            </div>
          )}

      {/* 📋 [씬 2] 디테일한 사주 정보 입력 폼 (숨김 해제 및 즉시 표시) */}
      {(step === "login" || step === "input") && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 mt-2">
          {/* 입력 폼 배경 */}
          <div className="bg-[var(--bg-surface)]/90 backdrop-blur-xl p-7 rounded-3xl border border-[var(--border-strong)]/60 shadow-2xl space-y-6 text-left relative z-20">
            {/* 👇 새로 추가할 '내 명식 자동 입력' 버튼 👇 */}
            {user && (
              <div className="flex justify-end -mt-2 mb-2">
                <button 
                  type="button"
                  onClick={fetchMySavedInfo}
                  disabled={isLoading("myInfo")}
                  className="flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/60 text-[var(--brand-primary)] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--brand-primary)]/20 transition-all shadow-[0_0_10px_rgba(212,175,55,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {renderLoadingContent("myInfo", "✨ 내 사주 명식 자동 입력하기")}
                </button>
              </div>
            )}
            {/* 1. 성함 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 ml-1">성함</label>
              <input type="text" placeholder="예: 홍길동" value={userInfo.name}
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-4 text-base text-[var(--text-body)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
              />
            </div>

            {/* 2. 성별 & 양력/음력 (그리드) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 ml-1">성별</label>
                <div className="grid grid-cols-2 gap-2">
                  {["남", "여"].map((g) => (
                    <button key={g} type="button" onClick={() => setUserInfo({ ...userInfo, gender: g === "남" ? "남자" : "여자" })}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all ${userInfo.gender === (g === "남" ? "남자" : "여자") ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-default)]"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 ml-1">양력/음력</label>
                <div className="grid grid-cols-2 gap-2">
                  {["양력", "음력"].map((c) => (
                    <button key={c} type="button" onClick={() => setUserInfo({ ...userInfo, calendarType: c })}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all ${userInfo.calendarType === c ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-default)]"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 ml-1">생년월일 (6자리)</label>
              <input type="number" placeholder="950505" value={userInfo.birth}
                onChange={(e) => setUserInfo({ ...userInfo, birth: e.target.value })}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-4 text-base text-[var(--text-body)] focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>

            {/* 4. 태어난 시간 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 ml-1">태어난 시간</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button type="button" onClick={() => setUserInfo({ ...userInfo, isTimeKnown: false, hour: "99" })}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${!userInfo.isTimeKnown ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>
                  ❔ 시간 모름
                </button>
                <button type="button" onClick={() => setUserInfo({ ...userInfo, isTimeKnown: true, hour: "12" })}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${userInfo.isTimeKnown ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>
                  🕒 시간 입력
                </button>
              </div>
              {/* 시간 입력칸 (시간을 안다고 선택했을 때만 보임) */}
              {userInfo.isTimeKnown && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95">
                  <select value={userInfo.hour} onChange={(e) => setUserInfo({ ...userInfo, hour: e.target.value })} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-2 py-3 text-[var(--text-body)]">
                    {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{h}시</option>)}
                  </select>
                  <select value={userInfo.min} onChange={(e) => setUserInfo({ ...userInfo, min: e.target.value })} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-2 py-3 text-[var(--text-body)]">
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => <option key={m} value={m}>{m}분</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* 5. 결혼/자녀 유무 */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border-default)]/50">
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 ml-1">결혼 유무</label>
                <div className="grid grid-cols-3 gap-1">
                  {["기혼", "연애", "싱글"].map((s) => (
                    <button key={s} type="button" onClick={() => setUserInfo({ ...userInfo, maritalStatus: s })}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${userInfo.maritalStatus === s ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 ml-1">자녀 유무</label>
                <div className="grid grid-cols-2 gap-1">
                  {["있음", "없음"].map((k) => (
                    <button key={k} type="button" onClick={() => setUserInfo({ ...userInfo, hasChildren: k })}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${userInfo.hasChildren === k ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
{/* 6. 파트너 정보 입력 (추가) */}
<div className="mt-6 p-4 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-strong)]">
              {/* 모바일 가독성을 위해 제목과 버튼을 위아래로 분리했습니다 */}
              <div className="flex flex-col space-y-3 mb-4">
                
                {/* 라벨 (제목) */}
                <label className="text-sm text-[var(--text-muted)] font-bold flex items-center">
                  ❤️ 파트너/배우자 정보 <span className="text-xs text-[var(--text-muted)] font-normal ml-2">(선택 · 짝사랑, 썸, 재회 모두 가능)</span>
                </label>
                
                {/* 버튼 그룹 (반반 꽉 차게 디자인) */}
                <div className="flex flex-wrap gap-2 w-full">
                  {user && (
                    <button
                      type="button"
                      onClick={fetchPartnerSavedInfo}
                      disabled={isLoading("partnerInfo")}
                      className="flex-1 min-w-[calc(50%-0.25rem)] py-3 rounded-xl text-xs font-bold border border-[var(--text-muted)]/50 bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated-alt)] hover:text-[var(--text-body)] transition-all shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {renderLoadingContent("partnerInfo", "✨ 자동 불러오기")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSavePartnerInfo}
                    className="flex-1 min-w-[calc(50%-0.25rem)] py-3 rounded-xl text-xs font-bold border border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20 transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    💾 파트너 정보 저장
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowPartner(!showPartner)}
                    className={`flex-1 min-w-[calc(50%-0.25rem)] py-3 rounded-xl text-xs font-bold border transition-all shadow-sm flex items-center justify-center ${
                      showPartner 
                        ? "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]" 
                        : "border-[var(--brand-primary)]/60 bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/25"
                    }`}
                  >
                    {showPartner ? "입력창 닫기" : "직접 입력하기"}
                  </button>
                </div>
              </div>
              
              {showPartner && (
  <div className="space-y-4 mt-4 animate-in slide-in-from-top-2 duration-300">
    <input 
  placeholder="파트너 성함" 
  className="w-full bg-[var(--bg-base)] p-3 rounded-xl text-sm text-[var(--text-body)] border border-[var(--border-default)]"
  value={partnerInfo.name}
  onChange={(e) => setPartnerInfo({...partnerInfo, name: e.target.value})}
/>
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => setPartnerInfo({...partnerInfo, gender: "남자"})}
        className={`py-2 rounded-lg text-xs font-bold border ${partnerInfo.gender === "남자" ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)]" : "bg-[var(--bg-base)] border-[var(--border-default)]"}`}>남자</button>
      <button type="button" onClick={() => setPartnerInfo({...partnerInfo, gender: "여자"})}
        className={`py-2 rounded-lg text-xs font-bold border ${partnerInfo.gender === "여자" ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)]" : "bg-[var(--bg-base)] border-[var(--border-default)]"}`}>여자</button>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {["양력", "음력"].map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setPartnerInfo({ ...partnerInfo, calendarType: c })}
          className={`py-2 rounded-lg text-xs font-bold border ${partnerInfo.calendarType === c ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}
        >
          {c}
        </button>
      ))}
    </div>
    <input 
  placeholder="생년월일 (6자리)" 
  className="w-full bg-[var(--bg-base)] p-3 rounded-xl text-sm text-[var(--text-body)] border border-[var(--border-default)]"
  value={partnerInfo.birth}
  onChange={(e) => setPartnerInfo({...partnerInfo, birth: e.target.value})}
/>
    <div className="flex gap-2">
      <button type="button" onClick={() => setPartnerInfo({...partnerInfo, isTimeKnown: false})}
        className={`flex-1 py-2 rounded-lg text-xs border ${!partnerInfo.isTimeKnown ? "border-[var(--brand-primary)]" : "border-[var(--border-default)]"}`}>시간 모름</button>
      <button type="button" onClick={() => setPartnerInfo({...partnerInfo, isTimeKnown: true})}
        className={`flex-1 py-2 rounded-lg text-xs border ${partnerInfo.isTimeKnown ? "border-[var(--brand-primary)]" : "border-[var(--border-default)]"}`}>시간 입력</button>
    </div>
    {partnerInfo.isTimeKnown && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 mt-2">
              <select 
                value={partnerInfo.hour} 
                onChange={(e) => setPartnerInfo({...partnerInfo, hour: e.target.value})} 
                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-2 py-3 text-[var(--text-body)] text-sm"
              >
                {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{h}시</option>)}
              </select>
              <select 
                value={partnerInfo.min} 
                onChange={(e) => setPartnerInfo({...partnerInfo, min: e.target.value})} 
                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-2 py-3 text-[var(--text-body)] text-sm"
              >
                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => <option key={m} value={m}>{m}분</option>)}
              </select>
            </div>
          )}
  </div>
)}
            </div>
             {/* 개인정보 동의 체크박스 */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <input 
                type="checkbox" 
                id="agree" 
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="w-4 h-4 accent-[var(--brand-primary)]"
              />
              <label htmlFor="agree" className="text-xs text-[var(--text-muted)] cursor-pointer">
                (필수) 개인정보 수집 및 이용에 동의합니다.
              </label>
            </div>
            
            {/* 분석 버튼 */}
            <button 
              disabled={hasUsedDailyFree || isLoading("analyze")}
              onClick={async () => {
                if (hasUsedDailyFree) {
                  alert(FREE_SAJU_LIMIT_MESSAGE);
                  return;
                }
                if (!isAgreed) {
                  return alert("서비스 이용을 위해 개인정보 수집 및 이용에 동의해 주세요.");
                }
                if (!user) {
                  setShowGuestModal(true);
                  return; 
                }

                if (partnerInfo.name?.trim() || partnerInfo.birth?.trim()) {
                  savePartnerInfoToStorage(partnerInfo);
                }

                await handleAnalyze();
              }}
              className={`w-full py-4 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] font-extrabold rounded-2xl text-lg shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 ${
                hasUsedDailyFree || isLoading("analyze") ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
              }`}
            >
              {hasUsedDailyFree ? (
                <>오늘 조회 완료</>
              ) : isLoading("analyze") ? (
                <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
              ) : (
                <>오늘의 사주 무료보기 ✨</>
              )}
            </button>
          </div>
        </div>
      )}

        {/* 🎬 [씬 3] 로딩 애니메이션 */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center space-y-8 h-[50vh] animate-in fade-in duration-500 text-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 border border-[var(--brand-primary)]/30 rounded-full animate-orbit">
                <div className="absolute -top-1 left-1/2 w-2.5 h-2.5 bg-[var(--brand-primary)] rounded-full shadow-[0_0_10px_var(--brand-primary)]"></div>
              </div>
              <div className="absolute inset-3 border border-[#6b3eb0]/40 rounded-full animate-orbit" style={{ animationDirection: 'reverse', animationDuration: '15s' }}></div>
              <Compass size={36} className="text-[var(--brand-primary)] animate-pulse" />
            </div>
            
            {/* 로딩 텍스트 */}
            <p className="text-[var(--brand-primary)] text-sm tracking-wide animate-pulse px-4 leading-relaxed font-light whitespace-pre-wrap">
              {loadingText}
            </p>
            
            {/* 🌟 새로 추가한 버튼 */}
            <button 
              onClick={() => {
                alert("분석이 진행 중입니다.\n완료되면 '사주 보관함'에서 바로 확인하실 수 있어요!");
                setStep("result"); // 로딩 화면에서 바로 메인 결과 화면으로 전환
              }}
              className="mt-6 px-6 py-2.5 text-xs text-[var(--text-muted)] border border-[var(--text-muted)]/50 rounded-full hover:bg-[var(--text-muted)]/10 hover:text-[var(--text-body)] transition-all"
            >
              사주 보관함에서 나중에 결과보기 ✨
            </button>
          </div>
        )}

        {/* 🎬 [씬 4] 오늘의 무료 사주 & 관심분야 꼬리질문 (핵심 도파민 루프) */}
        {step === "result" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* 1. 오늘의 무료 종합 사주 리포트 (미끼 투척) */}
            <div className="bg-gradient-to-br from-[var(--bg-elevated)] to-[#0d051c] p-6 rounded-3xl border-2 border-[var(--brand-primary)]/50 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[var(--brand-primary)] text-[var(--text-on-brand)] text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                당신의 운세
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-[var(--brand-primary)]" size={18} />
                <h3 className="text-base font-bold text-[var(--text-body)]">
  {userInfo.name}님의 <span className="text-[var(--brand-primary)]">오늘</span> 운세
</h3>
              </div>
              
              <div className="text-[var(--text-muted)] text-base md:text-lg leading-relaxed tracking-wide mb-6 whitespace-pre-wrap">
        {sajuResultText.replaceAll("**", "")}
      </div>

      {/* --- 꼬리질문 UI 시작 --- */}
      <div className="mt-8 pt-6 border-t border-[var(--border-default)]/50 animate-in fade-in slide-in-from-bottom-4 duration-700 mb-6">
              
              {/* 1. 최초 상태 (결과가 없을 때 상단에 표시) */}
              {!followUpResult && !isFollowUpLoading && (
                <>
                  <h4 className="text-[var(--brand-primary-soft)] text-sm font-bold mb-4 flex items-center gap-2">
                    ✨ 더 궁금한 내용이 있나요?
                  </h4>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isAnyActionLoading || isFollowUpLoading) return;
                          if (!user) {
                            setShowGuestModal(true);
                            return;
                          }
                          setPendingPayment({ type: "followup", title: "심층 꼬리질문", payload: q });
                        }}
                        disabled={isAnyActionLoading || isFollowUpLoading}
                        className="bg-[var(--bg-muted)] border border-[var(--border-strong)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 text-[var(--text-muted)] hover:text-[var(--brand-primary-soft)] text-sm md:text-base font-medium px-4 py-3.5 rounded-2xl transition-all text-left leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 2. 로딩 애니메이션 */}
              {isFollowUpLoading && (
                <div className="text-center py-6 bg-[var(--bg-base)]/50 rounded-xl border border-[var(--border-default)]/30">
                  <div className="animate-spin w-6 h-6 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-xs text-[var(--text-muted)]">명리학자가 {userInfo.name}님의 질문을 분석하고 있습니다...</p>
                </div>
              )}
              
              {/* 3. 추가 질문 결과 창 & 새로운 꼬리질문 버튼 */}
              {followUpResult && !isFollowUpLoading && (
                <div className="bg-[var(--bg-base)] border border-[var(--brand-primary)]/40 rounded-xl p-5 shadow-[0_0_15px_rgba(212,175,55,0.1)] animate-in fade-in zoom-in-95">
                  <p className="text-xs font-bold text-[var(--brand-primary)] mb-3 pb-2 border-b border-[var(--brand-primary)]/20">💡 {selectedQuestion}</p>
                  <div className="text-[var(--text-muted)] text-base md:text-lg leading-relaxed tracking-wide whitespace-pre-wrap">
                    {followUpResult}
                  </div>
                  
                  {/* 👇 새로 생성된 버튼들이 결과창 맨 밑에 뜹니다! 👇 */}
                  <div className="mt-6 pt-4 border-t border-[var(--brand-primary)]/20">
                    <p className="text-[var(--brand-primary-soft)] text-sm font-bold mb-3 flex items-center gap-2">
                      ✨ 다음은 무엇이 궁금하신가요?
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (!user) {
                              setShowGuestModal(true);
                              return;
                            }
                            // 꼬리질문 결제 대기열에 올림 (300P)
                            setPendingPayment({ type: "followup", title: "심층 꼬리질문", payload: q });
                          }}
                          className="bg-[var(--bg-muted)] border border-[var(--border-strong)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 text-[var(--text-muted)] hover:text-[var(--brand-primary-soft)] text-sm md:text-base font-medium px-4 py-3.5 rounded-2xl transition-all text-left leading-relaxed"
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

              <div className="bg-[var(--bg-base)]/80 rounded-xl p-3 border border-[var(--border-default)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>✨ 내일 밤 12시 무료 사주 1회 갱신</span>
                <span className="text-[var(--brand-primary)] font-bold flex items-center gap-1"><CheckCircle2 size={12}/> 출석 완료</span>
              </div>
            </div>
{/* 📝 명식 확인/수정 아코디언 (접이식) */}
<div className="bg-[var(--bg-surface)]/80 border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-lg mt-4">
              {/* 토글 버튼 */}
              <button
                onClick={() => setShowResultForm(!showResultForm)}
                className="w-full flex justify-between items-center p-4 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📝</span>
                  <span className="text-sm font-bold text-[var(--text-muted)]">내 사주 명식 확인 및 수정</span>
                </div>
                <span className="text-[var(--brand-primary)] text-xs font-bold bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 px-3 py-1.5 rounded-full transition-all">
                  {showResultForm ? "접어두기 ▲" : "열어보기 ▼"}
                </span>
              </button>

              {/* 열렸을 때 보이는 입력 폼 (메인 입력창과 동일하게 구성) */}
              {showResultForm && (
                <div className="p-6 border-t border-[var(--border-default)] bg-[var(--bg-surface)]/90 space-y-6 animate-in slide-in-from-top-2">
                  
                  {/* ✨ 내 명식 자동 입력 버튼 */}
                  {user && (
                    <button 
                      type="button"
                      onClick={fetchMySavedInfo}
                      disabled={isLoading("myInfo")}
                      className="w-full flex items-center justify-center gap-2 bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/60 text-[var(--brand-primary)] px-4 py-3 rounded-xl text-sm font-bold hover:bg-[var(--brand-primary)]/20 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {renderLoadingContent("myInfo", "✨ 내 사주 명식 자동 입력하기")}
                    </button>
                  )}

                  {/* 성함 */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">성함</label>
                    <input type="text" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm focus:border-[var(--brand-primary)] outline-none" />
                  </div>

                  {/* 성별 & 양음력 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">성별</label>
                      <div className="flex bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border-default)]">
                        {["남자", "여자"].map(g => (
                          <button key={g} onClick={() => setUserInfo({ ...userInfo, gender: g })} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${userInfo.gender === g ? "bg-[var(--brand-primary)] text-[var(--text-on-brand)]" : "text-[var(--text-muted)]"}`}>{g}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">양력/음력</label>
                      <div className="flex bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border-default)]">
                        {["양력", "음력"].map(c => (
                          <button key={c} onClick={() => setUserInfo({ ...userInfo, calendarType: c })} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${userInfo.calendarType === c ? "bg-[var(--brand-primary)] text-[var(--text-on-brand)]" : "text-[var(--text-muted)]"}`}>{c}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 생년월일 */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">생년월일(6자리)</label>
                    <input type="number" value={userInfo.birth} onChange={(e) => setUserInfo({ ...userInfo, birth: e.target.value })} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm focus:border-[var(--brand-primary)] outline-none" />
                  </div>

                  {/* 태어난 시간 */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">태어난 시간</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button onClick={() => setUserInfo({ ...userInfo, isTimeKnown: false })} className={`py-3 rounded-xl text-sm font-bold border transition-all ${!userInfo.isTimeKnown ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>? 시간 모름</button>
                      <button onClick={() => setUserInfo({ ...userInfo, isTimeKnown: true })} className={`py-3 rounded-xl text-sm font-bold border transition-all ${userInfo.isTimeKnown ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>🕒 시간 입력</button>
                    </div>
                    {userInfo.isTimeKnown && (
                      <div className="grid grid-cols-2 gap-3">
                        <select value={userInfo.hour} onChange={(e) => setUserInfo({ ...userInfo, hour: e.target.value })} className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm outline-none">{Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}시</option>)}</select>
                        <select value={userInfo.min} onChange={(e) => setUserInfo({ ...userInfo, min: e.target.value })} className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm outline-none">{Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{i}분</option>)}</select>
                      </div>
                    )}
                  </div>
                  {/* 결혼/자녀 유무 (수정 폼 추가) */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border-default)]/50">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">결혼 유무</label>
              <div className="grid grid-cols-3 gap-1">
                {["기혼", "연애", "싱글"].map((s) => (
                  <button key={s} type="button" onClick={() => setUserInfo({ ...userInfo, maritalStatus: s })}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${userInfo.maritalStatus === s ? "bg-[var(--brand-primary)] text-[var(--text-on-brand)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">자녀 유무</label>
              <div className="grid grid-cols-2 gap-1">
                {["있음", "없음"].map((k) => (
                  <button key={k} type="button" onClick={() => setUserInfo({ ...userInfo, hasChildren: k })}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${userInfo.hasChildren === k ? "bg-[var(--brand-primary)] text-[var(--text-on-brand)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
                  {/* 💖 접이식 폼 내부 파트너 정보 */}
                  <div className="mt-6 pt-6 border-t border-[var(--border-default)]">
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-4">❤️ 파트너/배우자 정보 (선택 · 짝사랑, 썸, 재회 모두 가능)</label>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        type="button"
                        onClick={fetchPartnerSavedInfo}
                        disabled={isLoading("partnerInfo")}
                        className="text-xs bg-[var(--bg-elevated)] border border-[var(--text-muted)]/50 text-[var(--text-muted)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-elevated-alt)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {renderLoadingContent("partnerInfo", "✨ 자동 불러오기")}
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePartnerInfo}
                        className="text-xs bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/50 text-[var(--brand-primary)] px-3 py-1.5 rounded-lg hover:bg-[var(--brand-primary)]/20"
                      >
                        💾 파트너 정보 저장
                      </button>
                    </div>

                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="파트너 성함" 
                        value={partnerInfo.name} 
                        onChange={(e) => setPartnerInfo({...partnerInfo, name: e.target.value})}
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm" 
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border-default)]">
                          {["남자", "여자"].map(g => (
                            <button key={g} onClick={() => setPartnerInfo({...partnerInfo, gender: g})} className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${partnerInfo.gender === g ? "bg-[var(--brand-primary)] text-[var(--text-on-brand)]" : "text-[var(--text-muted)]"}`}>{g}</button>
                          ))}
                        </div>
                        <input 
                          type="number" 
                          placeholder="생년월일(6자리)" 
                          value={partnerInfo.birth} 
                          onChange={(e) => setPartnerInfo({...partnerInfo, birth: e.target.value})}
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setPartnerInfo({...partnerInfo, isTimeKnown: false})} className={`py-3 rounded-xl text-sm font-bold border ${!partnerInfo.isTimeKnown ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>? 시간 모름</button>
                        <button onClick={() => setPartnerInfo({...partnerInfo, isTimeKnown: true})} className={`py-3 rounded-xl text-sm font-bold border ${partnerInfo.isTimeKnown ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>🕒 시간 입력</button>
                      </div>
                      
                      {partnerInfo.isTimeKnown && (
                        <div className="grid grid-cols-2 gap-3">
                          <select value={partnerInfo.hour} onChange={(e) => setPartnerInfo({...partnerInfo, hour: e.target.value})} className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm">{Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}시</option>)}</select>
                          <select value={partnerInfo.min} onChange={(e) => setPartnerInfo({...partnerInfo, min: e.target.value})} className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm">{Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{i}분</option>)}</select>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* 수정 완료 버튼 */}
                  <button 
                    onClick={() => {
                      setShowResultForm(false);
                      showToast("✅ 명식 정보가 수정되었습니다.\n원하시는 운세를 다시 선택하시면 수정된 정보로 분석됩니다!", "success");
                    }} 
                    className="w-full mt-4 py-4 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] rounded-xl text-sm font-bold hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all"
                  >
                    수정 완료 및 접기
                  </button>
                </div>
              )}
            </div>
            {/* 👇 1. 여기서 기존 결과창 뚜껑을 닫아줍니다 (제일 중요한 부분!) */}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* 👇 2. 로딩 중만 아니면 무조건 보여주는 새로운 조건 시작 (쇼윈도 전략) */}
        {step !== "analyzing" && (
          <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10 pb-10">
            <div className="text-center">
              <h3 className="text-xl font-bold text-[var(--text-body)] mb-6">지금 궁금한 운세를 선택하세요</h3>

              {/* 📊 무료 만세력 대형 버튼 */}
              <div className="mb-4 relative z-20">
                <button
                  type="button"
                  onClick={handleOpenFreeManseryeok}
                  disabled={isAnyActionLoading}
                  className="w-full bg-gradient-to-r from-[var(--bg-muted)] to-[var(--bg-elevated-alt)] border-2 border-red-500/50 p-6 rounded-3xl text-left relative z-20 overflow-hidden group hover:border-red-400 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute top-0 right-0 bg-red-500 text-white font-extrabold text-[10px] px-3 py-1 rounded-bl-xl z-30">
                    🎁 무료
                  </div>
                  <div className="flex items-center gap-3 relative z-30 pr-16">
                    <div className="text-3xl">📊</div>
                    <div>
                      <div className="text-[var(--text-body)] font-bold text-lg">내 사주 명식표 무료로 바로 보기</div>
                      <div className="text-[var(--text-muted)] text-xs mt-1">
                        나의 타고난 오행, 십성, 대운/세운의 흐름을 전문가용 차트로 한눈에 확인하세요.
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              
              {/* 👑 프리미엄 사주 버튼 (비회원/회원 분기 처리 완료) */}
              <div className="mb-6 relative z-20">
                <button
                 onClick={() => {
                  if (isAnyActionLoading) return;
                  if (!userInfo.name || !userInfo.birth) {
                    alert("먼저 상단에 사주 명식을 입력해주세요!");
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  
                  if (!user) {
                    setShowGuestModal(true); 
                  } else {
                    // 🌟 [핵심 변경] 기존 모달 대신, 2000P짜리 결제 장바구니에 담습니다!
                    setPendingPayment({ type: "premium", title: "프리미엄 인생 마스터플랜", payload: null });
                  }
                }}
                  className="w-full bg-gradient-to-r from-[var(--border-strong)] to-[var(--bg-muted)] border-2 border-[var(--brand-primary)] p-6 rounded-3xl text-left relative z-20 overflow-hidden group hover:border-[var(--brand-primary-soft)] transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isAnyActionLoading}
                >
                  <div className="absolute top-0 right-0 bg-[var(--brand-primary)] text-[var(--text-on-brand)] font-extrabold text-[10px] px-3 py-1 rounded-bl-xl z-30">BEST</div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/50 px-2 py-0.5 rounded-md shadow-sm z-30">
                    <span className="text-[10px] font-bold text-[var(--brand-primary)]">👑 1장</span>
                  </div>
                  <div className="flex items-center gap-3 relative z-30 pr-16">
                    <div className="text-3xl">👑</div>
                    <div>
                      <div className="text-[var(--text-body)] font-bold text-lg">프리미엄 총 사주운세</div>
                      <div className="text-[var(--text-muted)] text-xs mt-1">인생 총평 + 재물/직업 + 연애/가족 + 건강/행운 프리미엄 정밀 분석</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* 운세 메뉴 그리드 (유료 테마) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {FORTUNE_MENU_ITEMS.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => handleFortuneMenuClick(item)}
                    disabled={isAnyActionLoading}
                    className="p-3.5 sm:p-4 bg-[var(--bg-surface)]/50 border border-[var(--border-default)] rounded-2xl hover:bg-[var(--bg-hover)] hover:border-[var(--brand-primary)] transition-all text-left group shadow-lg flex flex-col justify-start relative disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute top-2 right-2 z-10">
                      {item.isFree ? (
                        <span className="text-[10px] font-bold text-white bg-red-500/80 px-2 py-0.5 rounded-md shadow-sm">
                          🎁 무료
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[var(--brand-primary)] bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/50 px-2 py-0.5 rounded-md shadow-sm">
                          🎟️ 1장
                        </span>
                      )}
                    </div>

                    <div className="text-2xl mb-2 sm:mb-2.5 relative z-10">{item.icon}</div>
                    <div className="font-bold text-[var(--text-body)] group-hover:text-[var(--brand-primary)] text-[13px] sm:text-sm md:text-base break-keep leading-snug relative z-10">
                      {item.title}
                    </div>
                    <div className="text-[10px] sm:text-[11px] md:text-xs text-[var(--text-muted)] mt-1 sm:mt-1.5 break-keep leading-tight relative z-10">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 💳 [모달] 이용권 구매 (무통장 입금 연동) */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-5 animate-in fade-in">
          <div className="bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/50 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[var(--text-body)] text-center mb-1">🎫 이용권 구매</h3>
            <p className="text-xs text-[var(--text-muted)] text-center mb-6">원하시는 이용권 패키지를 선택해 주세요.</p>

            {/* A. 스탠다드 패스 */}
            <div className="mb-6">
              <div className="rounded-2xl border border-[var(--border-default)] bg-gradient-to-br from-[var(--bg-elevated)] via-[var(--bg-elevated-alt)] to-[var(--bg-base)] p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">Standard</span>
                  <h4 className="text-base font-bold text-[var(--text-body)]">스탠다드 패스</h4>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-4">
                  일일 사주, 꼬리질문, 8개 테마 사주 이용 시 1회 사용 (※ 프리미엄 사주 불가)
                </p>
                <div className="space-y-2">
                  {STANDARD_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg)}
                      className={`w-full p-3.5 rounded-xl border flex justify-between items-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                        selectedPackage?.id === pkg.id
                          ? "border-sky-400 bg-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                          : "border-[var(--border-default)] bg-[var(--bg-base)]/90 hover:border-sky-400/50 hover:bg-sky-500/10"
                      }`}
                    >
                      <div className="text-left">
                        <span className="text-sm font-bold text-[var(--text-body)]">{pkg.label}</span>
                        <span className="block text-xs text-[var(--text-muted)] mt-0.5">{pkg.tickets}티켓</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {pkg.discount && (
                          <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-full">
                            {pkg.discount}
                          </span>
                        )}
                        <span className="text-base font-bold text-sky-500">{pkg.price.toLocaleString()}원</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* B. 프리미엄 패스 */}
            <div className="mb-6">
              <div className="rounded-2xl border border-[var(--brand-primary)]/40 bg-gradient-to-br from-[#1a1208] via-[var(--bg-base)] to-[var(--bg-elevated)] p-4 shadow-[0_0_20px_rgba(212,175,55,0.08)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 px-2 py-0.5 rounded-full">Premium</span>
                  <h4 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-soft)]">프리미엄 패스</h4>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-4">
                  프리미엄 정밀 사주(파트너 궁합 포함) 전용 티켓 (※ 기본 사주 불가)
                </p>
                <div className="space-y-2">
                  {PREMIUM_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg)}
                      className={`w-full p-3.5 rounded-xl border flex justify-between items-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                        selectedPackage?.id === pkg.id
                          ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/15 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                          : "border-[var(--border-default)] bg-[var(--bg-base)]/90 hover:border-[var(--brand-primary)]/50 hover:bg-[var(--brand-primary)]/5"
                      }`}
                    >
                      <div className="text-left">
                        <span className="text-sm font-bold text-[var(--text-body)]">{pkg.label}</span>
                        <span className="block text-xs text-[var(--text-muted)] mt-0.5">{pkg.tickets}티켓</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {pkg.discount && (
                          <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-full">
                            {pkg.discount}
                          </span>
                        )}
                        <span className="text-base font-bold text-[var(--brand-primary)]">{pkg.price.toLocaleString()}원</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 포트원 KCP 결제 */}
            <button
              type="button"
              onClick={handlePortOnePayment}
              disabled={isLoading("portone")}
              className="w-full py-3.5 mb-2 bg-gradient-to-r from-[var(--border-strong)] to-[var(--bg-muted)] border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] rounded-xl text-sm font-extrabold hover:border-[var(--brand-primary-soft)] hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {renderLoadingContent("portone", "💳 카드 결제하기")}
            </button>

            {/* 입금자명 입력 및 계좌 안내 (패키지를 선택했을 때만 보임) */}
            {selectedPackage && (
              <div className="animate-in slide-in-from-top-2">
                <h4 className="text-sm font-bold text-[var(--text-body)] mb-3 mt-5 pt-5 border-t border-[var(--border-default)]">💸 계좌이체 (무통장 입금)</h4>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="입금하시는 분 성함 (예: 홍길동)"
                    value={depositorName}
                    onChange={(e) => setDepositorName(e.target.value)}
                    className="w-full bg-[var(--bg-base)] border border-[var(--brand-primary)]/50 rounded-xl px-4 py-3 text-sm text-[var(--text-body)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
                <div className="bg-[var(--bg-base)] rounded-xl p-4 mb-5 border border-[var(--border-default)] text-center">
                  <p className="text-[11px] text-[var(--text-muted)] mb-1">
                    아래 계좌로 <strong className="text-[var(--text-body)]">{selectedPackage.price.toLocaleString()}원</strong>을 입금해 주세요
                  </p>
                  <p className="text-xs text-[var(--brand-primary)] font-bold mb-1">
                    {selectedPackage.category === "premium" ? "프리미엄 패스" : "스탠다드 패스"} · {selectedPackage.label} ({selectedPackage.tickets}티켓)
                  </p>
                  <p className="text-sm font-mono font-bold text-[var(--brand-primary)] tracking-wider">국민은행 472501-04-223221</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">예금주: 이동희(플럭스미디어)</p>
                  <a
                    href="http://pf.kakao.com/_MbvfX/chat"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 bg-[#FEE500] text-[#000000] text-xs font-bold py-2.5 rounded-xl hover:bg-[#F4DC00] transition-all"
                  >
                    <MessageCircle size={14} />
                    입금 후 카톡으로 인증하기 (빠른 처리)
                  </a>
                </div>
              </div>
            )}

            {/* 하단 버튼 */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowChargeModal(false); setSelectedPackage(null); setDepositorName(""); }}
                className="flex-1 py-3 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl text-xs font-bold hover:bg-[var(--bg-elevated-alt)] transition-colors"
              >
                닫기
              </button>
              <button
                onClick={handleDepositSubmit}
                className={`flex-[2] py-3 rounded-xl text-xs font-extrabold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedPackage && depositorName
                    ? "bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                    : "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
                }`}
                disabled={!selectedPackage || !depositorName || isLoading("deposit")}
              >
                {renderLoadingContent("deposit", "입금 완료했어요")}
              </button>
            </div>

            {/* 법적 고지사항 및 배송 안내 */}
            <div className="mt-5 pt-5 border-t border-[var(--border-default)]/50">
              <div className="bg-[var(--bg-base)] rounded-xl p-4 text-[11px] text-[var(--text-muted)] leading-relaxed text-left space-y-2.5 border border-[var(--border-default)]/40">
                <p>
                  <strong className="text-[var(--text-muted)] font-bold">📦 배송(제공) 안내 : </strong>
                  본 상품은 실물 배송이 없는 무형의 디지털 콘텐츠로, 결제 완료 즉시 이용권이 자동 지급되어 서비스 이용이 가능합니다.
                </p>
                <p>
                  <strong className="text-[var(--text-muted)] font-bold">🔄 유효기간 및 환불 : </strong>
                  본 이용권의 유효기간은 구매일로부터 90일입니다. 구매 후 7일 이내 미사용 시 전액 환불 가능하며, 부분 환불 시 적용된 할인가가 아닌 &apos;1회권 정상가&apos; 기준으로 사용분이 공제되고 결제 금액의 10%가 위약금으로 발생합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
     
      {/* ---------------------------------------------------- */}
      {/* ---------------------------------------------------- */}
      {/* ✉️ [모달] 이메일 로그인 */}
      {showEmailLoginModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-5 animate-in fade-in">
          <div className="bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/50 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-soft)] text-center mb-1">
              ✉️ 이메일 로그인
            </h3>
            <p className="text-xs text-[var(--text-muted)] text-center mb-6">등록된 이메일과 비밀번호를 입력해 주세요.</p>

            <form onSubmit={handleEmailLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1.5 ml-1">이메일</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-body)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1.5 ml-1">비밀번호</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-body)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEmailLoginModal}
                  className="flex-1 py-3 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl text-sm font-bold hover:bg-[var(--bg-elevated-alt)] transition-colors"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={isLoading("email")}
                  className="flex-[2] py-3 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] rounded-xl text-sm font-extrabold hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {renderLoadingContent("email", "로그인")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎁 [모달] 비회원 로그인 유도 (1회권 삭제, 무조건 가입 유도) */}
      {showGuestModal && (
        <div className={`fixed inset-0 bg-black/85 backdrop-blur-sm ${modalOverlayZ} flex items-center justify-center p-5 animate-in fade-in`}>
          <div className="bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/50 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            <div className="text-center mb-6">
              <div className="inline-block bg-[var(--brand-primary)]/20 p-3 rounded-full mb-3">
                <Gift size={32} className="text-[var(--brand-primary)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-body)] mb-2">프리미엄 운세 잠금 해제</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                3초 만에 로그인하고 심층 분석용<br/>
                <span className="text-[var(--brand-primary)] font-bold text-base">스탠다드 패스 1장</span>을 즉시 받아보세요!
              </p>
            </div>
            
            <div className="space-y-3">
              {/* 1번 버튼: 카카오 로그인 연동 */}
              <button 
                onClick={() => {
                  setShowGuestModal(false); 
                  handleKakaoLogin();      
                }}
                disabled={isAnyActionLoading}
                className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] text-sm font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(254,229,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading("kakao") ? (
                  <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 3C6.477 3 2 6.425 2 10.648c0 2.706 1.706 5.07 4.3 6.355-.26.965-1.01 3.76-1.04 3.882-.04.144.05.155.12.11 1.05-.67 4.12-2.82 4.12-2.82.82.16 1.66.25 2.5.25 5.523 0 10-3.425 10-7.648C22 6.425 17.523 3 12 3z" fill="#000000"/>
                    </svg>
                    카카오로 1초 만에 시작하기
                  </>
                )}
              </button>

              <button 
                onClick={() => {
                  setShowGuestModal(false); 
                  handleGoogleLogin();      
                }}
                disabled={isAnyActionLoading}
                className="w-full py-4 bg-white text-gray-800 rounded-xl font-extrabold text-sm flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading("google") ? (
                  <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    구글로 1초 만에 시작하기
                  </>
                )}
              </button>
            </div>

            <button 
              onClick={() => setShowGuestModal(false)}
              className="w-full mt-5 py-2 text-xs text-[var(--text-muted)] underline hover:text-[var(--text-body)] transition-colors"
            >
              다음에 할게요 (닫기)
            </button>
          </div>
        </div>
      )}
      {/* 👇👇👇 [여기에 복사해서 붙여넣으세요!] 통합 결제 모달창 👇👇👇 */}
      {/* 💳 [통합 모달] 이용권 차감 및 분석 시작 */}
      {pendingPayment && (
        <div className={`fixed inset-0 bg-black/85 backdrop-blur-sm ${modalOverlayZ} flex items-center justify-center p-5 animate-in fade-in`}>
          <div className="bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/50 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="text-center space-y-4">
              <div className="text-4xl">
                {pendingPayment.type === 'premium' ? '👑' : pendingPayment.type === 'menu' ? '🔮' : '💡'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-body)]">{pendingPayment.title}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">결제 동의 시 정밀 분석이 시작됩니다.</p>
              </div>
              
              <div className="bg-[var(--bg-base)] p-4 rounded-2xl border border-[var(--border-default)] my-4">
                <p className="text-xs text-[var(--text-muted)]">사용할 이용권</p>
                <p className="text-xl font-bold text-[var(--brand-primary)] mt-1">
                  {getTicketUsageLabel(pendingPayment.type)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setPendingPayment(null)}
                disabled={isLoading("pending")}
                className="flex-1 py-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-muted)] rounded-xl font-bold text-sm hover:bg-[var(--bg-elevated-alt)] transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button 
                onClick={handlePendingPaymentConfirm}
                disabled={isLoading("pending")}
                className="flex-[2] py-3 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {renderLoadingContent("pending", "동의하고 분석 시작")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 👤 [모달] 마이페이지 · 사주 보관함 */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-5 animate-in fade-in">
          <div className="bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/50 w-full max-w-md max-h-[85vh] rounded-3xl flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* 마이페이지 상단 */}
            <div className="p-5 border-b border-[var(--border-default)] bg-[var(--bg-base)]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-body)] flex items-center gap-2">
                    👤 마이페이지
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {user?.user_metadata?.name || user?.email || "고객"}님
                  </p>
                </div>
                <button 
                  onClick={() => { setShowHistoryModal(false); setSelectedHistory(null); }} 
                  className="text-[var(--text-muted)] hover:text-[var(--text-body)] text-3xl font-light leading-none"
                >
                  ×
                </button>
              </div>

              <div className="bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-2xl p-4 mb-4">
                <p className="text-[10px] text-[var(--text-muted)] font-bold mb-2 tracking-wide">보유 이용권</p>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">🎟️ 스탠다드</p>
                    <p className="text-2xl font-black text-[var(--brand-primary)]">{standardTicket}<span className="text-sm font-bold ml-0.5">장</span></p>
                  </div>
                  <div className="w-px h-10 bg-[var(--border-default)]" />
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">👑 프리미엄</p>
                    <p className="text-2xl font-black text-[var(--brand-primary-soft)]">{premiumTicket}<span className="text-sm font-bold ml-0.5">장</span></p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)]/60 text-[var(--text-muted)] text-sm font-bold hover:text-[var(--text-body)] hover:border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-all"
              >
                로그아웃
              </button>
            </div>

            {/* 사주 보관함 헤더 */}
            <div className="px-5 py-3 border-b border-[var(--border-default)]/50 bg-[var(--bg-base)]/80">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[var(--text-body)]">🗂️ 사주 보관함</h4>
                <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md border border-red-400/20">
                  ⚠️ 60일 후 자동 삭제
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 break-keep">
                분석된 운세 결과는 이곳에 안전하게 보관됩니다.
              </p>
            </div>

            {/* 본문 영역 (스크롤 가능) */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {selectedHistory ? (
                // 📝 상세 보기 화면 (리스트 중 하나를 클릭했을 때)
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <button 
                    onClick={() => setSelectedHistory(null)} 
                    className="text-[var(--brand-primary)] text-sm font-bold mb-5 flex items-center gap-1 hover:text-[var(--brand-primary-soft)]"
                  >
                    ← 목록으로 돌아가기
                  </button>
                  <h4 className="text-xl font-bold text-[var(--text-body)] mb-2">{selectedHistory.title}</h4>
                  <p className="text-xs text-[var(--text-muted)] mb-5">
                    {new Date(selectedHistory.created_at).toLocaleString('ko-KR', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                  </p>
                  <div className="text-base md:text-lg text-[var(--text-muted)] leading-relaxed tracking-wide whitespace-pre-wrap bg-[var(--bg-base)] p-5 md:p-6 rounded-2xl border border-[var(--border-default)]">
                    {selectedHistory.content}
                  </div>
                </div>
              ) : (
                // 📋 리스트 화면 (처음 켰을 때)
                historyList.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                    보관된 운세가 없습니다.<br/>사주를 분석하고 결과를 저장해보세요!
                  </div>
                ) : (
                  historyList.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedHistory(item)}
                      className="bg-[var(--bg-muted)] border border-[var(--border-default)] p-4 rounded-2xl cursor-pointer hover:border-[var(--brand-primary)] hover:bg-[var(--bg-elevated-alt)] transition-all group shadow-md"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[var(--brand-primary)] font-bold text-sm group-hover:text-[var(--brand-primary-soft)]">{item.title}</span>
                        <span className="text-[10px] text-[var(--text-muted)] bg-black/50 px-2 py-1 rounded-md">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Footer — 회원 탈퇴 */}
            <div className="shrink-0 px-5 py-4 border-t border-[var(--border-default)]/40 bg-[var(--bg-base)]/90 text-center">
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className={`text-xs transition-colors ${
                  isWithdrawing
                    ? "text-[var(--text-muted)] cursor-not-allowed"
                    : "text-[var(--text-muted)] hover:text-[var(--text-muted)] underline underline-offset-2 decoration-gray-600 hover:decoration-gray-400"
                }`}
              >
                {isWithdrawing ? "탈퇴 처리 중..." : "회원 탈퇴"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎟️ [모달] 오늘의 무료 사주 중복 사용 → 티켓 차감 안내 */}
      {isAlreadyUsedModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-5 animate-in fade-in">
          <div className="bg-gradient-to-b from-[#15151a] to-[#0a0a0d] border border-[var(--brand-primary)]/50 w-full max-w-sm rounded-3xl p-6 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative">
            <div className="text-center space-y-3">
              <div className="text-4xl">🔮</div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-soft)]">
                오늘의 운세를 다시 보시겠습니까?
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                오늘의 무료 운세는 이미 발급되었습니다.<br />
                티켓을 사용하시면 새로운 풀이를 받아보실 수 있습니다.
              </p>

              <div className="bg-black/50 border border-[var(--brand-primary)]/20 rounded-2xl px-4 py-3 mt-4">
                <p className="text-xs text-[var(--text-muted)]">보유 스탠다드 티켓</p>
                <p className="text-lg font-bold text-[var(--brand-primary)]">🎟️ {standardTicket}장</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <button
                type="button"
                onClick={handleUseTicketAndRetry}
                disabled={isTicketProcessing}
                className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all ${
                  isTicketProcessing
                    ? "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
                    : "bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[#0a0a0d] hover:shadow-[0_0_18px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {isTicketProcessing ? "처리 중..." : "🎟️ 스탠다드 티켓 1장"}
              </button>
              <button
                type="button"
                onClick={() => setIsAlreadyUsedModalOpen(false)}
                disabled={isTicketProcessing}
                className="w-full py-3 rounded-xl border border-white/10 text-[var(--text-muted)] text-sm font-bold hover:text-[var(--text-body)] hover:border-white/30 transition-all disabled:opacity-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 [모달] 무료 전문가용 만세력 대시보드 */}
      {showSajuDashboard && dashboardSajuResult && (
        <SajuDashboard
          name={userInfo.name}
          sajuResult={dashboardSajuResult}
          onClose={() => {
            setShowSajuDashboard(false);
            setDashboardSajuResult(null);
          }}
          onMenuSelect={handleDashboardMenuSelect}
        />
      )}
    </main>
  );

}
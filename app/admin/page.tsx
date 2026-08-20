"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Wallet, Users, CreditCard, Lock, LogOut, X, TrendingUp, ChevronLeft, ChevronRight, DollarSign, Receipt, Percent, Sparkles, Ticket } from "lucide-react";

const formatTicketLabel = (ticketType: string, ticketCount: number) => {
  const typeLabel = ticketType === "premium" ? "👑 프리미엄 패스" : "🎟️ 스탠다드 패스";
  return `${typeLabel} ${ticketCount}장`;
};

const getDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const buildCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function AdminDashboard() {
  const [authStatus, setAuthStatus] = useState<"checking" | "unauthenticated" | "authorized">("checking");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const isAuthenticated = authStatus === "authorized";

  const [activeTab, setActiveTab] = useState<"deposits" | "cardPayments" | "users" | "statistics" | "theme">("deposits");

  const [tenantTheme, setTenantTheme] = useState<{ mode: "dark" | "light" } | null>(null);
  const [loadingTheme, setLoadingTheme] = useState(false);
  const [applyingThemeMode, setApplyingThemeMode] = useState<"dark" | "light" | null>(null);
  
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [cardPayments, setCardPayments] = useState<any[]>([]);
  const [loadingCardPayments, setLoadingCardPayments] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userCharges, setUserCharges] = useState<any[]>([]);
  const [userSajus, setUserSajus] = useState<any[]>([]);
  const [expandedSajuIds, setExpandedSajuIds] = useState<string[]>([]);
  const [isUserDetailLoading, setIsUserDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"charges" | "sajus">("charges");

  const [serverAuthError, setServerAuthError] = useState<string | null>(null);

  // 관리자 API는 서비스 롤 키로 동작하므로, 실제 접근 제어는 서버에서
  // Supabase Auth 세션 + ADMIN_EMAILS 화이트리스트로 확인합니다.
  const adminFetch = async (path: string, options: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setServerAuthError(
        "관리자 계정으로 사이트에 로그인되어 있지 않습니다. 메인 페이지에서 관리자 이메일로 로그인한 뒤 다시 시도해 주세요."
      );
      return null;
    }

    const res = await fetch(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${session.access_token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
    });

    if (res.status === 401 || res.status === 403) {
      const body = await res.json().catch(() => ({}));
      setServerAuthError(body.error || "관리자 권한이 없는 계정입니다.");
      await supabase.auth.signOut();
      setAuthStatus("unauthenticated");
      return null;
    }

    setServerAuthError(null);
    return res;
  };

  // 세션이 있으면 서버에 실제 관리자인지 확인한다 (ADMIN_EMAILS 화이트리스트 검사는 서버에서만).
  const verifyAdminSession = async (accessToken: string) => {
    const res = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      await supabase.auth.signOut();
      setAuthStatus("unauthenticated");
      setAuthError(body.error || "관리자 권한이 없는 계정입니다.");
      return;
    }

    const json = await res.json();
    setUsers(json.data || []);
    setAuthStatus("authorized");
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setAuthStatus("unauthenticated");
        return;
      }
      await verifyAdminSession(session.access_token);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "users") fetchUsers();
    if (activeTab === "deposits") fetchRequests();
    if (activeTab === "cardPayments") fetchCardPayments();
    if (activeTab === "statistics") fetchStatistics();
    if (activeTab === "theme") fetchTenantTheme();
  }, [activeTab, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!emailInput.trim() || !passwordInput) {
      setAuthError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });

      if (error || !data.session) {
        setAuthError("이메일 또는 비밀번호가 일치하지 않습니다.");
        return;
      }

      setPasswordInput("");
      await verifyAdminSession(data.session.access_token);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmailInput("");
    setPasswordInput("");
    setUsers([]);
    setAuthStatus("unauthenticated");
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const res = await adminFetch("/api/admin/users");
    if (res) {
      const json = await res.json();
      if (!res.ok) console.error("유저 불러오기 에러:", json.error);
      else setUsers(json.data || []);
    }
    setLoadingUsers(false);
  };

  // 🌟 [추가됨] 관리자가 임의로 회원의 티켓(스탠다드/프리미엄)을 직접 수정/지급하는 함수
  const handleUpdateTickets = async (userId: string, currentStandard: number, currentPremium: number, userName: string) => {
    const newStd = prompt(`[${userName}]님의 변경할 '스탠다드 패스' 총 개수를 입력하세요:`, String(currentStandard || 0));
    if (newStd === null) return;

    const newPrm = prompt(`[${userName}]님의 변경할 '프리미엄 패스' 총 개수를 입력하세요:`, String(currentPremium || 0));
    if (newPrm === null) return;

    const parsedStd = parseInt(newStd, 10);
    const parsedPrm = parseInt(newPrm, 10);

    if (isNaN(parsedStd) || isNaN(parsedPrm)) {
      alert("❌ 올바른 숫자를 입력해 주세요.");
      return;
    }

    const res = await adminFetch("/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ userId, standardTicket: parsedStd, premiumTicket: parsedPrm }),
    });

    if (!res) return;

    const json = await res.json();
    if (!res.ok) {
      alert("❌ 티켓 수정 실패: " + json.error);
    } else {
      alert("✅ 회원의 티켓 잔여량이 성공적으로 수정되었습니다.");
      fetchUsers();
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    const res = await adminFetch("/api/admin/deposit-requests");
    if (res) {
      const json = await res.json();
      if (!res.ok) console.error("입금 내역 에러:", json.error);
      else setRequests(json.data || []);
    }
    setLoadingRequests(false);
  };

  const fetchCardPayments = async () => {
    setLoadingCardPayments(true);
    const res = await adminFetch("/api/admin/payment-logs");
    if (res) {
      const json = await res.json();
      if (!res.ok) console.error("카드 결제 내역 에러:", json.error);
      else setCardPayments(json.data || []);
    }
    setLoadingCardPayments(false);
  };

  const fetchTenantTheme = async () => {
    setLoadingTheme(true);
    const res = await adminFetch("/api/admin/theme");
    if (res) {
      const json = await res.json();
      if (!res.ok) console.error("테마 조회 에러:", json.error);
      else setTenantTheme(json.data);
    }
    setLoadingTheme(false);
  };

  const handleApplyTheme = async (mode: "dark" | "light") => {
    if (applyingThemeMode) return;
    setApplyingThemeMode(mode);
    try {
      const res = await adminFetch("/api/admin/theme", {
        method: "PATCH",
        body: JSON.stringify({ mode }),
      });
      if (!res) return;

      const json = await res.json();
      if (!res.ok) {
        alert("❌ 테마 적용 실패: " + json.error);
        return;
      }

      setTenantTheme((prev) => (prev ? { ...prev, mode } : { mode }));
      alert(`✅ 사이트 테마가 "${mode === "light" ? "라이트" : "다크"}"로 적용되었습니다!`);
    } finally {
      setApplyingThemeMode(null);
    }
  };

  const fetchStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const [usersRes, paymentsRes, historyRes] = await Promise.all([
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/payment-logs"),
        adminFetch("/api/admin/saju-history"),
      ]);

      if (!usersRes || !paymentsRes || !historyRes) {
        setIsLoadingStats(false);
        return;
      }

      const usersJson = await usersRes.json();
      const paymentsJson = await paymentsRes.json();
      const historyJson = await historyRes.json();

      const payments = (paymentsJson.data || []).filter((p: any) => p.status === "PAID");
      const users = usersJson.data || [];
      const history = historyJson.data || [];

      const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount_krw || 0), 0);
      const paymentCount = payments.length;
      const uniquePayingUsers = new Set(payments.map((p: any) => p.user_id).filter(Boolean)).size;
      const totalUsers = users.length;
      const conversionRate = totalUsers > 0 ? (uniquePayingUsers / totalUsers) * 100 : 0;
      const totalSajuCount = history.length;
      const totalStandard = users.reduce((sum: number, u: any) => sum + (u.standard_ticket || 0), 0);
      const totalPremium = users.reduce((sum: number, u: any) => sum + (u.premium_ticket || 0), 0);

      const packageMap: Record<string, { count: number; revenue: number; label: string }> = {
        standard: { count: 0, revenue: 0, label: "🎟️ 스탠다드 패스" },
        premium: { count: 0, revenue: 0, label: "👑 프리미엄 패스" },
      };

      payments.forEach((p: any) => {
        const key = p.ticket_type === "premium" ? "premium" : "standard";
        packageMap[key].count += 1;
        packageMap[key].revenue += p.amount_krw || 0;
      });

      const packageFunnels = Object.entries(packageMap)
        .map(([key, val]) => ({
          key,
          label: val.label,
          count: val.count,
          revenue: val.revenue,
          percent: totalRevenue > 0 ? (val.revenue / totalRevenue) * 100 : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      const dailyStats: Record<string, { count: number; revenue: number; payments: any[] }> = {};
      payments.forEach((p: any) => {
        const key = getDateKey(new Date(p.created_at));
        if (!dailyStats[key]) dailyStats[key] = { count: 0, revenue: 0, payments: [] };
        dailyStats[key].count += 1;
        dailyStats[key].revenue += p.amount_krw || 0;
        dailyStats[key].payments.push(p);
      });

      setStats({
        totalRevenue,
        paymentCount,
        conversionRate,
        uniquePayingUsers,
        totalSajuCount,
        totalUsers,
        totalStandard,
        totalPremium,
        packageFunnels,
        dailyStats,
      });
    } catch (error) {
      console.error("통계 에러:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleUserClick = async (user: any) => {
    const selectedUserId = user.id;

    if (!selectedUserId) {
      console.error("선택된 회원 UUID가 없습니다:", user);
      alert("회원 UUID를 확인할 수 없습니다.");
      return;
    }

    setSelectedUser(user);
    setDetailTab("charges");
    setUserCharges([]);
    setUserSajus([]);
    setExpandedSajuIds([]);
    setIsUserDetailLoading(true);

    const chargesRes = await adminFetch(`/api/admin/deposit-requests?userId=${encodeURIComponent(selectedUserId)}`);
    if (chargesRes) {
      const chargesJson = await chargesRes.json();
      if (!chargesRes.ok) console.error("충전 내역 조회 에러:", chargesJson.error);
      else setUserCharges(chargesJson.data || []);
    }

    let historyData: any[] = [];
    const historyRes = await adminFetch(`/api/admin/saju-history?userId=${encodeURIComponent(selectedUserId)}`);
    if (historyRes) {
      const historyJson = await historyRes.json();
      if (!historyRes.ok) console.error("사주 내역 조회 에러:", historyJson.error);
      else historyData = historyJson.data || [];
    }

    setUserSajus(historyData);
    setIsUserDetailLoading(false);
  };

  const handleCloseUserDetailModal = () => {
    setSelectedUser(null);
    setUserCharges([]);
    setUserSajus([]);
    setExpandedSajuIds([]);
    setDetailTab("charges");
    setIsUserDetailLoading(false);
  };

  const handleApprove = async (request: any) => {
    const ticketLabel = formatTicketLabel(request.ticket_type, request.ticket_count);
    const isConfirmed = confirm(
      `[${request.depositor_name}]님의 ${request.amount_krw.toLocaleString()}원 입금을 확인하셨습니까?\n확인을 누르면 ${ticketLabel}이(가) 지급됩니다.`
    );
    if (!isConfirmed) return;

    const res = await adminFetch("/api/admin/deposit-requests", {
      method: "POST",
      body: JSON.stringify({ requestId: request.id }),
    });

    if (!res) return;

    const json = await res.json();
    if (!res.ok) {
      console.error("지급 중 오류 발생:", json.error);
      alert("지급 처리 중 오류가 발생했습니다: " + json.error);
      return;
    }

    alert("🎉 티켓 지급이 완료되었습니다!");
    fetchRequests();
  };

  if (authStatus === "checking") {
    return (
      <div className="min-h-screen bg-[#0a0514] text-white flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">로딩 중...</div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#0a0514] text-white flex items-center justify-center p-5 font-sans">
        <div className="w-full max-w-md bg-[#15072a]/90 backdrop-blur-xl rounded-2xl border border-[#3b1d6b] shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mb-4">
              <Lock size={28} className="text-[#D4AF37]" />
            </div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">
              관리자 인증
            </h1>
            <p className="text-sm text-gray-400 mt-2">관리자 계정으로 로그인해 주세요</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setAuthError("");
              }}
              placeholder="관리자 이메일"
              className="w-full bg-[#1c0d33] border border-[#3b1d6b] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
              autoFocus
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setAuthError("");
              }}
              placeholder="비밀번호"
              className="w-full bg-[#1c0d33] border border-[#3b1d6b] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
            {authError && (
              <p className="text-red-400 text-sm text-center">{authError}</p>
            )}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F0D060] text-[#120524] font-bold py-3 rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-60"
            >
              {isLoggingIn ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0514] text-white p-5 md:p-10 font-sans selection:bg-[#D4AF37]/30">
      <div className="max-w-6xl mx-auto space-y-8">

        {serverAuthError && (
          <div className="bg-red-900/30 border border-red-800/60 text-red-300 text-sm rounded-xl p-4">
            ⚠️ {serverAuthError}
          </div>
        )}

        <div className="border-b border-[#3b1d6b] pb-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] flex items-center gap-3">
              👑 오늘의사주 최고관리자
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm bg-[#1c0d33] border border-[#3b1d6b] text-[#a48cd1] hover:text-[#D4AF37] hover:border-[#D4AF37]/50 px-4 py-2 rounded-lg transition-all"
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("deposits")}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${
                activeTab === "deposits"
                  ? "bg-[#1c0d33] border-t border-l border-r border-[#D4AF37] text-[#D4AF37]"
                  : "bg-transparent text-gray-400 hover:text-white"
              }`}
            >
              <CreditCard size={18} /> 무통장 입금 관리
            </button>
            <button
              onClick={() => setActiveTab("cardPayments")}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${
                activeTab === "cardPayments"
                  ? "bg-[#1c0d33] border-t border-l border-r border-[#D4AF37] text-[#D4AF37]"
                  : "bg-transparent text-gray-400 hover:text-white"
              }`}
            >
              💳 카드 결제 내역
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${
                activeTab === "users"
                  ? "bg-[#1c0d33] border-t border-l border-r border-[#D4AF37] text-[#D4AF37]"
                  : "bg-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Users size={18} /> 전체 회원 관리
            </button>
            <button
              onClick={() => setActiveTab("statistics")}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${
                activeTab === "statistics"
                  ? "bg-[#1c0d33] border-t border-l border-r border-[#D4AF37] text-[#D4AF37]"
                  : "bg-transparent text-gray-400 hover:text-white"
              }`}
            >
              <TrendingUp size={18} /> 실시간 통계
            </button>
            <button
              onClick={() => setActiveTab("theme")}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${
                activeTab === "theme"
                  ? "bg-[#1c0d33] border-t border-l border-r border-[#D4AF37] text-[#D4AF37]"
                  : "bg-transparent text-gray-400 hover:text-white"
              }`}
            >
              🎨 테마 설정
            </button>
          </div>
        </div>

        {/* 탭 1: 무통장 입금 관리 화면 */}
        {activeTab === "deposits" && (
          <div className="bg-[#15072a]/90 backdrop-blur-xl rounded-b-2xl rounded-tr-2xl border border-[#3b1d6b] overflow-hidden shadow-2xl animate-in fade-in duration-300">
            <div className="p-4 bg-[#1c0d33] border-b border-[#3b1d6b] flex justify-between items-center">
              <span className="text-[#a48cd1] font-bold">입금 신청 내역</span>
              <button onClick={fetchRequests} className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1.5 rounded hover:bg-[#D4AF37]/30">
                🔄 새로고침
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#1c0d33]/50 border-b border-[#3b1d6b]">
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">신청일시</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">입금자명 (계정)</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">입금(예정) 금액</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">구매한 티켓</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium text-center">관리 액션</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRequests ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 animate-pulse">
                        데이터를 불러오는 중입니다...
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">
                        접수된 신청 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req.id} className="border-b border-[#3b1d6b]/50 hover:bg-[#1e0c3a] transition-colors">
                        <td className="p-4 text-xs text-gray-400">{new Date(req.created_at).toLocaleString()}</td>
                        <td className="p-4">
                          <div className="font-bold text-white">{req.depositor_name}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {req.user_email || "이메일 정보 없음"}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-[#F3E5AB]">{req.amount_krw.toLocaleString()}원</td>
                        <td className="p-4">
                          <span className="text-[#D4AF37] font-bold">
                            {formatTicketLabel(req.ticket_type, req.ticket_count)}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {req.status === "pending" ? (
                            <button
                              onClick={() => handleApprove(req)}
                              className="w-full bg-[#D4AF37] hover:bg-[#F3E5AB] text-black font-extrabold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all text-xs"
                            >
                              <Wallet size={14} /> 지급 완료
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-green-900/30 text-green-400 border border-green-800/50 px-3 py-2 rounded-lg text-xs font-bold w-full justify-center">
                              <CheckCircle2 size={14} /> 처리됨
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 탭: 카드 결제 내역 화면 */}
        {activeTab === "cardPayments" && (
          <div className="bg-[#15072a]/90 backdrop-blur-xl rounded-b-2xl rounded-tr-2xl border border-[#3b1d6b] overflow-hidden shadow-2xl animate-in fade-in duration-300">
            <div className="p-4 bg-[#1c0d33] border-b border-[#3b1d6b] flex justify-between items-center">
              <span className="text-[#a48cd1] font-bold">카드 결제 내역</span>
              <button onClick={fetchCardPayments} className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1.5 rounded hover:bg-[#D4AF37]/30">
                🔄 새로고침
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#1c0d33]/50 border-b border-[#3b1d6b]">
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">결제일시</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">결제자 (이메일)</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">주문명 (상품)</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">결제 금액</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">포트원 주문번호</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCardPayments ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 animate-pulse">
                        데이터를 불러오는 중입니다...
                      </td>
                    </tr>
                  ) : cardPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        카드 결제 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    cardPayments.map((item) => (
                      <tr key={item.id} className="border-b border-[#3b1d6b]/50 hover:bg-[#1e0c3a] transition-colors">
                        <td className="p-4 text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</td>
                        <td className="p-4 text-sm text-white">{item.user_email || "이메일 없음"}</td>
                        <td className="p-4">
                          <span className="text-[#D4AF37] font-bold">{item.order_name}</span>
                        </td>
                        <td className="p-4 font-bold text-[#F3E5AB]">{(item.amount_krw || 0).toLocaleString()}원</td>
                        <td className="p-4 text-[10px] text-gray-500 font-mono">{item.payment_id}</td>
                        <td className="p-4 text-center">
                          {item.status === "PAID" ? (
                            <span className="inline-flex items-center gap-1 bg-green-900/30 text-green-400 border border-green-800/50 px-3 py-2 rounded-lg text-xs font-bold w-full justify-center">
                              💳 결제완료
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-900/30 text-red-400 border border-red-800/50 px-3 py-2 rounded-lg text-xs font-bold w-full justify-center">
                              취소/실패
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 탭 2: 전체 회원 관리 화면 */}
        {activeTab === "users" && (
          <div className="bg-[#15072a]/90 backdrop-blur-xl rounded-b-2xl rounded-tr-2xl border border-[#3b1d6b] overflow-hidden shadow-2xl animate-in fade-in duration-300">
            <div className="p-4 bg-[#1c0d33] border-b border-[#3b1d6b] flex justify-between items-center">
              <span className="text-[#a48cd1] font-bold">전체 가입자: {users.length}명</span>
              <button onClick={fetchUsers} className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1.5 rounded hover:bg-[#D4AF37]/30">
                🔄 새로고침
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#1c0d33]/50 border-b border-[#3b1d6b]">
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">이름 (이메일)</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">성별</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">생년월일</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">가입일</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">보유 티켓</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium text-center">관리 액션</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 animate-pulse">
                        데이터를 불러오는 중입니다...
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-b border-[#3b1d6b]/50 hover:bg-[#1e0c3a] transition-colors">
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleUserClick(u)}
                            className="hover:text-[#D4AF37] hover:underline underline-offset-2 transition-colors text-left cursor-pointer"
                          >
                            <span className="font-bold text-white">{u.display_name || "미입력"}</span>
                            <span className="text-sm text-[#a48cd1] font-medium ml-1">
                              ({u.email || "이메일 없음"})
                            </span>
                          </button>
                          <div className="text-[10px] text-gray-500 font-mono mt-1" title={u.id}>
                            ID: {u.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-300">{u.gender || "-"}</td>
                        <td className="p-4 text-sm text-gray-300">{u.birth_date || "-"}</td>
                        <td className="p-4 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className="text-sm font-bold text-white">
                            🎟️ 스탠다드 <span className="text-[#D4AF37]">{u.standard_ticket || 0}</span>장
                            <span className="text-gray-500 mx-1.5">|</span>
                            👑 프리미엄 <span className="text-[#D4AF37]">{u.premium_ticket || 0}</span>장
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleUpdateTickets(u.id, u.standard_ticket, u.premium_ticket, u.display_name)}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#F0D060] text-[#120524] px-4 py-2 rounded-lg text-xs font-bold hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all cursor-pointer"
                          >
                            티켓 강제 수정
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* 탭: 실시간 통계 B2B 대시보드 */}
        {activeTab === "statistics" && (
          <div className="bg-[#15072a]/90 backdrop-blur-xl rounded-b-2xl rounded-tr-2xl border border-[#3b1d6b] p-6 shadow-2xl animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#3b1d6b]">
              <div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FACC15] to-[#F3E5AB] flex items-center gap-2">
                  <TrendingUp className="text-[#FACC15]" /> 실시간 데이터 분석 대시보드
                </h2>
                <p className="text-xs text-gray-500 mt-1">payment_logs · user_profiles · saju_history 기반</p>
              </div>
              <button onClick={fetchStatistics} className="text-xs bg-[#FACC15]/15 text-[#FACC15] px-3 py-1.5 rounded hover:bg-[#FACC15]/25 border border-[#FACC15]/30">
                🔄 데이터 새로고침
              </button>
            </div>

            {isLoadingStats || !stats ? (
              <div className="py-16 text-center text-gray-400 animate-pulse">실시간 지표를 불러오는 중입니다...</div>
            ) : (
              <div className="space-y-8">
                {/* 1. 6대 핵심 KPI */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div className="bg-[#130b24] border-2 border-[#FACC15] p-5 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.12)]">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-[#FACC15]" />
                      <p className="text-xs text-[#FACC15] font-bold tracking-wide">총매출</p>
                    </div>
                    <p className="text-3xl xl:text-4xl font-black text-[#FACC15] leading-tight">{stats.totalRevenue.toLocaleString()}<span className="text-lg ml-0.5">원</span></p>
                    <p className="text-[10px] text-gray-500 mt-2">PAID 결제 합산</p>
                  </div>

                  <div className="bg-[#130b24] border border-[#3b1d6b] p-5 rounded-xl hover:border-[#FACC15]/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt size={15} className="text-gray-400" />
                      <p className="text-xs text-gray-400">결제 건수</p>
                    </div>
                    <p className="text-2xl font-black text-white">{stats.paymentCount.toLocaleString()}<span className="text-sm font-bold text-gray-400 ml-1">건</span></p>
                  </div>

                  <div className="bg-[#130b24] border border-[#3b1d6b] p-5 rounded-xl hover:border-[#FACC15]/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent size={15} className="text-gray-400" />
                      <p className="text-xs text-gray-400">전환율</p>
                    </div>
                    <p className="text-2xl font-black text-white">{stats.conversionRate.toFixed(1)}<span className="text-sm font-bold text-[#FACC15] ml-0.5">%</span></p>
                    <p className="text-[10px] text-gray-500 mt-1">{stats.uniquePayingUsers}명 / {stats.totalUsers}명</p>
                  </div>

                  <div className="bg-[#130b24] border border-[#3b1d6b] p-5 rounded-xl hover:border-[#FACC15]/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={15} className="text-gray-400" />
                      <p className="text-xs text-gray-400">사주 풀이</p>
                    </div>
                    <p className="text-2xl font-black text-white">{stats.totalSajuCount.toLocaleString()}<span className="text-sm font-bold text-gray-400 ml-1">건</span></p>
                  </div>

                  <div className="bg-[#130b24] border border-[#3b1d6b] p-5 rounded-xl hover:border-[#FACC15]/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={15} className="text-gray-400" />
                      <p className="text-xs text-gray-400">총 회원 수</p>
                    </div>
                    <p className="text-2xl font-black text-white">{stats.totalUsers.toLocaleString()}<span className="text-sm font-bold text-gray-400 ml-1">명</span></p>
                  </div>

                  <div className="bg-[#130b24] border border-[#3b1d6b] p-5 rounded-xl hover:border-[#FACC15]/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Ticket size={15} className="text-gray-400" />
                      <p className="text-xs text-gray-400">유저 보유 티켓</p>
                    </div>
                    <p className="text-xl font-black text-white leading-snug">
                      <span className="text-gray-300">S {stats.totalStandard}</span>
                      <span className="text-gray-600 mx-1">/</span>
                      <span className="text-[#FACC15]">P {stats.totalPremium}</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">스탠다드 / 프리미엄</p>
                  </div>
                </div>

                {/* 2. 패키지별 매출 퍼널 */}
                <div className="bg-[#130b24]/80 border border-[#3b1d6b] rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#FACC15] rounded-full inline-block" />
                    패키지별 매출 퍼널
                  </h3>
                  <div className="space-y-5">
                    {stats.packageFunnels.map((pkg: any) => (
                      <div key={pkg.key}>
                        <div className="flex flex-wrap justify-between items-end gap-2 mb-2">
                          <span className="text-sm font-bold text-gray-200">{pkg.label}</span>
                          <span className="text-xs text-gray-400">
                            <span className="text-[#FACC15] font-bold">{pkg.count}건</span>
                            <span className="mx-1.5 text-gray-600">·</span>
                            <span className="text-white font-bold">{pkg.percent.toFixed(0)}%</span>
                            <span className="mx-1.5 text-gray-600">·</span>
                            <span className="text-[#F3E5AB] font-bold">{pkg.revenue.toLocaleString()}원</span>
                          </span>
                        </div>
                        <div className="h-3 bg-[#0a0514] rounded-full overflow-hidden border border-[#3b1d6b]/50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] via-[#FACC15] to-[#F3E5AB] transition-all duration-700"
                            style={{ width: `${Math.max(pkg.percent, pkg.count > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {stats.paymentCount === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">아직 PAID 결제 데이터가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 3. 일별 결제 트래킹 달력 */}
                <div className="bg-[#130b24]/80 border border-[#3b1d6b] rounded-xl p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-1 h-4 bg-[#FACC15] rounded-full inline-block" />
                      일별 결제 트래킹
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        className="p-1.5 rounded-lg border border-[#3b1d6b] text-gray-400 hover:text-[#FACC15] hover:border-[#FACC15]/40 transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-bold text-[#FACC15] min-w-[100px] text-center">
                        {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
                      </span>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        className="p-1.5 rounded-lg border border-[#3b1d6b] text-gray-400 hover:text-[#FACC15] hover:border-[#FACC15]/40 transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 mb-2">
                    {WEEKDAY_LABELS.map((label, i) => (
                      <div
                        key={label}
                        className={`text-center text-[10px] font-bold py-1 ${i === 0 ? "text-red-400/70" : i === 6 ? "text-blue-400/70" : "text-gray-500"}`}
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {buildCalendarDays(calendarMonth.getFullYear(), calendarMonth.getMonth()).map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="min-h-[72px]" />;
                      }

                      const dateKey = getDateKey(day);
                      const dayData = stats.dailyStats[dateKey];
                      const isSelected = selectedCalendarDate === dateKey;
                      const isToday = getDateKey(new Date()) === dateKey;

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => setSelectedCalendarDate(isSelected ? null : dateKey)}
                          className={`min-h-[72px] p-1.5 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "border-[#FACC15] bg-[#FACC15]/10 shadow-[0_0_12px_rgba(250,204,21,0.15)]"
                              : isToday
                                ? "border-[#D4AF37]/50 bg-[#1c0d33]"
                                : "border-[#3b1d6b]/40 bg-[#0a0514]/60 hover:border-[#FACC15]/30 hover:bg-[#1c0d33]/50"
                          }`}
                        >
                          <span className={`text-xs font-bold block mb-1 ${isToday ? "text-[#FACC15]" : "text-gray-300"}`}>
                            {day.getDate()}
                          </span>
                          {dayData ? (
                            <div className="space-y-0.5">
                              <span className="block text-[9px] font-bold bg-[#FACC15]/15 text-[#FACC15] px-1 py-0.5 rounded leading-tight">
                                {dayData.count}건
                              </span>
                              <span className="block text-[9px] font-bold bg-[#3b1d6b]/60 text-gray-300 px-1 py-0.5 rounded leading-tight truncate">
                                {(dayData.revenue / 1000).toFixed(0)}k
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-gray-600">-</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedCalendarDate && stats.dailyStats[selectedCalendarDate] && (
                    <div className="mt-5 border-t border-[#3b1d6b] pt-5 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-[#FACC15]">
                          {selectedCalendarDate.replace(/-/g, ".")} 상세 결제 내역
                          <span className="text-gray-400 font-normal ml-2">
                            ({stats.dailyStats[selectedCalendarDate].count}건 · {stats.dailyStats[selectedCalendarDate].revenue.toLocaleString()}원)
                          </span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setSelectedCalendarDate(null)}
                          className="text-xs text-gray-500 hover:text-white transition-colors"
                        >
                          닫기
                        </button>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-[#3b1d6b]/50">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#1c0d33]/50 border-b border-[#3b1d6b]">
                              <th className="p-3 text-xs text-[#a48cd1] font-medium">결제자</th>
                              <th className="p-3 text-xs text-[#a48cd1] font-medium">주문명</th>
                              <th className="p-3 text-xs text-[#a48cd1] font-medium text-right">금액</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.dailyStats[selectedCalendarDate].payments.map((p: any) => (
                              <tr key={p.id} className="border-b border-[#3b1d6b]/30 hover:bg-[#1e0c3a] transition-colors">
                                <td className="p-3 text-xs text-gray-300">{p.user_email || "이메일 없음"}</td>
                                <td className="p-3 text-xs text-[#D4AF37] font-medium">{p.order_name || "-"}</td>
                                <td className="p-3 text-xs text-[#F3E5AB] font-bold text-right">{(p.amount_krw || 0).toLocaleString()}원</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedCalendarDate && !stats.dailyStats[selectedCalendarDate] && (
                    <div className="mt-5 border-t border-[#3b1d6b] pt-5 text-center text-sm text-gray-500">
                      {selectedCalendarDate.replace(/-/g, ".")} — 결제 내역 없음
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 탭: 테마 설정 */}
        {activeTab === "theme" && (
          <div className="bg-[#15072a]/90 backdrop-blur-xl rounded-b-2xl rounded-tr-2xl border border-[#3b1d6b] p-6 shadow-2xl animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#3b1d6b]">
              <div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] flex items-center gap-2">
                  🎨 사이트 테마 설정
                </h2>
                <p className="text-xs text-gray-500 mt-1">버튼을 누르면 실제 서비스 화면이 즉시 해당 테마로 바뀝니다.</p>
              </div>
              <button onClick={fetchTenantTheme} className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1.5 rounded hover:bg-[#D4AF37]/30">
                🔄 새로고침
              </button>
            </div>

            {loadingTheme || !tenantTheme ? (
              <div className="py-16 text-center text-gray-400 animate-pulse">현재 테마를 불러오는 중입니다...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 다크 (기존) */}
                <div
                  className={`rounded-2xl border-2 p-5 transition-all ${
                    tenantTheme.mode === "dark" ? "border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]" : "border-[#3b1d6b]"
                  }`}
                >
                  <div className="rounded-xl overflow-hidden border border-[#3b1d6b] mb-4">
                    <div className="bg-[#0a0514] p-4 space-y-2">
                      <div className="h-2.5 w-2/3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]" />
                      <div className="h-2 w-1/2 rounded-full bg-[#a48cd1]/60" />
                      <div className="mt-3 h-6 w-20 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F0D060]" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-white">다크 (기존 오늘의사주)</span>
                    {tenantTheme.mode === "dark" && (
                      <span className="text-[10px] font-bold bg-[#D4AF37] text-[#120524] px-2 py-1 rounded-full">사용 중</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-4">보라 배경 + 골드 포인트. 기존 오늘의사주 브랜드 색상입니다.</p>
                  <button
                    onClick={() => handleApplyTheme("dark")}
                    disabled={tenantTheme.mode === "dark" || applyingThemeMode !== null}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F0D060] text-[#120524] font-bold py-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {applyingThemeMode === "dark" ? "적용 중..." : tenantTheme.mode === "dark" ? "현재 테마" : "이 테마 적용하기"}
                  </button>
                </div>

                {/* 라이트 (기문당 스타일) */}
                <div
                  className={`rounded-2xl border-2 p-5 transition-all ${
                    tenantTheme.mode === "light" ? "border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]" : "border-[#3b1d6b]"
                  }`}
                >
                  <div className="rounded-xl overflow-hidden border border-[#3b1d6b] mb-4">
                    <div className="bg-[#F7F8FA] p-4 space-y-2">
                      <div className="h-2.5 w-2/3 rounded-full bg-[#2B3A67]" />
                      <div className="h-2 w-1/2 rounded-full bg-[#6B7280]/60" />
                      <div className="mt-3 h-6 w-20 rounded-lg bg-[#2B3A67]" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-white">라이트 (기문당 스타일)</span>
                    {tenantTheme.mode === "light" && (
                      <span className="text-[10px] font-bold bg-[#D4AF37] text-[#120524] px-2 py-1 rounded-full">사용 중</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-4">오프화이트 배경 + 네이비 포인트. 미니멀한 라이트 모드입니다.</p>
                  <button
                    onClick={() => handleApplyTheme("light")}
                    disabled={tenantTheme.mode === "light" || applyingThemeMode !== null}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F0D060] text-[#120524] font-bold py-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {applyingThemeMode === "light" ? "적용 중..." : tenantTheme.mode === "light" ? "현재 테마" : "이 테마 적용하기"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 회원 상세 정보 모달 */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCloseUserDetailModal}
          />
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#15072a] border border-[#3b1d6b] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#3b1d6b] shrink-0">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">
                [{selectedUser.display_name || "미입력"} ({selectedUser.email || "이메일 없음"})]님의 상세 정보
              </h2>
              <button
                onClick={handleCloseUserDetailModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pt-4 pb-2 border-b border-[#3b1d6b] shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setDetailTab("charges")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-bold text-sm transition-all ${
                    detailTab === "charges"
                      ? "bg-[#1c0d33] border-t border-l border-r border-[#D4AF37] text-[#D4AF37]"
                      : "bg-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <CreditCard size={16} /> 충전 내역
                  {!isUserDetailLoading && (
                    <span className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full">
                      {userCharges.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setDetailTab("sajus")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-bold text-sm transition-all ${
                    detailTab === "sajus"
                      ? "bg-[#1c0d33] border-t border-l border-r border-[#D4AF37] text-[#D4AF37]"
                      : "bg-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <Wallet size={16} /> 사주 내역
                  {!isUserDetailLoading && (
                    <span className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full">
                      {userSajus.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isUserDetailLoading ? (
                <div className="py-12 text-center text-gray-400 animate-pulse">
                  데이터를 불러오는 중입니다...
                </div>
              ) : detailTab === "charges" ? (
                userCharges.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">충전 내역이 없습니다.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#1c0d33]/50 border-b border-[#3b1d6b]">
                          <th className="p-3 text-sm text-[#a48cd1] font-medium">신청일시</th>
                          <th className="p-3 text-sm text-[#a48cd1] font-medium">입금자명</th>
                          <th className="p-3 text-sm text-[#a48cd1] font-medium">입금 금액</th>
                          <th className="p-3 text-sm text-[#a48cd1] font-medium">구매 티켓</th>
                          <th className="p-3 text-sm text-[#a48cd1] font-medium text-center">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userCharges.map((charge) => (
                          <tr key={charge.id} className="border-b border-[#3b1d6b]/50 hover:bg-[#1e0c3a] transition-colors">
                            <td className="p-3 text-xs text-gray-400">
                              {new Date(charge.created_at).toLocaleString()}
                            </td>
                            <td className="p-3 text-sm text-white">{charge.depositor_name}</td>
                            <td className="p-3 text-sm font-bold text-[#F3E5AB]">
                              {charge.amount_krw.toLocaleString()}원
                            </td>
                            <td className="p-3 text-sm font-bold text-[#D4AF37]">
                              {formatTicketLabel(charge.ticket_type, charge.ticket_count)}
                            </td>
                            <td className="p-3 text-center">
                              {charge.status === "completed" ? (
                                <span className="inline-flex items-center gap-1 bg-green-900/30 text-green-400 border border-green-800/50 px-2 py-1 rounded-lg text-xs font-bold">
                                  <CheckCircle2 size={12} /> 완료
                                </span>
                              ) : (
                                <span className="inline-flex items-center bg-yellow-900/30 text-yellow-400 border border-yellow-800/50 px-2 py-1 rounded-lg text-xs font-bold">
                                  대기중
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : userSajus.length === 0 ? (
                <div className="py-12 text-center text-gray-400">사주 내역이 없습니다.</div>
              ) : (
                <div className="space-y-3">
                  {userSajus.map((saju) => (
                    <div
                      key={saju.id}
                      className="bg-[#1c0d33]/50 border border-[#3b1d6b] rounded-xl p-4 hover:border-[#D4AF37]/30 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div>
                          <span className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full font-bold">
                            {saju.type || "사주"}
                          </span>
                          <h3 className="font-bold text-white mt-2">{saju.title || "제목 없음"}</h3>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {new Date(saju.created_at).toLocaleString()}
                        </span>
                      </div>
                      {saju.content && (
                        <>
                          <p
                            className={`text-sm text-gray-300 whitespace-pre-wrap ${
                              expandedSajuIds.includes(saju.id) ? "" : "line-clamp-3"
                            }`}
                          >
                            {saju.content}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSajuIds((prev) =>
                                prev.includes(saju.id)
                                  ? prev.filter((id) => id !== saju.id)
                                  : [...prev, saju.id]
                              )
                            }
                            className="mt-2 text-xs font-bold text-[#D4AF37] hover:text-[#F3E5AB] transition-colors"
                          >
                            {expandedSajuIds.includes(saju.id) ? "접기" : "더보기"}
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Wallet, Users, CreditCard, Lock, X } from "lucide-react";

const ADMIN_PASSWORD_KEY = "admin_password";
const DEFAULT_PASSWORD = "flux1234!";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");

  const [activeTab, setActiveTab] = useState<"deposits" | "users">("deposits");

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userCharges, setUserCharges] = useState<any[]>([]);
  const [userSajus, setUserSajus] = useState<any[]>([]);
  const [isUserDetailLoading, setIsUserDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"charges" | "sajus">("charges");

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_PASSWORD_KEY);
    if (!stored) {
      localStorage.setItem(ADMIN_PASSWORD_KEY, DEFAULT_PASSWORD);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "users") fetchUsers();
    if (activeTab === "deposits") fetchRequests();
  }, [activeTab, isAuthenticated]);

  const getStoredPassword = () => {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_PASSWORD;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (passwordInput === getStoredPassword()) {
      setIsAuthenticated(true);
      setPasswordInput("");
    } else {
      setAuthError("비밀번호가 올바르지 않습니다.");
    }
  };

  const handleOpenPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordChangeError("");
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordChangeError("");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError("");

    if (currentPassword !== getStoredPassword()) {
      setPasswordChangeError("현재 비밀번호가 올바르지 않습니다.");
      return;
    }

    if (newPassword.length < 4) {
      setPasswordChangeError("새 비밀번호는 4자 이상이어야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
    alert("✅ 비밀번호가 성공적으로 변경되었습니다.");
    handleClosePasswordModal();
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("유저 불러오기 에러:", error);
    else setUsers(data || []);
    setLoadingUsers(false);
  };

  const handleUpdatePoints = async (userId: string, currentPoints: number, userName: string) => {
    const newPoints = prompt(`[${userName}]님의 변경할 포인트 금액을 입력하세요:`, String(currentPoints || 0));
    if (newPoints === null || newPoints === "") return;

    const parsedPoints = parseInt(newPoints);
    const { error } = await supabase
      .from("user_profiles")
      .update({ points: parsedPoints, paid_points: parsedPoints })
      .eq("id", userId);

    if (error) {
      alert("❌ 포인트 수정 실패: " + error.message);
    } else {
      alert("✅ 포인트가 성공적으로 변경되었습니다.");
      fetchUsers();
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    const { data, error } = await supabase
      .from("deposit_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("입금 내역 에러:", error);
    else setRequests(data || []);
    setLoadingRequests(false);
  };

  const handleUserClick = async (user: any) => {
    setSelectedUser(user);
    setDetailTab("charges");
    setUserCharges([]);
    setUserSajus([]);
    setIsUserDetailLoading(true);

    const [chargesResult, sajusResult] = await Promise.all([
      supabase
        .from("deposit_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("saju_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (chargesResult.error) console.error("충전 내역 조회 에러:", chargesResult.error);
    else setUserCharges(chargesResult.data || []);

    if (sajusResult.error) console.error("사주 내역 조회 에러:", sajusResult.error);
    else setUserSajus(sajusResult.data || []);

    setIsUserDetailLoading(false);
  };

  const handleCloseUserDetailModal = () => {
    setSelectedUser(null);
    setUserCharges([]);
    setUserSajus([]);
    setDetailTab("charges");
    setIsUserDetailLoading(false);
  };

  const handleApprove = async (request: any) => {
    const isConfirmed = confirm(
      `[${request.depositor_name}]님의 ${request.amount_krw.toLocaleString()}원 입금을 확인하셨습니까?\n확인을 누르면 ${request.paid_points + request.bonus_points}P가 지급됩니다.`
    );
    if (!isConfirmed) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from("user_profiles")
        .select("points, paid_points, bonus_points")
        .eq("id", request.user_id)
        .single();

      if (userError) throw userError;

      const newTotal = (userData.points || 0) + request.paid_points + request.bonus_points;
      const newPaid = (userData.paid_points || 0) + request.paid_points;
      const newBonus = (userData.bonus_points || 0) + request.bonus_points;

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ points: newTotal, paid_points: newPaid, bonus_points: newBonus })
        .eq("id", request.user_id);

      if (updateError) throw updateError;

      const { error: reqError } = await supabase
        .from("deposit_requests")
        .update({ status: "completed" })
        .eq("id", request.id);

      if (reqError) throw reqError;

      alert("🎉 포인트 지급이 완료되었습니다!");
      fetchRequests();
    } catch (error) {
      console.error("지급 중 오류 발생:", error);
      alert("지급 처리 중 오류가 발생했습니다.");
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#0a0514] text-white flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
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
            <p className="text-sm text-gray-400 mt-2">관리자 비밀번호를 입력해 주세요</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setAuthError("");
              }}
              placeholder="비밀번호 입력"
              className="w-full bg-[#1c0d33] border border-[#3b1d6b] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
              autoFocus
            />
            {authError && (
              <p className="text-red-400 text-sm text-center">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F0D060] text-[#120524] font-bold py-3 rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0514] text-white p-5 md:p-10 font-sans selection:bg-[#D4AF37]/30">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="border-b border-[#3b1d6b] pb-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] flex items-center gap-3">
              👑 오늘의사주 최고관리자
            </h1>
            <button
              onClick={handleOpenPasswordModal}
              className="flex items-center gap-2 text-sm bg-[#1c0d33] border border-[#3b1d6b] text-[#a48cd1] hover:text-[#D4AF37] hover:border-[#D4AF37]/50 px-4 py-2 rounded-lg transition-all"
            >
              <Lock size={14} />
              비밀번호 변경
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
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${
                activeTab === "users"
                  ? "bg-[#1c0d33] border-t border-l border-r border-[#D4AF37] text-[#D4AF37]"
                  : "bg-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Users size={18} /> 전체 회원 관리
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
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">지급할 포인트</th>
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
                            {(req.paid_points + req.bonus_points).toLocaleString()} P
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
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">이름 (계정ID)</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">성별</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">생년월일</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">가입일</th>
                    <th className="p-4 text-sm text-[#a48cd1] font-medium">보유 포인트</th>
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
                            className="font-bold text-white hover:text-[#D4AF37] hover:underline underline-offset-2 transition-colors text-left cursor-pointer"
                          >
                            {u.display_name || "미입력"}
                          </button>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5" title={u.id}>
                            {u.email || `ID: ${u.id.slice(0, 8)}...`}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-300">{u.gender || "-"}</td>
                        <td className="p-4 text-sm text-gray-300">{u.birth_date || "-"}</td>
                        <td className="p-4 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className="bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full font-bold text-sm border border-[#D4AF37]/30">
                            {(u.points || 0).toLocaleString()} P
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleUpdatePoints(u.id, u.points, u.display_name)}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#F0D060] text-[#120524] px-4 py-2 rounded-lg text-xs font-bold hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
                          >
                            포인트 강제 수정
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
                [{selectedUser.display_name || "미입력"}]님의 상세 정보
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
                          <th className="p-3 text-sm text-[#a48cd1] font-medium">지급 포인트</th>
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
                              {(charge.paid_points + charge.bonus_points).toLocaleString()} P
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
                        <p className="text-sm text-gray-300 line-clamp-3 whitespace-pre-wrap">
                          {saju.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClosePasswordModal}
          />
          <div className="relative w-full max-w-md bg-[#15072a] border border-[#3b1d6b] rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#D4AF37] flex items-center gap-2">
                <Lock size={18} />
                비밀번호 변경
              </h2>
              <button
                onClick={handleClosePasswordModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-[#a48cd1] mb-1.5">현재 비밀번호</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#1c0d33] border border-[#3b1d6b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#a48cd1] mb-1.5">새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#1c0d33] border border-[#3b1d6b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#a48cd1] mb-1.5">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#1c0d33] border border-[#3b1d6b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  required
                />
              </div>

              {passwordChangeError && (
                <p className="text-red-400 text-sm text-center">{passwordChangeError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  className="flex-1 py-3 rounded-xl border border-[#3b1d6b] text-gray-400 hover:text-white hover:border-gray-500 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F0D060] text-[#120524] font-bold hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
                >
                  변경하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

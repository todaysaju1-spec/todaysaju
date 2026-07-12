"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Supabase에서 모든 유저 정보 불러오기
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false }); // 최신 가입자순 정렬

    if (error) {
      console.error("유저 불러오기 에러:", error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  // 화면이 켜질 때 유저 목록 불러오기 실행
  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. 포인트 수정 함수 (관리자가 버튼 클릭 시 작동)
  const handleUpdatePoints = async (userId: string, currentPoints: number, userName: string) => {
    const newPoints = prompt(`[${userName}]님의 변경할 포인트 금액을 입력하세요:`, String(currentPoints || 0));
    
    // 취소를 누르거나 입력값이 없으면 무시
    if (newPoints === null || newPoints === "") return;

    // 데이터베이스 업데이트
    const { error } = await supabase
      .from("user_profiles")
      .update({ points: parseInt(newPoints) })
      .eq("id", userId);

    if (error) {
      alert("❌ 포인트 수정 실패: " + error.message);
    } else {
      alert("✅ 포인트가 성공적으로 변경되었습니다.");
      fetchUsers(); // 목록 새로고침 (화면 업데이트)
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0514] text-white p-5 md:p-10 font-sans selection:bg-[#D4AF37]/30">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* 헤더 부분 */}
        <div className="flex items-center justify-between border-b border-[#3b1d6b] pb-5">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] flex items-center gap-3">
              👑 오늘의사주 최고관리자
            </h1>
            <p className="text-sm text-[#a48cd1] mt-2">회원 정보 및 포인트 관리 대시보드</p>
          </div>
          <div className="bg-[#1c0d33] border border-[#D4AF37]/50 px-4 py-2 rounded-xl text-sm font-bold text-[#D4AF37]">
            총 가입자: {users.length}명
          </div>
        </div>

        {/* 유저 데이터 테이블 */}
        <div className="bg-[#15072a]/90 backdrop-blur-xl rounded-2xl border border-[#3b1d6b] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#1c0d33] border-b border-[#3b1d6b]">
                  <th className="p-4 text-sm text-[#a48cd1] font-medium">이름</th>
                  <th className="p-4 text-sm text-[#a48cd1] font-medium">성별</th>
                  <th className="p-4 text-sm text-[#a48cd1] font-medium">생년월일</th>
                  <th className="p-4 text-sm text-[#a48cd1] font-medium">가입일 (마지막 접속)</th>
                  <th className="p-4 text-sm text-[#a48cd1] font-medium">보유 포인트</th>
                  <th className="p-4 text-sm text-[#a48cd1] font-medium text-center">관리 액션</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 animate-pulse">
                      데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-[#3b1d6b]/50 hover:bg-[#1e0c3a] transition-colors">
                      <td className="p-4 font-bold text-white">{u.display_name || "미입력"}</td>
                      <td className="p-4 text-sm text-gray-300">{u.gender || "-"}</td>
                      <td className="p-4 text-sm text-gray-300">{u.birth_date || "-"}</td>
                      <td className="p-4 text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
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
                          포인트 충전/수정
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
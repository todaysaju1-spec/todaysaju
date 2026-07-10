"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Send, User, Calendar, Clock, Sparkles } from "lucide-react";

interface SajuRequest {
  id: number;
  created_at: string;
  name: string;
  gender: string;
  birth_date: string;
  calendar_type: string;
  birth_time: string;
  status: string;
  bazi?: string;
  ai_result?: string;
  phone?: string; 
}

const WEBHOOK_URL =
  "https://worthy-wren.pikapod.net/webhook/7aa365c0-5e5c-4dc0-aa37-cbe6fffd3d25";

export default function AdminDashboard() {
  const [requests, setRequests] = useState<SajuRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SajuRequest | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDraft, setAiDraft] = useState("");

  useEffect(() => {
    if (!selectedRequest) return;

    if (selectedRequest.ai_result) {
      setAiDraft(selectedRequest.ai_result);
    } else {
      setAiDraft(
        `[${selectedRequest.name} 님의 사주 분석 초안]\n\n이곳에 생성형 AI(Gemini)가 작성한 사주 풀이가 자동으로 입력될 예정입니다. 대표님은 여기서 텍스트를 검수하고 수정할 수 있습니다.`
      );
    }
  }, [selectedRequest]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("saju_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("데이터 불러오기 에러:", error);
    } else {
      setRequests(data || []);
      if (data && data.length > 0) {
        setSelectedRequest(data[0]);
      }
    }
    setLoading(false);
  };

  const handleGenerateAI = async () => {
    if (!selectedRequest) return;

    // 💡 [CTO의 안전장치] 원본 소스(bazi)가 없으면 렌더링 컷!
    if (!selectedRequest.bazi) {
      alert("🚨 컷! 대표! 이 고객은 사주 팩트 데이터(원본 소스)가 없는 옛날 파일이야! 메인 창에서 결제 테스트로 '새 고객'을 접수해 줘!");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_saju",
          customer: selectedRequest,
          bazi: selectedRequest.bazi // n8n이 절대 못 놓치게 데이터 바깥쪽에도 한 번 더 확실하게 쏴주기!
        }),
      });

      if (response.ok) {
        alert(
          "✨ AI 렌더링이 시작되었습니다! 뒤에서 작성 중이니 약 10~20초 뒤에 새로고침(F5)을 눌러주세요."
        );
      } else {
        alert("🚨 에러! n8n 렌더링 공장 연결 실패!");
      }
    } catch (error) {
      console.error(error);
      alert("🚨 통신 에러! n8n 엔진 켜져있는지 확인해!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendAlimtalk = async () => {
    if (!selectedRequest) return;

    if (
      !window.confirm(
        "최종 완성된 사주 풀이를 고객 카톡으로 발송하시겠습니까?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          customer: selectedRequest,
          saju_text: aiDraft,
        }),
      });

      if (response.ok) {
        alert(
          "🚀 컷! 고객님 카톡으로 알림톡 발송이 성공적으로 완료되었습니다!"
        );
      } else {
        alert("🚨 알림톡 전송 실패! n8n 로그를 확인해!");
      }
    } catch (error) {
      console.error(error);
      alert("🚨 통신 에러! n8n 엔진 켜져있는지 확인해!");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111] text-2xl font-bold text-yellow-500">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#111111] font-sans text-gray-200">
      {/* 왼쪽 패널: 고객 리스트 (30%) */}
      <div className="w-[30%] overflow-y-auto border-r border-gray-800 bg-[#151515] p-6">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          <Sparkles size={24} className="text-yellow-500" />
          VIP 사주 대기열
        </h2>

        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <button
              key={req.id}
              type="button"
              onClick={() => setSelectedRequest(req)}
              className={`rounded-xl p-4 text-left transition-all duration-300 ${
                selectedRequest?.id === req.id
                  ? "border border-yellow-500/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(234,179,8,0.15)]"
                  : "border border-gray-800 bg-[#1a1a1a] hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
  <span className="text-lg font-bold text-white">{req.name}</span>
  <span className="text-xs text-gray-400">{req.phone || '연락처 없음'}</span>
</div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock size={14} />
                {new Date(req.created_at).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                신청
              </div>
            </button>
          ))}

          {requests.length === 0 && (
            <div className="mt-10 text-center text-gray-500">
              신청 내역이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽 패널: 편집기 (70%) */}
      <div className="w-[70%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-[#111] to-[#111] p-10">
        {selectedRequest ? (
          <div className="mx-auto flex h-full max-w-4xl flex-col">
            {/* 고객 명식 요약 */}
            <div className="mb-8 flex items-center gap-8 rounded-2xl border border-gray-800 bg-[#1a1a1a] p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 p-3 text-black">
                  <User size={28} />
                </div>
                <div>
                  <div className="text-sm text-gray-400">고객명</div>
                  <div className="text-2xl font-bold text-white">
                  {selectedRequest.name}
                  <span className="text-sm font-normal text-gray-400 ml-2">({selectedRequest.phone || '연락처 없음'})</span>{" "}
                  </div>
                </div>
              </div>

              <div className="h-12 w-px bg-gray-700" />

              <div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Calendar size={14} />
                  생년월일
                </div>
                <div className="text-lg text-white">
                  {selectedRequest.birth_date}{" "}
                  <span className="text-sm text-yellow-500">
                    ({selectedRequest.calendar_type})
                  </span>
                </div>
              </div>

              <div className="h-12 w-px bg-gray-700" />

              <div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock size={14} />
                  태어난 시간
                </div>
                <div className="text-lg text-white">
                  {selectedRequest.birth_time}
                </div>
              </div>
            </div>

            {/* AI 사주 텍스트 에디터 */}
            <div className="mb-6 flex flex-1 flex-col rounded-2xl border border-gray-800 bg-[#1a1a1a] p-1 shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
                <h3 className="font-bold text-gray-300">AI 초안 에디터</h3>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${
                    isGenerating
                      ? "cursor-not-allowed border-gray-700 bg-gray-800 text-gray-500"
                      : "border-gray-700 bg-gray-800 text-yellow-500 hover:border-yellow-500/50 hover:bg-gray-700"
                  }`}
                >
                  <Sparkles
                    size={16}
                    className={isGenerating ? "animate-spin" : ""}
                  />
                  {isGenerating ? "AI가 렌더링 중..." : "AI 다시 쓰기"}
                </button>
              </div>

              <textarea
                className="flex-1 w-full resize-none bg-transparent p-6 text-lg leading-loose text-gray-300 focus:outline-none focus:ring-0"
                placeholder="여기에 AI가 분석한 사주 결과가 렌더링됩니다..."
                value={aiDraft}
                onChange={(e) => setAiDraft(e.target.value)}
              />
            </div>

            {/* 최종 발송 버튼 */}
            <div className="mt-auto flex justify-end">
              <button
                type="button"
                onClick={handleSendAlimtalk}
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-500 px-8 py-3 font-bold text-black shadow-lg transition-all hover:from-yellow-500 hover:to-amber-400"
              >
                <Send
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
                최종 발송 (알림톡)
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xl text-gray-500">
            고객을 선택해주세요.
          </div>
        )}
      </div>
    </div>
  );
}

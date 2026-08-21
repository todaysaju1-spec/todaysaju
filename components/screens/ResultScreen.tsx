"use client";

import { Sparkles, CheckCircle2 } from "lucide-react";
import ButtonSpinner from "@/components/ButtonSpinner";
import type { ClientTenantTheme } from "./types";

type UserInfo = {
  name: string;
  birth: string;
  hour: string;
  min: string;
  gender: string;
  calendarType: string;
  isTimeKnown: boolean;
  maritalStatus: string;
  hasChildren: string;
};

type PartnerInfo = {
  name: string;
  birth: string;
  hour: string;
  min: string;
  gender: string;
  calendarType: string;
  isTimeKnown: boolean;
};

type ResultScreenProps = {
  tenantTheme: ClientTenantTheme | null;
  user: any;
  userInfo: UserInfo;
  setUserInfo: (info: UserInfo) => void;
  partnerInfo: PartnerInfo;
  setPartnerInfo: (info: PartnerInfo) => void;
  sajuResultText: string;
  followUpResult: string;
  isFollowUpLoading: boolean;
  suggestedQuestions: string[];
  selectedQuestion: string;
  isAnyActionLoading: boolean;
  onAskFollowUp: (question: string) => void;
  showResultForm: boolean;
  setShowResultForm: (show: boolean) => void;
  isMyInfoLoading: boolean;
  isPartnerInfoLoading: boolean;
  onFetchMySavedInfo: () => void;
  onFetchPartnerSavedInfo: () => void;
  onSavePartnerInfo: () => void;
  onFinishEditing: () => void;
};

// 🎬 [씬 4] 오늘의 무료 사주 결과 + 꼬리질문 + 명식 확인/수정 아코디언
export default function ResultScreen({
  tenantTheme,
  user,
  userInfo,
  setUserInfo,
  partnerInfo,
  setPartnerInfo,
  sajuResultText,
  followUpResult,
  isFollowUpLoading,
  suggestedQuestions,
  selectedQuestion,
  isAnyActionLoading,
  onAskFollowUp,
  showResultForm,
  setShowResultForm,
  isMyInfoLoading,
  isPartnerInfoLoading,
  onFetchMySavedInfo,
  onFetchPartnerSavedInfo,
  onSavePartnerInfo,
  onFinishEditing,
}: ResultScreenProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

      {/* 1. 오늘의 무료 종합 사주 리포트 (미끼 투척) */}
      <div className="bg-gradient-to-br from-[var(--bg-elevated)] to-[#0d051c] p-6 rounded-3xl border-2 border-[var(--brand-primary)]/50 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[var(--brand-primary)] text-[var(--text-on-brand)] text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
          당신의 운세
        </div>

        <div className="flex items-center gap-2 mb-3">
          {tenantTheme?.mode === "character" && tenantTheme.characterResultImageUrl ? (
            <img
              src={tenantTheme.characterResultImageUrl}
              alt="사주를 풀이해주는 명리사 캐릭터"
              className="w-8 h-8 rounded-full object-cover border border-[var(--brand-primary)]/50 shrink-0"
            />
          ) : (
            <Sparkles className="text-[var(--brand-primary)]" size={18} />
          )}
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
                      onAskFollowUp(q);
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
                      onClick={() => onAskFollowUp(q)}
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
          <span className="text-[var(--brand-primary)] font-bold flex items-center gap-1"><CheckCircle2 size={12} /> 출석 완료</span>
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
                onClick={onFetchMySavedInfo}
                disabled={isMyInfoLoading}
                className="w-full flex items-center justify-center gap-2 bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/60 text-[var(--brand-primary)] px-4 py-3 rounded-xl text-sm font-bold hover:bg-[var(--brand-primary)]/20 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMyInfoLoading ? (
                  <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
                ) : (
                  "✨ 내 사주 명식 자동 입력하기"
                )}
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
                  onClick={onFetchPartnerSavedInfo}
                  disabled={isPartnerInfoLoading}
                  className="text-xs bg-[var(--bg-elevated)] border border-[var(--text-muted)]/50 text-[var(--text-muted)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-elevated-alt)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPartnerInfoLoading ? (
                    <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
                  ) : (
                    "✨ 자동 불러오기"
                  )}
                </button>
                <button
                  type="button"
                  onClick={onSavePartnerInfo}
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
                  onChange={(e) => setPartnerInfo({ ...partnerInfo, name: e.target.value })}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border-default)]">
                    {["남자", "여자"].map(g => (
                      <button key={g} onClick={() => setPartnerInfo({ ...partnerInfo, gender: g })} className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${partnerInfo.gender === g ? "bg-[var(--brand-primary)] text-[var(--text-on-brand)]" : "text-[var(--text-muted)]"}`}>{g}</button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="생년월일(6자리)"
                    value={partnerInfo.birth}
                    onChange={(e) => setPartnerInfo({ ...partnerInfo, birth: e.target.value })}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPartnerInfo({ ...partnerInfo, isTimeKnown: false })} className={`py-3 rounded-xl text-sm font-bold border ${!partnerInfo.isTimeKnown ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>? 시간 모름</button>
                  <button onClick={() => setPartnerInfo({ ...partnerInfo, isTimeKnown: true })} className={`py-3 rounded-xl text-sm font-bold border ${partnerInfo.isTimeKnown ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary-soft)]" : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"}`}>🕒 시간 입력</button>
                </div>

                {partnerInfo.isTimeKnown && (
                  <div className="grid grid-cols-2 gap-3">
                    <select value={partnerInfo.hour} onChange={(e) => setPartnerInfo({ ...partnerInfo, hour: e.target.value })} className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm">{Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}시</option>)}</select>
                    <select value={partnerInfo.min} onChange={(e) => setPartnerInfo({ ...partnerInfo, min: e.target.value })} className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-body)] text-sm">{Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{i}분</option>)}</select>
                  </div>
                )}
              </div>
            </div>
            {/* 수정 완료 버튼 */}
            <button
              onClick={onFinishEditing}
              className="w-full mt-4 py-4 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] rounded-xl text-sm font-bold hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all"
            >
              수정 완료 및 접기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import ButtonSpinner from "@/components/ButtonSpinner";

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

type SajuInputFormProps = {
  user: any;
  userInfo: UserInfo;
  setUserInfo: (info: UserInfo) => void;
  partnerInfo: PartnerInfo;
  setPartnerInfo: (info: PartnerInfo) => void;
  showPartner: boolean;
  setShowPartner: (show: boolean) => void;
  isAgreed: boolean;
  setIsAgreed: (agreed: boolean) => void;
  hasUsedDailyFree: boolean;
  isMyInfoLoading: boolean;
  isPartnerInfoLoading: boolean;
  isAnalyzeLoading: boolean;
  onFetchMySavedInfo: () => void;
  onFetchPartnerSavedInfo: () => void;
  onSavePartnerInfo: () => void;
  onAnalyze: () => void;
};

// 🎬 [씬 2] 사주 명식 입력 폼 (성함/성별/생년월일/시간/결혼·자녀 유무/파트너 정보)
export default function SajuInputForm({
  user,
  userInfo,
  setUserInfo,
  partnerInfo,
  setPartnerInfo,
  showPartner,
  setShowPartner,
  isAgreed,
  setIsAgreed,
  hasUsedDailyFree,
  isMyInfoLoading,
  isPartnerInfoLoading,
  isAnalyzeLoading,
  onFetchMySavedInfo,
  onFetchPartnerSavedInfo,
  onSavePartnerInfo,
  onAnalyze,
}: SajuInputFormProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 mt-2">
      {/* 입력 폼 배경 */}
      <div className="bg-[var(--bg-surface)]/90 backdrop-blur-xl p-7 rounded-3xl border border-[var(--border-strong)]/60 shadow-2xl space-y-6 text-left relative z-20">
        {/* 👇 새로 추가할 '내 명식 자동 입력' 버튼 👇 */}
        {user && (
          <div className="flex justify-end -mt-2 mb-2">
            <button
              type="button"
              onClick={onFetchMySavedInfo}
              disabled={isMyInfoLoading}
              className="flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--brand-primary)]/60 text-[var(--brand-primary)] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--brand-primary)]/20 transition-all shadow-[0_0_10px_rgba(212,175,55,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMyInfoLoading ? (
                <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
              ) : (
                "✨ 내 사주 명식 자동 입력하기"
              )}
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
                  onClick={onFetchPartnerSavedInfo}
                  disabled={isPartnerInfoLoading}
                  className="flex-1 min-w-[calc(50%-0.25rem)] py-3 rounded-xl text-xs font-bold border border-[var(--text-muted)]/50 bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated-alt)] hover:text-[var(--text-body)] transition-all shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPartnerInfoLoading ? (
                    <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
                  ) : (
                    "✨ 자동 불러오기"
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={onSavePartnerInfo}
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
                onChange={(e) => setPartnerInfo({ ...partnerInfo, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPartnerInfo({ ...partnerInfo, gender: "남자" })}
                  className={`py-2 rounded-lg text-xs font-bold border ${partnerInfo.gender === "남자" ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)]" : "bg-[var(--bg-base)] border-[var(--border-default)]"}`}>남자</button>
                <button type="button" onClick={() => setPartnerInfo({ ...partnerInfo, gender: "여자" })}
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
                onChange={(e) => setPartnerInfo({ ...partnerInfo, birth: e.target.value })}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setPartnerInfo({ ...partnerInfo, isTimeKnown: false })}
                  className={`flex-1 py-2 rounded-lg text-xs border ${!partnerInfo.isTimeKnown ? "border-[var(--brand-primary)]" : "border-[var(--border-default)]"}`}>시간 모름</button>
                <button type="button" onClick={() => setPartnerInfo({ ...partnerInfo, isTimeKnown: true })}
                  className={`flex-1 py-2 rounded-lg text-xs border ${partnerInfo.isTimeKnown ? "border-[var(--brand-primary)]" : "border-[var(--border-default)]"}`}>시간 입력</button>
              </div>
              {partnerInfo.isTimeKnown && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 mt-2">
                  <select
                    value={partnerInfo.hour}
                    onChange={(e) => setPartnerInfo({ ...partnerInfo, hour: e.target.value })}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-2 py-3 text-[var(--text-body)] text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{h}시</option>)}
                  </select>
                  <select
                    value={partnerInfo.min}
                    onChange={(e) => setPartnerInfo({ ...partnerInfo, min: e.target.value })}
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
          disabled={hasUsedDailyFree || isAnalyzeLoading}
          onClick={onAnalyze}
          className={`w-full py-4 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-[var(--text-on-brand)] font-extrabold rounded-2xl text-lg shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 ${
            hasUsedDailyFree || isAnalyzeLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
          }`}
        >
          {hasUsedDailyFree ? (
            <>오늘 조회 완료</>
          ) : isAnalyzeLoading ? (
            <span className="inline-flex items-center gap-2"><ButtonSpinner /> 처리 중...</span>
          ) : (
            <>오늘의 사주 무료보기 ✨</>
          )}
        </button>
      </div>
    </div>
  );
}

// AI가 생성한 사주 풀이 텍스트에서 공유용 한 줄 티저를 뽑아낸다.
//
// 1) 결과 텍스트 끝에 "@@@질문1||질문2..." 형태로 꼬리질문 후보가 붙어 오는 경우가 있어 먼저 잘라낸다.
// 2) AI 응답이 "안녕하세요, OO년 경력의 명리학 전문가입니다" 같은 인사말로 시작하는 경우가 많아,
//    인사말 대신 이름이 언급된(=개인화된) 문장을 우선으로 찾는다.
export function extractTeaser(text: string, userName?: string, maxLen = 100): string {
  const withoutSuggestedQuestions = text.split("@@@")[0];
  const cleaned = withoutSuggestedQuestions.replaceAll("**", "").trim();
  const afterHeading = cleaned.replace(/^\[[^\]]*\]\s*/, "");
  const lines = afterHeading
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const isGreeting = (l: string) => /^안녕하세요/.test(l) || (/경력/.test(l) && /(전문가|명리학|타로)/.test(l));
  const nameLine = userName ? lines.find((l) => l.includes(userName)) : undefined;
  const firstLine = nameLine || lines.find((l) => !isGreeting(l)) || lines[0] || afterHeading;

  return firstLine.length > maxLen ? `${firstLine.slice(0, maxLen)}...` : firstLine;
}

// saju_history.content를 화면에 표시할 때 꼬리질문 접미사를 잘라낸 본문만 반환한다.
export function stripSuggestedQuestions(text: string): string {
  return text.split("@@@")[0].trim();
}

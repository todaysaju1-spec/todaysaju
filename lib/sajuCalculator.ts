import { Solar } from "lunar-javascript";

// 🎬 만세력 타임코드 & 오행 밸런스 분석기 
// 성별(gender): 남자는 1, 여자는 0
export function extractSajuDataForAI(year: number, month: number, day: number, hour: number, gender: number) {
  
  // 1. 원본 소스(생일) 임포트 및 엔진 가동
  const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar(); 

  // 2. 명식표 및 오행 추출 (자막 텍스트 & 색상 속성)
  // 2. 명식표 및 오행 추출 (타입스크립트 에러 우회 적용)
const yGZ = eightChar.getYear(); const yWX = (eightChar as any).getYearWuXing();
const mGZ = eightChar.getMonth(); const mWX = (eightChar as any).getMonthWuXing();
const dGZ = eightChar.getDay(); const dWX = (eightChar as any).getDayWuXing();
const tGZ = eightChar.getTime(); const tWX = (eightChar as any).getTimeWuXing();

  // 3. 📊 [핵심] 루메트리 스코프: 오행 밸런스 카운팅
  const allWuXing = yWX + mWX + dWX + tWX;
  const elementCount = {
    '木(나무)': (allWuXing.match(/木/g) || []).length,
    '火(불)': (allWuXing.match(/火/g) || []).length,
    '土(흙)': (allWuXing.match(/土/g) || []).length,
    '金(쇠)': (allWuXing.match(/金/g) || []).length,
    '水(물)': (allWuXing.match(/水/g) || []).length,
  };

  // 4. 10년 대운 추출
  // 4. 10년 대운 추출 (타입스크립트 에러 우회 2차 적용)
const yun = (eightChar as any).getYun(gender);
const daewuns = yun.getDaYun();
  let daewunTimeline = "";
  for (let i = 1; i <= 8; i++) {
    const d = daewuns[i];
    if(d) daewunTimeline += `- ${d.getStartAge()}세 ~ ${d.getStartAge() + 9}세: [${d.getGanZhi()}] 대운\n`;
  }

  // 5. 올해 세운 추출 (타입스크립트 에러 우회 최종 적용)
const currentYear = new Date().getFullYear();
const currentSolar = (Solar as any).fromYmd(currentYear, 1, 1);

const thisYearSewun = currentSolar.getLunar().getEightChar().getYear();
const thisYearWuXing = (currentSolar.getLunar().getEightChar() as any).getYearWuXing();

  // 🚀 AI 프롬프트 전용 데이터 패키지 (이 텍스트가 통째로 n8n으로 넘어감)
  return `
[명식표]
- 년주: ${yGZ} (${yWX})
- 월주: ${mGZ} (${mWX})
- 일주: ${dGZ} (${dWX})
- 시주: ${tGZ} (${tWX})

[오행 밸런스 분석 (총 8자)]
- 木(나무): ${elementCount['木(나무)']}개
- 火(불): ${elementCount['火(불)']}개
- 土(흙): ${elementCount['土(흙)']}개
- 金(쇠): ${elementCount['金(쇠)']}개
- 水(물): ${elementCount['水(물)']}개

[운의 흐름 (타임라인)]
- 올해 ${currentYear}년 세운: ${thisYearSewun} (${thisYearWuXing})
- 10년 대운 흐름:
${daewunTimeline}
  `;
}
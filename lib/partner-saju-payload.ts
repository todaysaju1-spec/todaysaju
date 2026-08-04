import { calculateSaju } from "ssaju";

export type PartnerFormInfo = {
  name: string;
  birth: string;
  hour: string;
  min: string;
  gender: string;
  calendarType: string;
  isTimeKnown: boolean;
};

/** 생년월일 6자리(YYMMDD)가 유효하면 파트너 입력이 있다고 판단 */
export function hasPartnerBirthInput(partner: PartnerFormInfo): boolean {
  const birth = partner.birth?.trim() ?? "";
  return /^\d{6}$/.test(birth);
}

function parsePartnerBirthDate(birth: string) {
  const yearPrefix = parseInt(birth.slice(0, 2), 10) > 30 ? 1900 : 2000;
  return {
    year: yearPrefix + parseInt(birth.slice(0, 2), 10),
    month: parseInt(birth.slice(2, 4), 10),
    day: parseInt(birth.slice(4, 6), 10),
  };
}

function parsePartnerTime(partner: PartnerFormInfo) {
  if (!partner.isTimeKnown || partner.hour === "99") {
    return { hour: undefined as number | undefined, minute: undefined as number | undefined };
  }
  return {
    hour: parseInt(partner.hour, 10),
    minute: parseInt(partner.min, 10),
  };
}

/** LLM/n8n 웹훅용 파트너 raw + 만세력(compact) 페이로드 */
export function buildPartnerSajuPayload(partner: PartnerFormInfo): {
  partnerData: PartnerFormInfo;
  partnerSajuData: string;
} | null {
  if (!hasPartnerBirthInput(partner)) return null;

  const { year, month, day } = parsePartnerBirthDate(partner.birth.trim());
  const { hour, minute } = parsePartnerTime(partner);

  const partnerSajuResult = calculateSaju({
    year,
    month,
    day,
    hour,
    minute,
    gender: partner.gender === "남자" ? "남" : "여",
  });

  return {
    partnerData: partner,
    partnerSajuData: partnerSajuResult.toCompact(),
  };
}

/** 웹훅 body에 spread할 partner 필드 (없으면 null) */
export function getPartnerWebhookFields(partner: PartnerFormInfo) {
  const payload = buildPartnerSajuPayload(partner);
  if (!payload) {
    return { partnerData: null, partnerSajuData: null };
  }
  return {
    partnerData: payload.partnerData,
    partnerSajuData: payload.partnerSajuData,
  };
}

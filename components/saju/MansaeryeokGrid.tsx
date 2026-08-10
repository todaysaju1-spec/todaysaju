"use client";

import type { SajuResult } from "ssaju";
import { getOhangForGanzhi, getOhangTheme, STEM_TO_OHANG } from "@/lib/saju-dashboard-utils";
import { buildDaeunSeyunInsight, buildPillarsInsight, PREMIUM_MENU_KEY } from "@/lib/saju-dashboard-insights";
import SajuSectionCta from "./SajuSectionCta";

type MansaeryeokGridProps = {
  sajuResult: SajuResult;
  onMenuSelect?: (menuTitle: string) => void;
};

function GanzhiCell({
  ganzhi,
  subLabel,
  highlight = false,
}: {
  ganzhi: string;
  subLabel?: string;
  highlight?: boolean;
}) {
  const ohang = getOhangForGanzhi(ganzhi);
  const theme = getOhangTheme(ohang);
  const stem = ganzhi.charAt(0);

  return (
    <div
      className={`rounded-xl border p-2 md:p-3 text-center min-w-[72px] transition-all ${
        highlight
          ? `ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#120524] ${theme.bg} ${theme.border}`
          : `${theme.bgSoft} ${theme.border}`
      }`}
    >
      <div className={`text-lg md:text-xl lg:text-2xl font-bold tracking-wider ${theme.text}`}>{ganzhi}</div>
      {subLabel && (
        <div className="text-[10px] md:text-xs text-gray-400 mt-0.5 truncate">{subLabel}</div>
      )}
      <div className="text-[9px] md:text-[10px] opacity-70 mt-0.5">
        {STEM_TO_OHANG[stem]}/{ohang}
      </div>
    </div>
  );
}

function PillarsRow({
  sajuResult,
  onMenuSelect,
}: {
  sajuResult: SajuResult;
  onMenuSelect?: (menuTitle: string) => void;
}) {
  const pillars = [
    { key: "hour", label: "시주", ganzhi: sajuResult.pillars.hour, tg: sajuResult.tenGods.hour },
    { key: "day", label: "일주", ganzhi: sajuResult.pillars.day, tg: sajuResult.tenGods.day },
    { key: "month", label: "월주", ganzhi: sajuResult.pillars.month, tg: sajuResult.tenGods.month },
    { key: "year", label: "년주", ganzhi: sajuResult.pillars.year, tg: sajuResult.tenGods.year },
  ];

  return (
    <div className="rounded-2xl border border-[#3b1d6b]/80 bg-[#0a0514]/80 p-4 md:p-5">
      <h4 className="text-sm md:text-base lg:text-lg font-bold text-[#D4AF37] mb-3">사주 원국 (四柱)</h4>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {pillars.map((p) => (
          <div key={p.key} className="flex flex-col items-center gap-1">
            <span className="text-[10px] md:text-xs text-[#a48cd1] font-bold">{p.label}</span>
            <GanzhiCell
              ganzhi={p.ganzhi}
              subLabel={`${p.tg.stem}/${p.tg.branch}`}
              highlight={p.key === "day"}
            />
          </div>
        ))}
      </div>

      <SajuSectionCta
        comment={buildPillarsInsight(sajuResult)}
        onMenuSelect={onMenuSelect}
        buttons={[{ label: "👑 프리미엄 총 사주운세 (BEST)", menuTitle: PREMIUM_MENU_KEY }]}
      />
    </div>
  );
}

function DaeunTable({ sajuResult }: { sajuResult: SajuResult }) {
  const current = sajuResult.daeun.current;

  return (
    <div className="overflow-x-auto">
      <h4 className="text-sm md:text-base lg:text-lg font-bold text-[#D4AF37] mb-3">
        대운 (大運)
        {current && (
          <span className="ml-2 text-[10px] md:text-xs font-normal text-[#a48cd1]">
            현재 ★ {current.ganzhi} ({current.startAge}~{current.endAge}세)
          </span>
        )}
      </h4>
      <table className="w-full text-xs md:text-sm lg:text-base border-collapse min-w-[480px]">
        <thead>
          <tr className="text-[#a48cd1] border-b border-[#3b1d6b]">
            <th className="py-2 px-1 text-left font-medium">나이</th>
            <th className="py-2 px-1 text-left font-medium">연도</th>
            <th className="py-2 px-1 text-center font-medium">간지</th>
            <th className="py-2 px-1 text-left font-medium">천간십성</th>
            <th className="py-2 px-1 text-left font-medium">지지십성</th>
            <th className="py-2 px-1 text-left font-medium">12운성</th>
          </tr>
        </thead>
        <tbody>
          {sajuResult.daeun.list.map((item) => {
            const isCurrent = current?.ganzhi === item.ganzhi && current?.startAge === item.startAge;
            const theme = getOhangTheme(getOhangForGanzhi(item.ganzhi));
            return (
              <tr
                key={`${item.startAge}-${item.ganzhi}`}
                className={`border-b border-[#3b1d6b]/40 ${isCurrent ? "bg-[#D4AF37]/10" : "hover:bg-[#1c0d33]/50"}`}
              >
                <td className="py-2 px-1 text-gray-300 whitespace-nowrap">
                  {isCurrent && <span className="text-[#D4AF37] mr-1">★</span>}
                  {item.startAge}~{item.endAge}세
                </td>
                <td className="py-2 px-1 text-gray-400">{item.startYear}</td>
                <td className="py-2 px-1">
                  <span
                    className={`inline-block px-2 py-1 rounded-lg font-bold text-xs md:text-sm ${theme.bg} ${theme.text} border ${theme.border}`}
                  >
                    {item.ganzhi}
                  </span>
                </td>
                <td className="py-2 px-1 text-gray-300">{item.stemTenGod}</td>
                <td className="py-2 px-1 text-gray-300">{item.branchTenGod}</td>
                <td className="py-2 px-1 text-gray-400">{item.stage12}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SeyunTable({ sajuResult }: { sajuResult: SajuResult }) {
  const currentYear = sajuResult.currentYear;
  const rows = sajuResult.seyun.filter(
    (s) => s.year >= currentYear - 3 && s.year <= currentYear + 5
  );

  return (
    <div>
      <h4 className="text-sm md:text-base lg:text-lg font-bold text-[#D4AF37] mb-3 mt-5">
        세운 (歲運) · {currentYear - 3}~{currentYear + 5}
      </h4>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {rows.map((item) => {
          const isCurrent = item.year === currentYear;
          const theme = getOhangTheme(getOhangForGanzhi(item.ganzhi));
          return (
            <div
              key={item.year}
              className={`rounded-xl border p-2 md:p-2.5 text-center ${
                isCurrent
                  ? "ring-2 ring-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/60"
                  : `${theme.bgSoft} ${theme.border}`
              }`}
            >
              <div
                className={`text-[10px] md:text-xs font-bold ${isCurrent ? "text-[#D4AF37]" : "text-gray-400"}`}
              >
                {isCurrent ? "★ " : ""}
                {item.year}
              </div>
              <div className={`text-base md:text-lg font-bold mt-1 ${theme.text}`}>{item.ganzhi}</div>
              <div className="text-[9px] md:text-[10px] text-gray-500 mt-1 leading-tight">
                {item.tenGodStem}/{item.tenGodBranch}
              </div>
              <div className="text-[9px] md:text-[10px] text-gray-600">{item.stage12}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DaeunSeyunSection({
  sajuResult,
  onMenuSelect,
}: {
  sajuResult: SajuResult;
  onMenuSelect?: (menuTitle: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#3b1d6b]/80 bg-[#0a0514]/80 p-4 md:p-5 overflow-x-auto">
      <DaeunTable sajuResult={sajuResult} />
      <SeyunTable sajuResult={sajuResult} />

      <SajuSectionCta
        comment={buildDaeunSeyunInsight(sajuResult)}
        onMenuSelect={onMenuSelect}
        buttons={[
          { label: "⚡ 월별 풀이 보기", menuTitle: "월별 풀이" },
          { label: "✨ 삶의 전환점 확인", menuTitle: "삶의 전환점" },
        ]}
      />
    </div>
  );
}

export default function MansaeryeokGrid({ sajuResult, onMenuSelect }: MansaeryeokGridProps) {
  return (
    <div className="space-y-4">
      <PillarsRow sajuResult={sajuResult} onMenuSelect={onMenuSelect} />
      <DaeunSeyunSection sajuResult={sajuResult} onMenuSelect={onMenuSelect} />
    </div>
  );
}

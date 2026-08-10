"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { SajuResult } from "ssaju";
import { OHANG_THEME, type OhangKey } from "@/lib/saju-dashboard-utils";
import { buildOhangTenGodInsight } from "@/lib/saju-dashboard-insights";
import SajuSectionCta from "./SajuSectionCta";

type OhangDonutChartProps = {
  sajuResult: SajuResult;
  onMenuSelect?: (menuTitle: string) => void;
};

const OHANG_ORDER: OhangKey[] = ["목", "화", "토", "금", "수"];

const CHART_HEIGHT_CLASS = "h-44 sm:h-52 md:h-56 lg:h-64 max-h-72";

function buildOhangChartData(fiveElements: Record<string, number>) {
  return OHANG_ORDER.map((key) => ({
    name: OHANG_THEME[key].label,
    key,
    value: fiveElements[key] ?? 0,
    fill: OHANG_THEME[key].fill,
  })).filter((d) => d.value > 0);
}

function buildTenGodChartData(tenGods: SajuResult["tenGods"]) {
  const counts: Record<string, number> = {};
  const entries = [tenGods.year, tenGods.month, tenGods.day, tenGods.hour];

  for (const entry of entries) {
    for (const god of [entry.stem, entry.branch]) {
      if (!god || god === "(일간)") continue;
      counts[god] = (counts[god] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export default function OhangDonutChart({ sajuResult, onMenuSelect }: OhangDonutChartProps) {
  const ohangData = buildOhangChartData(sajuResult.fiveElements);
  const tenGodData = buildTenGodChartData(sajuResult.tenGods);
  const totalOhang = ohangData.reduce((sum, d) => sum + d.value, 0);
  const insight = buildOhangTenGodInsight(sajuResult);

  return (
    <div className="rounded-2xl border border-[#3b1d6b]/80 bg-[#0a0514]/80 p-4 md:p-5">
      <h4 className="text-sm md:text-base lg:text-lg font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
        오행(五行) · 십성(十星) 분석
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs md:text-sm text-[#a48cd1] mb-2 font-medium">오행 분포</p>
          {totalOhang === 0 ? (
            <p className="text-xs md:text-sm text-gray-500 text-center py-8">오행 데이터 없음</p>
          ) : (
            <div className={`w-full ${CHART_HEIGHT_CLASS}`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ohangData}
                    cx="50%"
                    cy="50%"
                    innerRadius="42%"
                    outerRadius="62%"
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {ohangData.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} stroke="#120524" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#120524",
                      border: "1px solid #D4AF37",
                      borderRadius: "12px",
                      fontSize: "13px",
                    }}
                    formatter={(value: number, _name, props) => [
                      `${value}자 (${Math.round((value / totalOhang) * 100)}%)`,
                      props.payload.name,
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", color: "#a48cd1" }}
                    formatter={(value) => <span className="text-gray-300 text-xs md:text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {OHANG_ORDER.map((key) => (
              <span
                key={key}
                className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full border ${OHANG_THEME[key].border} ${OHANG_THEME[key].bgSoft} ${OHANG_THEME[key].text}`}
              >
                {OHANG_THEME[key].label}: {sajuResult.fiveElements[key] ?? 0}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs md:text-sm text-[#a48cd1] mb-2 font-medium">십성 분포</p>
          {tenGodData.length === 0 ? (
            <p className="text-xs md:text-sm text-gray-500 text-center py-8">십성 데이터 없음</p>
          ) : (
            <div className={`w-full ${CHART_HEIGHT_CLASS}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenGodData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3b1d6b" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "#a48cd1", fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={64}
                    tick={{ fill: "#e0d6f5", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#120524",
                      border: "1px solid #D4AF37",
                      borderRadius: "12px",
                      fontSize: "13px",
                    }}
                    cursor={{ fill: "rgba(212,175,55,0.08)" }}
                  />
                  <Bar dataKey="count" fill="#D4AF37" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <SajuSectionCta
        comment={insight}
        onMenuSelect={onMenuSelect}
        buttons={[
          { label: "💰 금전/재물운 자세히 보기", menuTitle: "금전/재물" },
          { label: "💼 직업운 자세히 보기", menuTitle: "직업운" },
        ]}
      />
    </div>
  );
}

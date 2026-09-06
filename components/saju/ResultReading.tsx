"use client";

import { useEffect, useMemo, useState } from "react";
import { splitSajuResultSections } from "@/lib/saju-result-sections";

type ResultReadingProps = {
  text: string;
};

export default function ResultReading({ text }: ResultReadingProps) {
  const sections = useMemo(() => splitSajuResultSections(text), [text]);
  const [openId, setOpenId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    setOpenId(sections[0]?.id ?? "");
  }, [text, sections]);

  if (sections.length === 0) return null;

  if (sections.length === 1) {
    return (
      <div
        className="text-[var(--text-body)] text-lg md:text-xl leading-loose tracking-wide mb-6 whitespace-pre-wrap"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {sections[0].body || text.replaceAll("**", "")}
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => {
              setOpenId(section.id);
              document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              openId === section.id
                ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary)]"
                : "bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)]"
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      {sections.map((section) => {
        const isOpen = openId === section.id;
        return (
          <section
            key={section.id}
            id={section.id}
            className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-base)]/60 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? "" : section.id)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="text-sm font-bold text-[var(--text-body)]">{section.title}</span>
              <span className="text-xs font-bold text-[var(--brand-primary)]">{isOpen ? "접기 ▲" : "펼치기 ▼"}</span>
            </button>
            {isOpen && (
              <div
                className="px-4 pb-4 text-[var(--text-body)] text-base md:text-lg leading-loose tracking-wide whitespace-pre-wrap border-t border-[var(--border-default)]/60 pt-3"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {section.body}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

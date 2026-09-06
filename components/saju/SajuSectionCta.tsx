"use client";

export type SajuCtaButton = {
  label: string;
  menuTitle: string;
};

type SajuSectionCtaProps = {
  comment: string;
  buttons: SajuCtaButton[];
  onMenuSelect?: (menuTitle: string) => void;
};

export default function SajuSectionCta({ comment, buttons, onMenuSelect }: SajuSectionCtaProps) {
  if (!onMenuSelect) return null;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border-default)]/60">
      <p className="text-sm md:text-base lg:text-lg text-[var(--text-muted)] leading-relaxed mb-3">{comment}</p>
      <div className="flex flex-wrap gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.menuTitle + btn.label}
            type="button"
            onClick={() => onMenuSelect(btn.menuTitle)}
            className="inline-flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm lg:text-base font-bold bg-gradient-to-r from-[var(--border-strong)] to-[var(--bg-muted)] border border-[var(--brand-primary)]/60 text-[var(--brand-primary-soft)] hover:border-[var(--brand-primary)] hover:shadow-[0_0_12px_rgba(212,175,55,0.2)] transition-all active:scale-[0.98]"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentTenantTheme } from "@/lib/tenant-theme";
import { extractTeaser, stripSuggestedQuestions } from "@/lib/share-teaser";

type HistoryRow = {
  id: string;
  type: string;
  title: string;
  content: string;
  created_at: string;
};

// 공유 링크는 로그인 없이 누구나 열 수 있어야 하므로, RLS를 우회하는 서버 전용 admin 클라이언트로
// 필요한 컬럼(제목/본문/날짜)만 선택해서 가져온다 — user_id 등 다른 컬럼은 절대 클라이언트로 넘기지 않는다.
async function getSharedHistoryRow(id: string): Promise<HistoryRow | null> {
  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("saju_history")
      .select("id, type, title, content, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as HistoryRow;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [row, theme] = await Promise.all([getSharedHistoryRow(id), getCurrentTenantTheme()]);

  if (!row) {
    return { title: theme.siteName };
  }

  const teaser = extractTeaser(row.content, undefined, 90);
  const title = `${row.title} | ${theme.siteName}`;

  return {
    title,
    description: teaser,
    openGraph: {
      title,
      description: teaser,
      siteName: theme.siteName,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: theme.siteName }],
      locale: "ko_KR",
      type: "article",
    },
  };
}

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row, theme] = await Promise.all([getSharedHistoryRow(id), getCurrentTenantTheme()]);

  if (!row) {
    notFound();
  }

  const displayContent = stripSuggestedQuestions(row.content).replaceAll("**", "");
  const formattedDate = new Date(row.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-5 md:p-6">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-xs text-[var(--text-muted)] mb-2">{formattedDate}</div>
          <h1
            className="text-xl md:text-2xl font-bold text-[var(--text-body)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {row.title}
          </h1>
        </div>

        <div
          className="text-[var(--text-body)] text-base leading-loose whitespace-pre-wrap mb-8"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {displayContent}
        </div>

        <a
          href="/"
          className="block w-full text-center bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--text-on-brand)] font-bold py-3.5 rounded-xl transition-all"
        >
          나도 무료로 오늘의 사주 보러가기 👉
        </a>

        <p className="text-center text-[11px] text-[var(--text-muted)] mt-4">
          {theme.siteName} · 이 리포트는 공유된 개인 운세 결과입니다
        </p>
      </div>
    </div>
  );
}

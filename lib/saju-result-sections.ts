export type ResultSection = {
  id: string;
  title: string;
  body: string;
};

function cleanTitle(raw: string): string {
  return raw.replace(/[*_#\[\]【】■●◆]/g, "").replace(/[:：]\s*$/, "").trim();
}

function headingFromLine(line: string): string | null {
  const t = line.trim();
  if (!t || t.length > 40) return null;

  const markdown = t.match(/^#{1,3}\s+(.+)$/);
  if (markdown) return cleanTitle(markdown[1]);

  const bracket = t.match(/^[【\[]\s*([^\]】]{1,18})\s*[】\]]\s*:?\s*$/);
  if (bracket) return cleanTitle(bracket[1]);

  const labeled = t.match(/^(?:■|●|◆)\s*(.{1,18})$/);
  if (labeled) return cleanTitle(labeled[1]);

  const numbered = t.match(/^(?:\d+[.)]\s*|[①-⑳]\s+)(.{1,18})$/);
  if (numbered) return cleanTitle(numbered[1]);

  return null;
}

function splitByHeadings(lines: string[]): ResultSection[] | null {
  const sections: ResultSection[] = [];
  let currentTitle = "";
  let currentBody: string[] = [];

  const flush = () => {
    const body = currentBody.join("\n").trim();
    if (!currentTitle && !body) return;
    sections.push({
      id: `section-${sections.length + 1}`,
      title: currentTitle || `풀이 ${sections.length + 1}`,
      body,
    });
    currentBody = [];
  };

  for (const line of lines) {
    const heading = headingFromLine(line);
    if (heading) {
      if (currentTitle || currentBody.some((l) => l.trim())) flush();
      currentTitle = heading;
      continue;
    }
    currentBody.push(line);
  }
  flush();

  return sections.length >= 2 ? sections : null;
}

function splitByParagraphs(text: string): ResultSection[] {
  const chunks = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length < 2) {
    return [{ id: "section-1", title: "오늘의 풀이", body: text }];
  }

  return chunks.map((chunk, index) => {
    const firstLine = chunk.split("\n")[0]?.trim() ?? "";
    const title = firstLine.length > 0 && firstLine.length <= 18 ? firstLine : `풀이 ${index + 1}`;
    const body = title === firstLine ? chunk.slice(firstLine.length).trim() : chunk;
    return {
      id: `section-${index + 1}`,
      title,
      body: body || chunk,
    };
  });
}

export function splitSajuResultSections(raw: string): ResultSection[] {
  const cleaned = raw.split("@@@")[0].replaceAll("**", "").trim();
  if (!cleaned) return [];

  const lines = cleaned.split("\n");
  return splitByHeadings(lines) ?? splitByParagraphs(cleaned);
}

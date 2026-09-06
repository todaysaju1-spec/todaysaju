import { BRANCH_TO_OHANG, OHANG_THEME, STEM_TO_OHANG, type OhangKey } from "@/lib/saju-dashboard-utils";

export type MyeongsikSharePillar = {
  label: string;
  stem: string;
  branch: string;
  stemGod: string;
  branchGod: string;
  highlight: boolean;
};

export type MyeongsikSharePayload = {
  name: string;
  birthLabel: string;
  dayStem: string;
  geukguk: string;
  pillars: MyeongsikSharePillar[];
  fiveElements: Record<string, number>;
};

const OHANG_ORDER: OhangKey[] = ["목", "화", "토", "금", "수"];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export async function renderMyeongsikShareImage(payload: MyeongsikSharePayload): Promise<Blob> {
  const width = 1080;
  const height = 1440;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 만들 수 없습니다.");

  const [paper, seal] = await Promise.all([
    loadImage("/saju/myeongsik-paper.png"),
    loadImage("/saju/myeongsik-seal.png"),
  ]);

  ctx.drawImage(paper, 0, 0, width, height);
  ctx.fillStyle = "rgba(255, 248, 235, 0.28)";
  ctx.fillRect(0, 0, width, height);

  ctx.drawImage(seal, width - 210, 70, 150, 150);

  ctx.fillStyle = "#7a2e24";
  ctx.font = "500 36px 'Noto Serif KR', serif";
  ctx.textAlign = "left";
  ctx.fillText("四柱命理", 80, 130);

  ctx.fillStyle = "#1c140c";
  ctx.font = "700 64px 'Noto Serif KR', serif";
  ctx.fillText(`${payload.name} 명식`, 80, 210);

  ctx.fillStyle = "#5c4a3a";
  ctx.font = "500 30px 'Noto Serif KR', serif";
  ctx.fillText(payload.birthLabel, 80, 262);

  ctx.font = "700 28px 'Noto Serif KR', serif";
  ctx.fillStyle = "#8a3a1a";
  ctx.fillText(`일간 ${payload.dayStem}  ·  ${payload.geukguk}`, 80, 312);

  const colW = 200;
  const gap = 24;
  const totalW = payload.pillars.length * colW + (payload.pillars.length - 1) * gap;
  const startX = (width - totalW) / 2;
  const top = 380;

  payload.pillars.forEach((pillar, index) => {
    const x = startX + index * (colW + gap);
    const stemOhang = STEM_TO_OHANG[pillar.stem] ?? "토";
    const branchOhang = BRANCH_TO_OHANG[pillar.branch] ?? "토";
    const stemColor = OHANG_THEME[stemOhang].solidHex;
    const branchColor = OHANG_THEME[branchOhang].solidHex;

    ctx.fillStyle = "#6b5344";
    ctx.font = "700 28px 'Noto Serif KR', serif";
    ctx.textAlign = "center";
    ctx.fillText(pillar.label, x + colW / 2, top);

    const stemY = top + 28;
    ctx.fillStyle = stemColor;
    roundRect(ctx, x, stemY, colW, 210, 22);
    ctx.fill();
    if (pillar.highlight) {
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = 8;
      ctx.stroke();
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 120px 'Noto Serif KR', serif";
    ctx.fillText(pillar.stem || "?", x + colW / 2, stemY + 140);

    const branchY = stemY + 226;
    ctx.fillStyle = branchColor;
    roundRect(ctx, x, branchY, colW, 210, 22);
    ctx.fill();
    if (pillar.highlight) {
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = 8;
      ctx.stroke();
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 120px 'Noto Serif KR', serif";
    ctx.fillText(pillar.branch || "?", x + colW / 2, branchY + 140);

    ctx.fillStyle = "#5c4a3a";
    ctx.font = "500 24px 'Noto Serif KR', serif";
    ctx.fillText(`${pillar.stemGod} / ${pillar.branchGod}`, x + colW / 2, branchY + 250);
  });

  const orbY = 1240;
  const orbR = 28;
  const orbGap = 86;
  const orbsW = OHANG_ORDER.length * orbGap - (orbGap - orbR * 2);
  let orbX = (width - orbsW) / 2 + orbR;
  OHANG_ORDER.forEach((key) => {
    ctx.beginPath();
    ctx.fillStyle = OHANG_THEME[key].hex;
    ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 26px 'Noto Serif KR', serif";
    ctx.textAlign = "center";
    ctx.fillText(String(payload.fiveElements[key] ?? 0), orbX, orbY + 9);
    ctx.fillStyle = "#5c4a3a";
    ctx.font = "500 22px 'Noto Serif KR', serif";
    ctx.fillText(OHANG_THEME[key].label, orbX, orbY + 58);
    orbX += orbGap;
  });

  ctx.fillStyle = "#7a2e24";
  ctx.font = "700 28px 'Noto Serif KR', serif";
  ctx.fillText("오늘의사주 PRO", width / 2, 1388);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("이미지 생성에 실패했습니다."));
      else resolve(blob);
    }, "image/png");
  });
}

export async function shareMyeongsikImage(payload: MyeongsikSharePayload): Promise<"shared" | "copied" | "downloaded"> {
  const blob = await renderMyeongsikShareImage(payload);
  const file = new File([blob], `${payload.name}-명식표.png`, { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `${payload.name}님의 사주 명식표`,
      text: "내 사주 명식표 · 오늘의사주 PRO",
    });
    return "shared";
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}

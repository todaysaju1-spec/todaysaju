import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

type AdminAuthResult =
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; status: number; message: string };

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function verifyAdminRequest(request: NextRequest): Promise<AdminAuthResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "로그인이 필요합니다." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { ok: false, status: 500, message: "서버 설정 오류" };
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user || !user.email) {
    return { ok: false, status: 401, message: "유효하지 않은 세션입니다." };
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    return { ok: false, status: 500, message: "ADMIN_EMAILS가 서버에 설정되지 않았습니다." };
  }

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return { ok: false, status: 403, message: "관리자 권한이 없습니다." };
  }

  return { ok: true, user: { id: user.id, email: user.email } };
}

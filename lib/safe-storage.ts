export function safeGetItem(key: string, fallback = ""): string {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (error) {
    console.error(`localStorage.getItem 실패 (${key}):`, error);
    return fallback;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`localStorage.setItem 실패 (${key}):`, error);
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`localStorage.removeItem 실패 (${key}):`, error);
    return false;
  }
}

export function safeGetJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`localStorage JSON 파싱 실패 (${key}):`, error);
    return fallback;
  }
}

export function safeSetJSON(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`localStorage JSON 저장 실패 (${key}):`, error);
    return false;
  }
}

export function safeSessionGetItem(key: string, fallback = ""): string {
  if (typeof window === "undefined") return fallback;
  try {
    return sessionStorage.getItem(key) ?? fallback;
  } catch (error) {
    console.error(`sessionStorage.getItem 실패 (${key}):`, error);
    return fallback;
  }
}

export function safeSessionSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`sessionStorage.setItem 실패 (${key}):`, error);
    return false;
  }
}

export function safeSessionGetJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`sessionStorage JSON 파싱 실패 (${key}):`, error);
    return fallback;
  }
}

export function safeSessionSetJSON(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`sessionStorage JSON 저장 실패 (${key}):`, error);
    return false;
  }
}

export function safeSessionRemoveItem(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`sessionStorage.removeItem 실패 (${key}):`, error);
    return false;
  }
}

export function isDismissedWithinMs(key: string, durationMs: number): boolean {
  const raw = safeGetItem(key);
  if (!raw) return false;
  const dismissedAt = parseInt(raw, 10);
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < durationMs;
}

export function markDismissedNow(key: string): boolean {
  return safeSetItem(key, String(Date.now()));
}

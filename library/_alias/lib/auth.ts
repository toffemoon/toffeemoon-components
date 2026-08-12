import { useSyncExternalStore } from "react";

/**
 * Web 会话层(演示版,2026-07-29)
 * 官网 dashboard 是"登录后看自己的数据"的形态,但 web 端真实注册/登录
 * 还没上线 —— 这里只放一个明示的演示账号,除它之外一律拒绝,不假装
 * 接受任意凭据(官网铁律:不放假东西)。
 * 将来接真后端(Supabase auth,耿越的域):保持下面五个导出的签名不变,
 * 只把实现换掉,页面层不用动。
 */

export const DEMO_EMAIL = "demo@ripple.app";
export const DEMO_PASSWORD = "sample-data";

export interface Session {
  email: string;
  /** 演示会话标记:真登录上线后为 false,页面据此显示 Sample data 徽记 */
  demo: boolean;
  signedInAt: string;
}

const STORAGE_KEY = "ripple.web-session";

const listeners = new Set<() => void>();

/* useSyncExternalStore 的 getSnapshot 必须返回稳定引用,
   否则每次渲染都判定"店里有新货"而无限重渲 —— 缓存按原串失效 */
let cachedRaw: string | null = null;
let cachedSession: Session | null = null;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // 隐私模式等拿不到 storage 时按未登录处理
  }
}

export function getSession(): Session | null {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  if (!raw) {
    cachedSession = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Session;
    cachedSession =
      typeof parsed?.email === "string" && typeof parsed?.signedInAt === "string"
        ? parsed
        : null;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function signIn(
  email: string,
  password: string,
): { ok: true } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  if (normalized !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return {
      ok: false,
      error:
        "That account does not exist yet. Web sign-in currently runs on the demo account only.",
    };
  }
  const session: Session = {
    email: DEMO_EMAIL,
    demo: true,
    signedInAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage 不可用时保持内存态:本次会话内仍可用
    cachedRaw = JSON.stringify(session);
    cachedSession = session;
    emit();
    return { ok: true };
  }
  emit();
  return { ok: true };
}

export function signOut() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    cachedRaw = null;
    cachedSession = null;
  }
  emit();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  // 别的标签页登录/登出也要同步
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/** 组件里订阅会话状态;登录/登出即时反映到导航等处 */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, () => null);
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEMO_MODE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";

export function getApiBase() {
  return API_BASE;
}

export function isProduction() {
  return IS_PRODUCTION;
}

export function isDemoModeEnabled() {
  return DEMO_MODE_ENABLED;
}

export function canUseDemoMode() {
  if (DEMO_MODE_ENABLED) {
    return true;
  }

  return !IS_PRODUCTION && !API_BASE;
}

export function assertApiConfigured() {
  if (API_BASE) {
    return;
  }

  if (canUseDemoMode()) {
    return;
  }

  throw new Error(
    "운영 배포에서는 NEXT_PUBLIC_API_URL이 필요합니다. 데모 배포라면 NEXT_PUBLIC_ENABLE_DEMO=true를 설정해 주세요.",
  );
}

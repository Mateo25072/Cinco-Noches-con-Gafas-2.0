import { SAVE_KEY } from "./config.ts";
import type { SaveData } from "./types.ts";

const EMPTY: SaveData = {
  version: 2,
  night: 1,
  beaten: 0,
  night6: false,
  night6Unlocked: false,
  customUnlocked: false,
  custom20: false,
  canContinue: false,
};

export function loadSave(): SaveData {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const night6 = Boolean(parsed.night6 || parsed.night6Unlocked);
    return {
      version: 2,
      night: clampInt(parsed.night, 1, 6),
      beaten: clampInt(parsed.beaten, 0, 6),
      night6,
      night6Unlocked: night6,
      customUnlocked: Boolean(parsed.customUnlocked),
      custom20: Boolean(parsed.custom20),
      canContinue: Boolean(parsed.canContinue),
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writeSave(patch: Partial<SaveData>): SaveData {
  const merged = { ...loadSave(), ...patch, version: 2 as const };
  const night6 = Boolean(merged.night6 || merged.night6Unlocked);
  const next: SaveData = {
    ...merged,
    night6,
    night6Unlocked: night6,
  };
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}

export function clearSave(): SaveData {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
  return { ...EMPTY };
}

function clampInt(n: unknown, lo: number, hi: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : lo;
  return Math.min(hi, Math.max(lo, v));
}

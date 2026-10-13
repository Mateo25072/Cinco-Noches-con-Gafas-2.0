import { SAVE_KEY } from "./config.ts";
import type { SaveData } from "./types.ts";

const EMPTY: SaveData = {
  version: 2,
  night: 1,
  beaten: 0,
  night6: false,
  custom20: false,
};

export function loadSave(): SaveData {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      version: 2,
      night: clampInt(parsed.night, 1, 6),
      beaten: clampInt(parsed.beaten, 0, 6),
      night6: Boolean(parsed.night6),
      custom20: Boolean(parsed.custom20),
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writeSave(patch: Partial<SaveData>): SaveData {
  const next = { ...loadSave(), ...patch, version: 2 as const };
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}

function clampInt(n: unknown, lo: number, hi: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : lo;
  return Math.min(hi, Math.max(lo, v));
}

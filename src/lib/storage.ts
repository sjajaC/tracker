import type { AppData, Settings } from "./types"

const KEY = "habit-tracker-data-v1"
const DATA_VERSION = 1

export const defaultSettings: Settings = {
  theme: "system",
  weekStart: 1,
}

export function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    habits: [],
    logs: {},
    todos: [],
    routines: [],
    routineLogs: {},
    settings: { ...defaultSettings },
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as Partial<AppData>
    const habits = (Array.isArray(parsed.habits) ? parsed.habits : []).map(
      (h) => ({ ...h, goalStreak: h.goalStreak ?? 0 })
    )
    return {
      version: DATA_VERSION,
      habits,
      logs: parsed.logs && typeof parsed.logs === "object" ? parsed.logs : {},
      todos: Array.isArray(parsed.todos) ? parsed.todos : [],
      routines: Array.isArray(parsed.routines) ? parsed.routines : [],
      routineLogs:
        parsed.routineLogs && typeof parsed.routineLogs === "object"
          ? parsed.routineLogs
          : {},
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
    }
  } catch (e) {
    console.error("Veri okunamadı, sıfırdan başlanıyor", e)
    return emptyData()
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (e) {
    console.error("Veri kaydedilemedi", e)
  }
}

export function clearData(): void {
  localStorage.removeItem(KEY)
}

export function estimateSize(data: AppData): string {
  const bytes = new Blob([JSON.stringify(data)]).size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

import type { Priority, Routine, TimeOfDay, Todo } from "./types"
import { dateKey, diffDays, parseKey, startOfDay } from "./date"

export const PRIORITY: Record<
  Priority,
  { label: string; color: string; order: number }
> = {
  high: { label: "Yüksek", color: "var(--chart-4)", order: 0 },
  medium: { label: "Orta", color: "var(--chart-3)", order: 1 },
  low: { label: "Düşük", color: "var(--chart-2)", order: 2 },
}

export const TIME_OF_DAY: Record<
  TimeOfDay,
  { label: string; icon: string; order: number }
> = {
  morning: { label: "Sabah", icon: "🌅", order: 0 },
  afternoon: { label: "Öğlen", icon: "☀️", order: 1 },
  evening: { label: "Akşam", icon: "🌙", order: 2 },
  anytime: { label: "Fark etmez", icon: "🕐", order: 3 },
}

/* ------------------------------- Görevler -------------------------------- */

export interface DueInfo {
  label: string
  tone: "overdue" | "today" | "soon" | "later" | "none"
}

export function dueInfo(due: string | null): DueInfo {
  if (!due) return { label: "", tone: "none" }
  const d = startOfDay(parseKey(due))
  const today = startOfDay(new Date())
  const diff = diffDays(d, today)
  if (diff < 0) {
    const n = Math.abs(diff)
    return { label: n === 1 ? "Dün" : `${n} gün gecikti`, tone: "overdue" }
  }
  if (diff === 0) return { label: "Bugün", tone: "today" }
  if (diff === 1) return { label: "Yarın", tone: "soon" }
  if (diff <= 7) return { label: `${diff} gün sonra`, tone: "soon" }
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
  return { label: `${d.getDate()} ${months[d.getMonth()]}`, tone: "later" }
}

export function subtaskProgress(t: Todo): { done: number; total: number } {
  const total = t.subtasks.length
  const done = t.subtasks.filter((s) => s.done).length
  return { done, total }
}

/** açık görevleri akıllı sırala: önce gecikmiş/bugün, sonra öncelik, sonra tarih */
export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    const da = a.due ? parseKey(a.due).getTime() : Infinity
    const db = b.due ? parseKey(b.due).getTime() : Infinity
    if (da !== db) return da - db
    const pa = PRIORITY[a.priority].order
    const pb = PRIORITY[b.priority].order
    if (pa !== pb) return pa - pb
    return a.order - b.order
  })
}

export type TodoFilter = "active" | "today" | "upcoming" | "done" | "all"

export function filterTodos(todos: Todo[], filter: TodoFilter): Todo[] {
  const todayK = dateKey(new Date())
  switch (filter) {
    case "active":
      return todos.filter((t) => !t.done)
    case "today":
      return todos.filter(
        (t) => !t.done && t.due && t.due <= todayK
      )
    case "upcoming":
      return todos.filter((t) => !t.done && t.due && t.due > todayK)
    case "done":
      return todos.filter((t) => t.done)
    case "all":
    default:
      return todos
  }
}

/* ------------------------------- Rutinler -------------------------------- */

/** rutin bugün (veya verilen güne) planlı mı? */
export function routineScheduled(r: Routine, d: Date): boolean {
  if (!r.days || r.days.length === 0) return true
  return r.days.includes(d.getDay())
}

export function routineProgress(
  r: Routine,
  routineLogs: Record<string, Record<string, string[]>>,
  key: string
): { done: number; total: number; rate: number; doneIds: Set<string> } {
  const doneIds = new Set(routineLogs[r.id]?.[key] ?? [])
  const total = r.steps.length
  const done = r.steps.filter((s) => doneIds.has(s.id)).length
  return { done, total, rate: total ? done / total : 0, doneIds }
}

export function totalMinutes(r: Routine): number {
  return r.steps.reduce((s, st) => s + (st.minutes || 0), 0)
}

export function routineDaysLabel(r: Routine): string {
  if (!r.days || r.days.length === 0 || r.days.length === 7) return "Her gün"
  const names = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"]
  return r.days
    .slice()
    .sort()
    .map((d) => names[d])
    .join(", ")
}

import type { DayLog, Habit, Logs } from "./types"
import {
  addDays,
  dateKey,
  MONTHS_SHORT,
  parseKey,
  startOfDay,
  startOfWeek,
  todayKey,
  weekId,
} from "./date"

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase()
}

/** target value that counts a day as "done" */
export function goalValue(habit: Habit): number {
  return habit.measurable ? Math.max(1, habit.target) : 1
}

/** is this habit scheduled (expected) on the given day? */
export function isScheduled(habit: Habit, d: Date): boolean {
  // can't be scheduled before creation
  if (startOfDay(d) < startOfDay(parseKey(habit.createdAt.slice(0, 10)))) {
    return false
  }
  switch (habit.frequency) {
    case "daily":
      return true
    case "weekly":
      return true // any day counts toward the weekly quota
    case "custom":
      return habit.weekdays.includes(d.getDay())
    default:
      return true
  }
}

export function getLog(logs: Logs, habitId: string, key: string): DayLog | undefined {
  return logs[habitId]?.[key]
}

export function dayValue(logs: Logs, habitId: string, key: string): number {
  return logs[habitId]?.[key]?.value ?? 0
}

export function isDone(habit: Habit, logs: Logs, key: string): boolean {
  return dayValue(logs, habit.id, key) >= goalValue(habit)
}

/** 0..1 progress for a day (measurable shows partials) */
export function dayProgress(habit: Habit, logs: Logs, key: string): number {
  const v = dayValue(logs, habit.id, key)
  const g = goalValue(habit)
  return Math.max(0, Math.min(1, v / g))
}

export interface Streak {
  current: number
  best: number
  /** "gün" for daily/custom, "hafta" for weekly */
  unit: "gün" | "hafta"
}

/** consecutive completed scheduled days, ending today (today incomplete doesn't break) */
function dayStreak(habit: Habit, logs: Logs): Streak {
  const created = startOfDay(parseKey(habit.createdAt.slice(0, 10)))
  const today = startOfDay(new Date())

  // walk back to compute current streak
  let current = 0
  let cursor = new Date(today)
  // if today scheduled but not done, start from yesterday so streak isn't 0 mid-day
  if (isScheduled(habit, cursor) && !isDone(habit, logs, dateKey(cursor))) {
    cursor = addDays(cursor, -1)
  }
  while (cursor >= created) {
    if (isScheduled(habit, cursor)) {
      if (isDone(habit, logs, dateKey(cursor))) current++
      else break
    }
    cursor = addDays(cursor, -1)
  }

  // best streak across history
  let best = 0
  let run = 0
  let c = new Date(created)
  while (c <= today) {
    if (isScheduled(habit, c)) {
      if (isDone(habit, logs, dateKey(c))) {
        run++
        if (run > best) best = run
      } else if (c < today) {
        run = 0
      }
      // today incomplete: don't reset (still in progress)
    }
    c = addDays(c, 1)
  }
  best = Math.max(best, current)
  return { current, best, unit: "gün" }
}

/** consecutive weeks meeting the quota (current partial week doesn't break) */
function weekStreak(habit: Habit, logs: Logs): Streak {
  const ws = 1 // streaks computed on Monday-weeks for consistency
  const created = startOfWeek(parseKey(habit.createdAt.slice(0, 10)), ws)
  const thisWeek = startOfWeek(new Date(), ws)

  const weekDone = (weekStartDate: Date): number => {
    let count = 0
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStartDate, i)
      if (isDone(habit, logs, dateKey(d))) count++
    }
    return count
  }
  const quota = Math.max(1, habit.timesPerWeek)

  let current = 0
  let cursor = new Date(thisWeek)
  if (weekDone(cursor) < quota) cursor = addDays(cursor, -7) // current week not met yet
  while (cursor >= created) {
    if (weekDone(cursor) >= quota) current++
    else break
    cursor = addDays(cursor, -7)
  }

  let best = 0
  let run = 0
  let c = new Date(created)
  while (c <= thisWeek) {
    const met = weekDone(c) >= quota
    if (met) {
      run++
      if (run > best) best = run
    } else if (c < thisWeek) {
      run = 0
    }
    c = addDays(c, 7)
  }
  best = Math.max(best, current)
  return { current, best, unit: "hafta" }
}

export function computeStreak(habit: Habit, logs: Logs): Streak {
  return habit.frequency === "weekly"
    ? weekStreak(habit, logs)
    : dayStreak(habit, logs)
}

export interface HabitStats {
  totalDone: number
  totalScheduled: number
  completionRate: number // 0..1 over scheduled days so far
  last30Rate: number
  streak: Streak
  /** sum of measured values (lifetime) */
  totalValue: number
}

export function computeStats(habit: Habit, logs: Logs): HabitStats {
  const created = startOfDay(parseKey(habit.createdAt.slice(0, 10)))
  const today = startOfDay(new Date())
  let totalDone = 0
  let totalScheduled = 0
  let totalValue = 0
  let c = new Date(created)
  while (c <= today) {
    const key = dateKey(c)
    if (isScheduled(habit, c)) {
      totalScheduled++
      if (isDone(habit, logs, key)) totalDone++
    }
    totalValue += dayValue(logs, habit.id, key)
    c = addDays(c, 1)
  }

  // last 30 days rate
  let l30Done = 0
  let l30Sched = 0
  for (let i = 0; i < 30; i++) {
    const d = addDays(today, -i)
    if (d < created) break
    if (isScheduled(habit, d)) {
      l30Sched++
      if (isDone(habit, logs, dateKey(d))) l30Done++
    }
  }

  return {
    totalDone,
    totalScheduled,
    completionRate: totalScheduled ? totalDone / totalScheduled : 0,
    last30Rate: l30Sched ? l30Done / l30Sched : 0,
    streak: computeStreak(habit, logs),
    totalValue,
  }
}

export interface HeatCell {
  key: string
  date: Date
  scheduled: boolean
  progress: number // 0..1
  done: boolean
  value: number
  inRange: boolean // within habit life & not future
}

/** grid of cells for last `weeks` weeks, columns = weeks, rows = 7 days */
export function buildHeatmap(
  habit: Habit,
  logs: Logs,
  weeks: number,
  weekStart: 0 | 1
): { columns: HeatCell[][]; monthLabels: { col: number; label: string }[] } {
  const today = startOfDay(new Date())
  const created = startOfDay(parseKey(habit.createdAt.slice(0, 10)))
  const end = startOfWeek(today, weekStart)
  const start = addDays(end, -(weeks - 1) * 7)

  const columns: HeatCell[][] = []
  const monthLabels: { col: number; label: string }[] = []
  let lastMonth = -1

  for (let w = 0; w < weeks; w++) {
    const colStart = addDays(start, w * 7)
    const col: HeatCell[] = []
    for (let dRow = 0; dRow < 7; dRow++) {
      const date = addDays(colStart, dRow)
      const key = dateKey(date)
      const future = date > today
      const before = date < created
      const inRange = !future && !before
      col.push({
        key,
        date,
        scheduled: inRange && isScheduled(habit, date),
        progress: inRange ? dayProgress(habit, logs, key) : 0,
        done: inRange && isDone(habit, logs, key),
        value: dayValue(logs, habit.id, key),
        inRange,
      })
    }
    // month label when first day of column changes month
    const m = colStart.getMonth()
    if (m !== lastMonth) {
      monthLabels.push({ col: w, label: MONTHS_SHORT[m] })
      lastMonth = m
    }
    columns.push(col)
  }
  return { columns, monthLabels }
}

/** last N days as bars (value or 0/1) */
export function lastNDays(
  habit: Habit,
  logs: Logs,
  n: number
): { key: string; date: Date; value: number; goal: number; done: boolean; scheduled: boolean }[] {
  const today = startOfDay(new Date())
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(today, -i)
    const key = dateKey(d)
    out.push({
      key,
      date: d,
      value: dayValue(logs, habit.id, key),
      goal: goalValue(habit),
      done: isDone(habit, logs, key),
      scheduled: isScheduled(habit, d),
    })
  }
  return out
}

/** today's overall completion across scheduled habits */
export function todayCompletion(
  habits: Habit[],
  logs: Logs
): { done: number; total: number; rate: number } {
  const key = todayKey()
  const today = startOfDay(new Date())
  const scheduled = habits.filter((h) => !h.archived && isScheduled(h, today))
  const done = scheduled.filter((h) => isDone(h, logs, key)).length
  return {
    done,
    total: scheduled.length,
    rate: scheduled.length ? done / scheduled.length : 0,
  }
}

export function frequencyLabel(h: Habit): string {
  if (h.frequency === "daily") return "Her gün"
  if (h.frequency === "weekly") return `Haftada ${h.timesPerWeek}`
  if (h.frequency === "custom") {
    const names = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"]
    return h.weekdays
      .slice()
      .sort()
      .map((d) => names[d])
      .join(", ")
  }
  return ""
}

export { weekId }

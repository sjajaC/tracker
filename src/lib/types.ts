export type HabitType = "build" | "quit"
export type Frequency = "daily" | "weekly" | "custom"
export type ThemeMode = "light" | "dark" | "system"

export interface Habit {
  id: string
  name: string
  type: HabitType
  icon: string
  /** chart color key: "chart-1".."chart-5" */
  color: string
  category: string
  frequency: Frequency
  /** weekly quota when frequency === "weekly" */
  timesPerWeek: number
  /** selected weekdays (0=Paz .. 6=Cmt) when frequency === "custom" */
  weekdays: number[]
  measurable: boolean
  /** daily target when measurable */
  target: number
  unit: string
  /** quit habits: hedef temiz gün sayısı (challenge). 0 = hedef yok */
  goalStreak: number
  note: string
  createdAt: string
  archived: boolean
  order: number
}

export interface DayLog {
  /** completion amount. non-measurable: 0/1. measurable: numeric. quit: 1 = temiz gün */
  value: number
  note?: string
}

/** logs[habitId][YYYY-MM-DD] */
export type Logs = Record<string, Record<string, DayLog>>

export interface Settings {
  theme: ThemeMode
  weekStart: 0 | 1
}

export interface AppData {
  version: number
  habits: Habit[]
  logs: Logs
  todos: Todo[]
  routines: Routine[]
  /** routineLogs[routineId][YYYY-MM-DD] = tamamlanan adım id'leri */
  routineLogs: Record<string, Record<string, string[]>>
  settings: Settings
}

/* ----------------------------- Görevler (TODO) ---------------------------- */

export type Priority = "low" | "medium" | "high"

export interface SubTask {
  id: string
  title: string
  done: boolean
}

export interface Todo {
  id: string
  title: string
  notes: string
  priority: Priority
  category: string
  /** bitiş tarihi YYYY-MM-DD veya null */
  due: string | null
  subtasks: SubTask[]
  done: boolean
  completedAt: string | null
  createdAt: string
  order: number
}

/* ------------------------------- Rutinler -------------------------------- */

export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime"

export interface RoutineStep {
  id: string
  title: string
  /** süre (dk), 0 = belirtilmemiş */
  minutes: number
}

export interface Routine {
  id: string
  name: string
  icon: string
  color: string
  timeOfDay: TimeOfDay
  /** "07:30" gibi; boş olabilir */
  time: string
  /** uygulanacak günler (0=Paz..6=Cmt); boş = her gün */
  days: number[]
  steps: RoutineStep[]
  createdAt: string
  order: number
  archived: boolean
}

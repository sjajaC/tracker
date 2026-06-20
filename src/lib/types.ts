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
  settings: Settings
}

import { useCallback, useEffect, useMemo, useState } from "react"
import type { AppData, Habit, Settings } from "@/lib/types"
import { emptyData, loadData, saveData } from "@/lib/storage"
import { uid } from "@/lib/habits"
import { todayKey } from "@/lib/date"

export function useHabits() {
  const [data, setData] = useState<AppData>(() => loadData())

  // persist on every change
  useEffect(() => {
    saveData(data)
  }, [data])

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
  }, [])

  const addHabit = useCallback(
    (h: Omit<Habit, "id" | "createdAt" | "archived" | "order">) => {
      setData((d) => {
        const habit: Habit = {
          ...h,
          id: uid(),
          createdAt: new Date().toISOString(),
          archived: false,
          order: d.habits.length,
        }
        return { ...d, habits: [...d.habits, habit] }
      })
    },
    []
  )

  const updateHabit = useCallback((id: string, patch: Partial<Habit>) => {
    setData((d) => ({
      ...d,
      habits: d.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }))
  }, [])

  const deleteHabit = useCallback((id: string) => {
    setData((d) => {
      const logs = { ...d.logs }
      delete logs[id]
      return {
        ...d,
        habits: d.habits.filter((h) => h.id !== id),
        logs,
      }
    })
  }, [])

  /** set the raw value for a habit on a given day; 0 removes the entry */
  const setValue = useCallback(
    (habitId: string, key: string, value: number, note?: string) => {
      setData((d) => {
        const habitLogs = { ...(d.logs[habitId] ?? {}) }
        if (value <= 0 && !note) {
          delete habitLogs[key]
        } else {
          habitLogs[key] = { value: Math.max(0, value), note }
        }
        return { ...d, logs: { ...d.logs, [habitId]: habitLogs } }
      })
    },
    []
  )

  /** toggle a non-measurable day done/undone */
  const toggleDay = useCallback(
    (habitId: string, key: string, goal: number) => {
      setData((d) => {
        const habitLogs = { ...(d.logs[habitId] ?? {}) }
        const cur = habitLogs[key]?.value ?? 0
        if (cur >= goal) {
          delete habitLogs[key]
        } else {
          habitLogs[key] = { value: goal }
        }
        return { ...d, logs: { ...d.logs, [habitId]: habitLogs } }
      })
    },
    []
  )

  const importData = useCallback((incoming: AppData) => {
    setData({
      version: 1,
      habits: Array.isArray(incoming.habits) ? incoming.habits : [],
      logs: incoming.logs ?? {},
      settings: { ...emptyData().settings, ...(incoming.settings ?? {}) },
    })
  }, [])

  const resetAll = useCallback(() => setData(emptyData()), [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    data.habits.forEach((h) => h.category && set.add(h.category))
    return Array.from(set)
  }, [data.habits])

  return {
    data,
    today: todayKey(),
    addHabit,
    updateHabit,
    deleteHabit,
    setValue,
    toggleDay,
    setSettings,
    importData,
    resetAll,
    categories,
  }
}

export type HabitsApi = ReturnType<typeof useHabits>

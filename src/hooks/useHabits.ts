import { useCallback, useEffect, useMemo, useState } from "react"
import type {
  AppData,
  Habit,
  Routine,
  Settings,
  Todo,
} from "@/lib/types"
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

  /* ------------------------------- Görevler ------------------------------ */

  const addTodo = useCallback(
    (t: Omit<Todo, "id" | "createdAt" | "order" | "done" | "completedAt">) => {
      setData((d) => {
        const todo: Todo = {
          ...t,
          id: uid(),
          done: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          order: d.todos.length,
        }
        return { ...d, todos: [...d.todos, todo] }
      })
    },
    []
  )

  const updateTodo = useCallback((id: string, patch: Partial<Todo>) => {
    setData((d) => ({
      ...d,
      todos: d.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setData((d) => ({ ...d, todos: d.todos.filter((t) => t.id !== id) }))
  }, [])

  const toggleTodo = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      todos: d.todos.map((t) =>
        t.id === id
          ? {
              ...t,
              done: !t.done,
              completedAt: !t.done ? new Date().toISOString() : null,
            }
          : t
      ),
    }))
  }, [])

  const toggleSubtask = useCallback((todoId: string, subId: string) => {
    setData((d) => ({
      ...d,
      todos: d.todos.map((t) =>
        t.id === todoId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subId ? { ...s, done: !s.done } : s
              ),
            }
          : t
      ),
    }))
  }, [])

  const clearCompletedTodos = useCallback(() => {
    setData((d) => ({ ...d, todos: d.todos.filter((t) => !t.done) }))
  }, [])

  /* ------------------------------- Rutinler ------------------------------ */

  const addRoutine = useCallback(
    (r: Omit<Routine, "id" | "createdAt" | "order" | "archived">) => {
      setData((d) => {
        const routine: Routine = {
          ...r,
          id: uid(),
          createdAt: new Date().toISOString(),
          order: d.routines.length,
          archived: false,
        }
        return { ...d, routines: [...d.routines, routine] }
      })
    },
    []
  )

  const updateRoutine = useCallback((id: string, patch: Partial<Routine>) => {
    setData((d) => ({
      ...d,
      routines: d.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }, [])

  const deleteRoutine = useCallback((id: string) => {
    setData((d) => {
      const routineLogs = { ...d.routineLogs }
      delete routineLogs[id]
      return {
        ...d,
        routines: d.routines.filter((r) => r.id !== id),
        routineLogs,
      }
    })
  }, [])

  /** bir rutin adımını belirli gün için işaretle/kaldır */
  const toggleRoutineStep = useCallback(
    (routineId: string, key: string, stepId: string) => {
      setData((d) => {
        const byDate = { ...(d.routineLogs[routineId] ?? {}) }
        const done = new Set(byDate[key] ?? [])
        if (done.has(stepId)) done.delete(stepId)
        else done.add(stepId)
        byDate[key] = Array.from(done)
        if (byDate[key].length === 0) delete byDate[key]
        return {
          ...d,
          routineLogs: { ...d.routineLogs, [routineId]: byDate },
        }
      })
    },
    []
  )

  /** rutindeki tüm adımları belirli gün için tamamla/temizle */
  const setRoutineAllSteps = useCallback(
    (routineId: string, key: string, stepIds: string[], complete: boolean) => {
      setData((d) => {
        const byDate = { ...(d.routineLogs[routineId] ?? {}) }
        if (complete) byDate[key] = [...stepIds]
        else delete byDate[key]
        return {
          ...d,
          routineLogs: { ...d.routineLogs, [routineId]: byDate },
        }
      })
    },
    []
  )

  const importData = useCallback((incoming: AppData) => {
    const base = emptyData()
    setData({
      version: 1,
      habits: Array.isArray(incoming.habits) ? incoming.habits : [],
      logs: incoming.logs ?? {},
      todos: Array.isArray(incoming.todos) ? incoming.todos : [],
      routines: Array.isArray(incoming.routines) ? incoming.routines : [],
      routineLogs: incoming.routineLogs ?? {},
      settings: { ...base.settings, ...(incoming.settings ?? {}) },
    })
  }, [])

  const resetAll = useCallback(() => setData(emptyData()), [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    data.habits.forEach((h) => h.category && set.add(h.category))
    data.todos.forEach((t) => t.category && set.add(t.category))
    return Array.from(set)
  }, [data.habits, data.todos])

  return {
    data,
    today: todayKey(),
    addHabit,
    updateHabit,
    deleteHabit,
    setValue,
    toggleDay,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    toggleSubtask,
    clearCompletedTodos,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    toggleRoutineStep,
    setRoutineAllSteps,
    setSettings,
    importData,
    resetAll,
    categories,
  }
}

export type HabitsApi = ReturnType<typeof useHabits>

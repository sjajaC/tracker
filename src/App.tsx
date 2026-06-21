import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import type { Habit, Routine, Todo } from "@/lib/types"
import { useHabits } from "@/hooks/useHabits"
import { todayCompletion } from "@/lib/habits"
import { formatLongDate } from "@/lib/date"
import { TodayView } from "@/views/TodayView"
import { HabitsView } from "@/views/HabitsView"
import { TodoView } from "@/views/TodoView"
import { RoutinesView } from "@/views/RoutinesView"
import { StatsView } from "@/views/StatsView"
import { SettingsView } from "@/views/SettingsView"
import { HabitFormDialog } from "@/components/HabitFormDialog"
import { HabitDetailDialog } from "@/components/HabitDetailDialog"
import { TodoFormDialog } from "@/components/TodoFormDialog"
import { RoutineFormDialog } from "@/components/RoutineFormDialog"
import { RoutineDetailDialog } from "@/components/RoutineDetailDialog"
import { FullScreenPage } from "@/components/FullScreenPage"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Repeat2,
  ListTodo,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  Flame,
} from "lucide-react"

type View = "today" | "habits" | "todos" | "routines" | "stats"

const NAV: { key: View; label: string; icon: ReactNode }[] = [
  { key: "today", label: "Bugün", icon: <CheckCircle2 className="size-5" /> },
  { key: "habits", label: "Alışkanlık", icon: <Flame className="size-5" /> },
  { key: "todos", label: "Görevler", icon: <ListTodo className="size-5" /> },
  { key: "routines", label: "Rutinler", icon: <Repeat2 className="size-5" /> },
  { key: "stats", label: "İstatistik", icon: <BarChart3 className="size-5" /> },
]

const TITLES: Record<View, string> = {
  today: "Bugün",
  habits: "Alışkanlıklar",
  todos: "Görevler",
  routines: "Rutinler",
  stats: "İstatistik",
}

export default function App() {
  const api = useHabits()
  const [view, setView] = useState<View>("today")

  // habit
  const [habitFormOpen, setHabitFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  // todo
  const [todoFormOpen, setTodoFormOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  // routine
  const [routineFormOpen, setRoutineFormOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [routineDetailId, setRoutineDetailId] = useState<string | null>(null)
  // settings
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { setTheme } = useTheme()
  useEffect(() => {
    setTheme(api.data.settings.theme)
  }, [api.data.settings.theme, setTheme])

  const detailHabit = detailId
    ? (api.data.habits.find((h) => h.id === detailId) ?? null)
    : null
  const detailRoutine = routineDetailId
    ? (api.data.routines.find((r) => r.id === routineDetailId) ?? null)
    : null

  // habit handlers
  const openNewHabit = () => {
    setEditingHabit(null)
    setHabitFormOpen(true)
  }
  const openEditHabit = (h: Habit) => {
    setDetailId(null)
    setEditingHabit(h)
    setHabitFormOpen(true)
  }
  // todo handlers
  const openNewTodo = () => {
    setEditingTodo(null)
    setTodoFormOpen(true)
  }
  const openEditTodo = (t: Todo) => {
    setEditingTodo(t)
    setTodoFormOpen(true)
  }
  // routine handlers
  const openNewRoutine = () => {
    setEditingRoutine(null)
    setRoutineFormOpen(true)
  }
  const openEditRoutine = (r: Routine) => {
    setRoutineDetailId(null)
    setEditingRoutine(r)
    setRoutineFormOpen(true)
  }

  const fab: Record<View, (() => void) | null> = {
    today: openNewHabit,
    habits: openNewHabit,
    todos: openNewTodo,
    routines: openNewRoutine,
    stats: null,
  }
  const onFab = fab[view]

  const summary = todayCompletion(api.data.habits, api.data.logs)
  const subtitle =
    view === "today"
      ? formatLongDate(new Date())
      : `${summary.done}/${summary.total} alışkanlık bugün`

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b bg-background/80 px-4 py-3 backdrop-blur"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold leading-tight">
            {TITLES[view]}
          </h1>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xl font-bold tabular-nums text-primary">
              %{Math.round(summary.rate * 100)}
            </div>
            <div className="text-[10px] text-muted-foreground">bugün</div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSettingsOpen(true)}
            aria-label="Ayarlar"
          >
            <SettingsIcon className="size-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-4">
        {view === "today" && (
          <TodayView
            api={api}
            onOpenDetail={(h) => setDetailId(h.id)}
            onOpenRoutine={(r) => setRoutineDetailId(r.id)}
            onEditTodo={openEditTodo}
          />
        )}
        {view === "habits" && (
          <HabitsView api={api} onOpenDetail={(h) => setDetailId(h.id)} />
        )}
        {view === "todos" && <TodoView api={api} onEdit={openEditTodo} />}
        {view === "routines" && (
          <RoutinesView api={api} onOpen={(r) => setRoutineDetailId(r.id)} />
        )}
        {view === "stats" && <StatsView api={api} />}
      </main>

      {/* FAB */}
      {onFab && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-end">
          <Button
            onClick={onFab}
            size="icon"
            className="pointer-events-auto mr-4 mb-24 size-14 rounded-full shadow-lg shadow-primary/30"
            aria-label="Yeni ekle"
          >
            <Plus className="size-6" />
          </Button>
        </div>
      )}

      {/* Bottom nav */}
      <nav
        className="sticky bottom-0 z-30 grid grid-cols-5 border-t bg-background/90 backdrop-blur"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => setView(n.key)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
              view === n.key ? "text-primary" : "text-muted-foreground"
            )}
          >
            {n.icon}
            <span className="max-w-full truncate">{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Dialogs / full-screen pages */}
      <HabitFormDialog
        open={habitFormOpen}
        onOpenChange={setHabitFormOpen}
        editing={editingHabit}
        api={api}
      />
      <HabitDetailDialog
        habit={detailHabit}
        api={api}
        onEdit={openEditHabit}
        onClose={() => setDetailId(null)}
      />
      <TodoFormDialog
        open={todoFormOpen}
        onOpenChange={setTodoFormOpen}
        editing={editingTodo}
        api={api}
      />
      <RoutineFormDialog
        open={routineFormOpen}
        onOpenChange={setRoutineFormOpen}
        editing={editingRoutine}
        api={api}
      />
      <RoutineDetailDialog
        routine={detailRoutine}
        api={api}
        onEdit={openEditRoutine}
        onClose={() => setRoutineDetailId(null)}
      />

      <FullScreenPage
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title="Ayarlar"
      >
        <div className="px-4 py-5">
          <SettingsView api={api} />
        </div>
      </FullScreenPage>

      <Toaster />
    </div>
  )
}

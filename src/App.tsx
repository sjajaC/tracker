import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import type { Habit } from "@/lib/types"
import { useHabits } from "@/hooks/useHabits"
import { todayCompletion } from "@/lib/habits"
import { formatLongDate } from "@/lib/date"
import { TodayView } from "@/views/TodayView"
import { HabitsView } from "@/views/HabitsView"
import { StatsView } from "@/views/StatsView"
import { SettingsView } from "@/views/SettingsView"
import { HabitFormDialog } from "@/components/HabitFormDialog"
import { HabitDetailDialog } from "@/components/HabitDetailDialog"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  ListChecks,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
} from "lucide-react"

type View = "today" | "habits" | "stats" | "settings"

const NAV: { key: View; label: string; icon: ReactNode }[] = [
  { key: "today", label: "Bugün", icon: <CheckCircle2 className="size-5" /> },
  { key: "habits", label: "Liste", icon: <ListChecks className="size-5" /> },
  { key: "stats", label: "İstatistik", icon: <BarChart3 className="size-5" /> },
  { key: "settings", label: "Ayarlar", icon: <SettingsIcon className="size-5" /> },
]

const TITLES: Record<View, string> = {
  today: "Bugün",
  habits: "Alışkanlıklar",
  stats: "İstatistik",
  settings: "Ayarlar",
}

export default function App() {
  const api = useHabits()
  const [view, setView] = useState<View>("today")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { setTheme } = useTheme()
  // keep next-themes (the .dark class) in sync with the stored setting
  useEffect(() => {
    setTheme(api.data.settings.theme)
  }, [api.data.settings.theme, setTheme])

  const detailHabit = detailId
    ? (api.data.habits.find((h) => h.id === detailId) ?? null)
    : null

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (h: Habit) => {
    setDetailId(null)
    setEditing(h)
    setFormOpen(true)
  }

  const summary = todayCompletion(api.data.habits, api.data.logs)
  const subtitle =
    view === "today"
      ? formatLongDate(new Date())
      : `${summary.done}/${summary.total} bugün tamamlandı`

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div>
          <h1 className="text-xl font-bold leading-tight">{TITLES[view]}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums text-primary">
            %{Math.round(summary.rate * 100)}
          </div>
          <div className="text-[10px] text-muted-foreground">bugün</div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-4">
        {view === "today" && (
          <TodayView api={api} onOpenDetail={(h) => setDetailId(h.id)} />
        )}
        {view === "habits" && (
          <HabitsView api={api} onOpenDetail={(h) => setDetailId(h.id)} />
        )}
        {view === "stats" && <StatsView api={api} />}
        {view === "settings" && <SettingsView api={api} />}
      </main>

      {/* FAB — aligned to the centered app column */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-end">
        <Button
          onClick={openNew}
          size="icon"
          className="pointer-events-auto mr-4 mb-24 size-14 rounded-full shadow-lg shadow-primary/30"
          aria-label="Yeni alışkanlık"
        >
          <Plus className="size-6" />
        </Button>
      </div>

      {/* Bottom nav */}
      <nav
        className="sticky bottom-0 z-30 grid grid-cols-4 border-t bg-background/90 backdrop-blur"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => setView(n.key)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
              view === n.key ? "text-primary" : "text-muted-foreground"
            )}
          >
            {n.icon}
            {n.label}
          </button>
        ))}
      </nav>

      <HabitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        api={api}
      />
      <HabitDetailDialog
        habit={detailHabit}
        api={api}
        onEdit={openEdit}
        onClose={() => setDetailId(null)}
      />
      <Toaster />
    </div>
  )
}

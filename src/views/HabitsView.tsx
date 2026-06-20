import { useMemo, useState } from "react"
import type { Habit } from "@/lib/types"
import type { HabitsApi } from "@/hooks/useHabits"
import { computeStats, frequencyLabel } from "@/lib/habits"
import { colorVar } from "@/lib/constants"
import { Heatmap } from "@/components/Heatmap"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

export function HabitsView({
  api,
  onOpenDetail,
}: {
  api: HabitsApi
  onOpenDetail: (h: Habit) => void
}) {
  const [filter, setFilter] = useState<string>("all")

  const active = api.data.habits.filter((h) => !h.archived)
  const filters = useMemo(() => {
    const cats = Array.from(new Set(active.map((h) => h.category).filter(Boolean)))
    return [
      { key: "all", label: "Tümü" },
      { key: "build", label: "✅ Kazanılacak" },
      { key: "quit", label: "🚫 Bırakılacak" },
      ...cats.map((c) => ({ key: "cat:" + c, label: c })),
    ]
  }, [active])

  const list = active
    .filter((h) => {
      if (filter === "all") return true
      if (filter === "build" || filter === "quit") return h.type === filter
      if (filter.startsWith("cat:")) return h.category === filter.slice(4)
      return true
    })
    .sort((a, b) => a.order - b.order)

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <div className="text-5xl">📋</div>
        <h3 className="text-lg font-semibold">Liste boş</h3>
        <p className="text-sm text-muted-foreground">
          Yeni bir alışkanlık ekleyerek başla.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-28">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {list.map((h) => (
          <HabitCard key={h.id} habit={h} api={api} onOpen={() => onOpenDetail(h)} />
        ))}
      </div>
    </div>
  )
}

function HabitCard({
  habit,
  api,
  onOpen,
}: {
  habit: Habit
  api: HabitsApi
  onOpen: () => void
}) {
  const color = colorVar(habit.color)
  const stats = computeStats(habit, api.data.logs)

  return (
    <button
      onClick={onOpen}
      className="flex flex-col gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:border-primary/40"
    >
      <div className="flex items-center gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl text-lg"
          style={{ background: color, opacity: 0.95 }}
        >
          {habit.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{habit.name}</p>
          <p className="text-xs text-muted-foreground">{frequencyLabel(habit)}</p>
        </div>
        {stats.streak.current > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Flame className="size-3" />
            {stats.streak.current} {stats.streak.unit}
          </Badge>
        )}
      </div>

      <div className="overflow-hidden">
        <Heatmap
          habit={habit}
          logs={api.data.logs}
          weeks={18}
          weekStart={api.data.settings.weekStart}
          cellSize={11}
          showLabels={false}
        />
      </div>

      <div className="flex items-center gap-3">
        <Progress value={stats.completionRate * 100} className="flex-1" />
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          %{Math.round(stats.completionRate * 100)}
        </span>
      </div>
    </button>
  )
}

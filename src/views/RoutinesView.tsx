import { useMemo } from "react"
import type { Routine, TimeOfDay } from "@/lib/types"
import type { HabitsApi } from "@/hooks/useHabits"
import {
  TIME_OF_DAY,
  routineDaysLabel,
  routineProgress,
  routineScheduled,
  totalMinutes,
} from "@/lib/tasks"
import { colorVar } from "@/lib/constants"
import { dateKey } from "@/lib/date"
import { Ring } from "@/components/Charts"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"

export function RoutinesView({
  api,
  onOpen,
}: {
  api: HabitsApi
  onOpen: (r: Routine) => void
}) {
  const routines = api.data.routines.filter((r) => !r.archived)
  const todayKey = dateKey(new Date())
  const today = new Date()

  const groups = useMemo(() => {
    const order: TimeOfDay[] = ["morning", "afternoon", "evening", "anytime"]
    return order
      .map((t) => ({
        time: t,
        items: routines
          .filter((r) => r.timeOfDay === t)
          .sort((a, b) => a.order - b.order),
      }))
      .filter((g) => g.items.length > 0)
  }, [routines])

  if (routines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <div className="text-5xl">🔁</div>
        <h3 className="text-lg font-semibold">Rutin yok</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Sağ alttaki + ile günlük bir rutin oluştur (ör. sabah rutini). Adımlar
          ekleyip her gün tek tek işaretleyebilirsin.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-28">
      {groups.map((g) => (
        <div key={g.time} className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>{TIME_OF_DAY[g.time].icon}</span>
            {TIME_OF_DAY[g.time].label}
          </h3>
          <div className="flex flex-col gap-2">
            {g.items.map((r) => {
              const prog = routineProgress(r, api.data.routineLogs, todayKey)
              const scheduledToday = routineScheduled(r, today)
              const mins = totalMinutes(r)
              return (
                <button
                  key={r.id}
                  onClick={() => onOpen(r)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-colors hover:border-primary/40",
                    !scheduledToday && "opacity-60"
                  )}
                >
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-xl"
                    style={{ background: colorVar(r.color), opacity: 0.95 }}
                  >
                    {r.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{r.steps.length} adım</span>
                      {mins > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <Clock className="size-3" /> ~{mins} dk
                        </span>
                      )}
                      {!scheduledToday && (
                        <Badge variant="outline" className="px-1.5 py-0">
                          {routineDaysLabel(r)}
                        </Badge>
                      )}
                    </p>
                  </div>
                  <Ring value={prog.rate} size={42} stroke={4} color={colorVar(r.color)}>
                    <span className="text-[10px] font-semibold">
                      {prog.done}/{prog.total}
                    </span>
                  </Ring>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

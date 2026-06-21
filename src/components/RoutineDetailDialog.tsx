import { useMemo } from "react"
import type { Routine } from "@/lib/types"
import type { HabitsApi } from "@/hooks/useHabits"
import {
  TIME_OF_DAY,
  routineDaysLabel,
  routineProgress,
  totalMinutes,
} from "@/lib/tasks"
import { colorVar } from "@/lib/constants"
import { addDays, dateKey } from "@/lib/date"
import { FullScreenPage } from "@/components/FullScreenPage"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ring } from "@/components/Charts"
import { Pencil, Clock } from "lucide-react"

interface Props {
  routine: Routine | null
  api: HabitsApi
  onEdit: (r: Routine) => void
  onClose: () => void
}

export function RoutineDetailDialog({ routine, api, onEdit, onClose }: Props) {
  const open = !!routine
  const todayKey = dateKey(new Date())

  const last14 = useMemo(() => {
    if (!routine) return []
    const out: { key: string; rate: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = addDays(new Date(), -i)
      const k = dateKey(d)
      const done = new Set(api.data.routineLogs[routine.id]?.[k] ?? [])
      const total = routine.steps.length
      const c = routine.steps.filter((s) => done.has(s.id)).length
      out.push({ key: k, rate: total ? c / total : 0 })
    }
    return out
  }, [routine, api.data.routineLogs])

  if (!routine) return null

  const color = colorVar(routine.color)
  const prog = routineProgress(routine, api.data.routineLogs, todayKey)
  const allDone = prog.total > 0 && prog.done === prog.total
  const mins = totalMinutes(routine)

  return (
    <FullScreenPage
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={routine.name}
      right={
        <Button
          size="icon"
          variant="ghost"
          className="mr-1"
          onClick={() => onEdit(routine)}
          aria-label="Düzenle"
        >
          <Pencil className="size-5" />
        </Button>
      }
    >
      <div className="flex flex-col gap-5 p-4 pb-12">
        {/* Hero + bugünkü ilerleme */}
        <div className="flex items-center gap-4 rounded-2xl border p-4">
          <Ring value={prog.rate} size={64} stroke={7} color={color}>
            <span className="text-sm font-bold">
              {prog.done}/{prog.total}
            </span>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="grid size-9 place-items-center rounded-xl text-lg"
                style={{ background: color, opacity: 0.95 }}
              >
                {routine.icon}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">
                  {TIME_OF_DAY[routine.timeOfDay].icon}{" "}
                  {TIME_OF_DAY[routine.timeOfDay].label}
                </Badge>
                {routine.time && <Badge variant="outline">{routine.time}</Badge>}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {routineDaysLabel(routine)}
              {mins > 0 && (
                <>
                  {" · "}
                  <Clock className="inline size-3" /> ~{mins} dk
                </>
              )}
            </p>
          </div>
        </div>

        {/* Bugünün adımları */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Bugünün adımları</h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              api.setRoutineAllSteps(
                routine.id,
                todayKey,
                routine.steps.map((s) => s.id),
                !allDone
              )
            }
          >
            {allDone ? "Sıfırla" : "Tümünü tamamla"}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {routine.steps.map((s, i) => {
            const done = prog.doneIds.has(s.id)
            return (
              <button
                key={s.id}
                onClick={() => api.toggleRoutineStep(routine.id, todayKey, s.id)}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors active:scale-[0.99]"
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition-colors"
                  style={
                    done
                      ? { background: color, borderColor: color, color: "white" }
                      : undefined
                  }
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={
                    done
                      ? "flex-1 text-muted-foreground line-through"
                      : "flex-1 font-medium"
                  }
                >
                  {s.title}
                </span>
                {s.minutes > 0 && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {s.minutes} dk
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {allDone && (
          <div className="rounded-xl bg-muted/50 p-3 text-center text-sm">
            🎉 Bugünkü rutini tamamladın!
          </div>
        )}

        {/* Son 14 gün */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold">Son 14 gün</h4>
          <div className="flex items-end gap-[3px]" style={{ height: 56 }}>
            {last14.map((d) => (
              <div
                key={d.key}
                className="flex-1 rounded-[3px]"
                title={`${Math.round(d.rate * 100)}%`}
                style={{
                  height: `${Math.max(4, d.rate * 100)}%`,
                  background: d.rate > 0 ? color : "var(--muted)",
                  opacity: d.rate > 0 ? 0.4 + d.rate * 0.6 : 1,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </FullScreenPage>
  )
}

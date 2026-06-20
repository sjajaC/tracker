import { useMemo, type ReactNode } from "react"
import type { Habit } from "@/lib/types"
import type { HabitsApi } from "@/hooks/useHabits"
import {
  computeStats,
  frequencyLabel,
  goalValue,
  isScheduled,
  dayValue,
  isDone,
} from "@/lib/habits"
import { colorVar } from "@/lib/constants"
import { addDays, dateKey, parseKey, startOfDay } from "@/lib/date"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heatmap, HeatmapLegend } from "./Heatmap"
import { MiniBars, Ring, WeekdayPattern } from "./Charts"
import { Pencil, Flame, Trophy, Target, CheckCircle2 } from "lucide-react"

interface Props {
  habit: Habit | null
  api: HabitsApi
  onEdit: (h: Habit) => void
  onClose: () => void
}

export function HabitDetailDialog({ habit, api, onEdit, onClose }: Props) {
  const open = !!habit

  const stats = useMemo(
    () => (habit ? computeStats(habit, api.data.logs) : null),
    [habit, api.data.logs]
  )

  const weekdayPattern = useMemo(() => {
    if (!habit) return [0, 0, 0, 0, 0, 0, 0]
    const created = startOfDay(parseKey(habit.createdAt.slice(0, 10)))
    const today = startOfDay(new Date())
    const done = [0, 0, 0, 0, 0, 0, 0]
    const tot = [0, 0, 0, 0, 0, 0, 0]
    let c = new Date(created)
    while (c <= today) {
      if (isScheduled(habit, c)) {
        const wd = c.getDay()
        tot[wd]++
        if (isDone(habit, api.data.logs, dateKey(c))) done[wd]++
      }
      c = addDays(c, 1)
    }
    return done.map((d, i) => (tot[i] ? d / tot[i] : 0))
  }, [habit, api.data.logs])

  if (!habit || !stats) return null

  const color = colorVar(habit.color)
  const goal = goalValue(habit)
  const todayKey = dateKey(new Date())
  const todayVal = dayValue(api.data.logs, habit.id, todayKey)

  const adjust = (delta: number) => {
    api.setValue(habit.id, todayKey, Math.max(0, todayVal + delta))
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col sm:max-w-xl">
        <DialogHeader className="px-5 py-4 border-b text-left">
          <div className="flex items-center gap-3">
            <span
              className="grid size-11 place-items-center rounded-xl text-xl"
              style={{ background: color, opacity: 0.95 }}
            >
              {habit.icon}
            </span>
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">{habit.name}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-1.5 mt-1">
                <Badge variant={habit.type === "quit" ? "destructive" : "secondary"}>
                  {habit.type === "quit" ? "Bırakılacak" : "Kazanılacak"}
                </Badge>
                <Badge variant="outline">{frequencyLabel(habit)}</Badge>
                {habit.category && <Badge variant="outline">{habit.category}</Badge>}
              </DialogDescription>
            </div>
            <Button size="icon" variant="ghost" onClick={() => onEdit(habit)}>
              <Pencil className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 p-5">
            {/* Bugünün durumu */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bugün</p>
                  <p className="text-lg font-semibold">
                    {habit.measurable
                      ? `${todayVal} / ${goal} ${habit.unit}`
                      : isDone(habit, api.data.logs, todayKey)
                        ? "Tamamlandı ✅"
                        : habit.type === "quit"
                          ? "Henüz işaretlenmedi"
                          : "Henüz yapılmadı"}
                  </p>
                </div>
                {habit.measurable ? (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => adjust(-1)}>
                      −
                    </Button>
                    <Ring value={todayVal / goal} color={color} size={48}>
                      {Math.round((todayVal / goal) * 100)}%
                    </Ring>
                    <Button variant="outline" size="icon" onClick={() => adjust(1)}>
                      ＋
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => api.toggleDay(habit.id, todayKey, goal)}
                    variant={isDone(habit, api.data.logs, todayKey) ? "default" : "outline"}
                  >
                    {habit.type === "quit" ? "Temiz gün" : "Yaptım"}
                  </Button>
                )}
              </div>
            </div>

            {/* İstatistik kartları */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Flame className="size-4" />}
                label="Güncel seri"
                value={`${stats.streak.current} ${stats.streak.unit}`}
                accent={color}
              />
              <StatCard
                icon={<Trophy className="size-4" />}
                label="En iyi seri"
                value={`${stats.streak.best} ${stats.streak.unit}`}
              />
              <StatCard
                icon={<CheckCircle2 className="size-4" />}
                label="Tamamlama"
                value={`%${Math.round(stats.completionRate * 100)}`}
                sub={`${stats.totalDone}/${stats.totalScheduled} gün`}
              />
              <StatCard
                icon={<Target className="size-4" />}
                label={habit.measurable ? `Toplam ${habit.unit}` : "Toplam"}
                value={
                  habit.measurable
                    ? `${stats.totalValue}`
                    : `${stats.totalDone}`
                }
                sub="tüm zamanlar"
              />
            </div>

            {/* Heatmap */}
            <Section title="Aktivite haritası" right={<HeatmapLegend color={habit.color} />}>
              <ScrollArea className="w-full">
                <div className="pb-3">
                  <Heatmap
                    habit={habit}
                    logs={api.data.logs}
                    weeks={30}
                    weekStart={api.data.settings.weekStart}
                    onCellClick={(cell) => {
                      if (habit.measurable) {
                        api.setValue(
                          habit.id,
                          cell.key,
                          cell.value >= goal ? 0 : goal
                        )
                      } else {
                        api.toggleDay(habit.id, cell.key, goal)
                      }
                    }}
                  />
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                Bir kareye dokunarak o günü işaretleyebilirsin.
              </p>
            </Section>

            {/* Son 14 gün */}
            <Section title="Son 14 gün">
              <MiniBars habit={habit} logs={api.data.logs} days={14} height={60} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>14 gün önce</span>
                <span>bugün</span>
              </div>
            </Section>

            {/* Haftanın günleri deseni */}
            <Section title="Hangi günler daha başarılısın?">
              <WeekdayPattern
                perDay={weekdayPattern}
                color={habit.color}
                weekStart={api.data.settings.weekStart}
              />
            </Section>

            {habit.note && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                💬 {habit.note}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => onEdit(habit)}
            >
              <Pencil className="size-4" /> Düzenle
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function Section({
  title,
  right,
  children,
}: {
  title: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        {right}
      </div>
      {children}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: ReactNode
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border p-3">
      <div
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
        style={accent ? { color: accent } : undefined}
      >
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold mt-1 tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

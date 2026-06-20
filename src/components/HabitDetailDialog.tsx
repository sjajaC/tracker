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
import { FullScreenPage } from "@/components/FullScreenPage"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  const isQuit = habit.type === "quit"
  const challenge = habit.goalStreak ?? 0

  const adjust = (delta: number) => {
    api.setValue(habit.id, todayKey, Math.max(0, todayVal + delta))
  }

  return (
    <FullScreenPage
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={habit.name}
      right={
        <Button
          size="icon"
          variant="ghost"
          className="mr-1"
          onClick={() => onEdit(habit)}
          aria-label="Düzenle"
        >
          <Pencil className="size-5" />
        </Button>
      }
    >
      <div className="flex flex-col gap-5 p-4 pb-12">
        {/* Hero */}
        <div className="flex items-center gap-3">
          <span
            className="grid size-14 place-items-center rounded-2xl text-2xl"
            style={{ background: color, opacity: 0.95 }}
          >
            {habit.icon}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={isQuit ? "destructive" : "secondary"}>
              {isQuit ? "Bırakılacak" : "Kazanılacak"}
            </Badge>
            <Badge variant="outline">{frequencyLabel(habit)}</Badge>
            {habit.category && <Badge variant="outline">{habit.category}</Badge>}
          </div>
        </div>

        {/* Bırakma challenge ilerlemesi */}
        {isQuit && challenge > 0 && (
          <div className="rounded-2xl border p-4" style={{ background: `color-mix(in oklch, ${color} 8%, transparent)` }}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-medium">🎯 {challenge} günlük hedef</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {Math.min(stats.streak.current, challenge)} / {challenge} gün
              </span>
            </div>
            <Progress value={Math.min(100, (stats.streak.current / challenge) * 100)} />
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.streak.current >= challenge
                ? "Hedefe ulaştın, tebrikler! 🎉 Yeni bir hedef koyabilirsin."
                : `Hedefe ${challenge - stats.streak.current} gün kaldı. Devam et!`}
            </p>
          </div>
        )}

        {/* Bugün */}
        <div className="rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Bugün</p>
              <p className="text-lg font-semibold">
                {habit.measurable
                  ? `${todayVal} / ${goal} ${habit.unit}`
                  : isDone(habit, api.data.logs, todayKey)
                    ? isQuit
                      ? "Temiz gün ✅"
                      : "Tamamlandı ✅"
                    : isQuit
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
                variant={
                  isDone(habit, api.data.logs, todayKey) ? "default" : "outline"
                }
              >
                {isQuit ? "Temiz gün" : "Yaptım"}
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
            label={isQuit ? "Temiz gün oranı" : "Tamamlama"}
            value={`%${Math.round(stats.completionRate * 100)}`}
            sub={`${stats.totalDone}/${stats.totalScheduled} gün`}
          />
          <StatCard
            icon={<Target className="size-4" />}
            label={habit.measurable ? `Toplam ${habit.unit}` : isQuit ? "Temiz gün" : "Toplam"}
            value={habit.measurable ? `${stats.totalValue}` : `${stats.totalDone}`}
            sub="tüm zamanlar"
          />
        </div>

        {/* Heatmap */}
        <Section
          title="Aktivite haritası"
          right={<HeatmapLegend color={habit.color} />}
        >
          <div className="-mx-1 overflow-x-auto px-1 pb-2">
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
          <p className="text-xs text-muted-foreground">
            Bir kareye dokunarak o günü işaretleyebilirsin.
          </p>
        </Section>

        {/* Son 14 gün */}
        <Section title="Son 14 gün">
          <MiniBars habit={habit} logs={api.data.logs} days={14} height={60} />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>14 gün önce</span>
            <span>bugün</span>
          </div>
        </Section>

        {/* Haftanın günleri */}
        <Section title="Hangi günler daha başarılısın?">
          <WeekdayPattern
            perDay={weekdayPattern}
            color={habit.color}
            weekStart={api.data.settings.weekStart}
          />
        </Section>

        {habit.note && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">💬 {habit.note}</div>
        )}
      </div>
    </FullScreenPage>
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

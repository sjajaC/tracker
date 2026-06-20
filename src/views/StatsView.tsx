import type { ReactNode } from "react"
import { useMemo } from "react"
import type { HabitsApi } from "@/hooks/useHabits"
import {
  computeStats,
  isDone,
  isScheduled,
} from "@/lib/habits"
import { colorVar } from "@/lib/constants"
import { addDays, dateKey, startOfDay, MONTHS_SHORT } from "@/lib/date"
import { Ring } from "@/components/Charts"
import { Flame, Trophy, CalendarCheck, TrendingUp } from "lucide-react"

export function StatsView({ api }: { api: HabitsApi }) {
  const active = api.data.habits.filter((h) => !h.archived)

  const overall = useMemo(() => {
    const today = startOfDay(new Date())
    // last 30 days overall completion rate per day
    const days: { date: Date; rate: number; done: number; total: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = addDays(today, -i)
      const sched = active.filter((h) => isScheduled(h, d))
      const done = sched.filter((h) => isDone(h, api.data.logs, dateKey(d))).length
      days.push({
        date: d,
        rate: sched.length ? done / sched.length : 0,
        done,
        total: sched.length,
      })
    }
    const avg30 =
      days.filter((d) => d.total > 0).reduce((s, d) => s + d.rate, 0) /
      (days.filter((d) => d.total > 0).length || 1)

    // perfect days (all scheduled done, total>0)
    const perfect = days.filter((d) => d.total > 0 && d.done === d.total).length
    return { days, avg30, perfect }
  }, [active, api.data.logs])

  const ranked = useMemo(
    () =>
      active
        .map((h) => ({ h, stats: computeStats(h, api.data.logs) }))
        .sort((a, b) => b.stats.streak.current - a.stats.streak.current),
    [active, api.data.logs]
  )

  const bestStreak = ranked.reduce(
    (m, r) => Math.max(m, r.stats.streak.best),
    0
  )
  const totalDone = ranked.reduce((s, r) => s + r.stats.totalDone, 0)

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <div className="text-5xl">📊</div>
        <h3 className="text-lg font-semibold">Henüz veri yok</h3>
        <p className="text-sm text-muted-foreground">
          Alışkanlık ekleyip işaretledikçe istatistiklerin burada belirir.
        </p>
      </div>
    )
  }

  const maxRate = 1

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi
          icon={<CalendarCheck className="size-4" />}
          label="Aktif alışkanlık"
          value={String(active.length)}
        />
        <Kpi
          icon={<TrendingUp className="size-4" />}
          label="30 gün ortalama"
          value={`%${Math.round(overall.avg30 * 100)}`}
        />
        <Kpi
          icon={<Trophy className="size-4" />}
          label="En iyi seri"
          value={`${bestStreak}`}
          sub="gün"
        />
        <Kpi
          icon={<Flame className="size-4" />}
          label="Mükemmel gün"
          value={`${overall.perfect}`}
          sub="son 30 günde"
        />
      </div>

      {/* 30 günlük trend */}
      <div className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Son 30 gün tamamlama</h3>
          <span className="text-xs text-muted-foreground">
            {totalDone} toplam işaret
          </span>
        </div>
        <div className="flex items-end gap-[3px]" style={{ height: 100 }}>
          {overall.days.map((d) => (
            <div
              key={dateKey(d.date)}
              className="group relative flex-1"
              title={`${d.date.getDate()} ${MONTHS_SHORT[d.date.getMonth()]}: ${
                d.total ? Math.round(d.rate * 100) + "%" : "—"
              }`}
            >
              <div
                className="w-full rounded-[3px] bg-primary transition-all"
                style={{
                  height: `${Math.max(d.total ? 6 : 2, (d.rate / maxRate) * 100)}%`,
                  opacity: d.total ? 0.3 + d.rate * 0.7 : 0.15,
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>30 gün önce</span>
          <span>bugün</span>
        </div>
      </div>

      {/* Seri sıralaması */}
      <div className="flex flex-col gap-2">
        <h3 className="px-1 text-sm font-semibold">Seri sıralaması 🔥</h3>
        <div className="flex flex-col gap-2">
          {ranked.map(({ h, stats }, i) => (
            <div
              key={h.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <span className="w-5 text-center text-sm font-bold text-muted-foreground">
                {i + 1}
              </span>
              <span
                className="grid size-9 place-items-center rounded-lg text-base"
                style={{ background: colorVar(h.color), opacity: 0.95 }}
              >
                {h.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{h.name}</p>
                <p className="text-xs text-muted-foreground">
                  %{Math.round(stats.completionRate * 100)} tamamlama
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold tabular-nums">{stats.streak.current}</p>
                <p className="text-[10px] text-muted-foreground">
                  {stats.streak.unit} · en iyi {stats.streak.best}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bugünün halkaları */}
      <div className="flex flex-col gap-2">
        <h3 className="px-1 text-sm font-semibold">Bugünün ilerlemesi</h3>
        <div className="grid grid-cols-4 gap-3 rounded-2xl border bg-card p-4">
          {active.slice(0, 12).map((h) => {
            const key = dateKey(new Date())
            const val = api.data.logs[h.id]?.[key]?.value ?? 0
            const goal = h.measurable ? Math.max(1, h.target) : 1
            return (
              <div key={h.id} className="flex flex-col items-center gap-1">
                <Ring value={val / goal} size={46} stroke={5} color={colorVar(h.color)}>
                  <span className="text-sm">{h.icon}</span>
                </Ring>
                <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                  {h.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Kpi({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  )
}

import type { ReactNode } from "react"
import { useMemo } from "react"
import type { Habit, Routine, Todo } from "@/lib/types"
import type { HabitsApi } from "@/hooks/useHabits"
import {
  computeStreak,
  dayValue,
  goalValue,
  isDone,
  isScheduled,
  todayCompletion,
} from "@/lib/habits"
import {
  dueInfo,
  routineProgress,
  routineScheduled,
  subtaskProgress,
} from "@/lib/tasks"
import { colorVar } from "@/lib/constants"
import { addDays, dateKey, relativeDayLabel, startOfDay } from "@/lib/date"
import { Ring } from "@/components/Charts"
import { Button } from "@/components/ui/button"
import { Check, Flame, Plus, Minus, ChevronRight, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function TodayView({
  api,
  onOpenDetail,
  onOpenRoutine,
  onEditTodo,
}: {
  api: HabitsApi
  onOpenDetail: (h: Habit) => void
  onOpenRoutine: (r: Routine) => void
  onEditTodo: (t: Todo) => void
}) {
  const today = startOfDay(new Date())
  const todayKey = dateKey(today)

  const scheduled = useMemo(
    () =>
      api.data.habits
        .filter((h) => !h.archived && isScheduled(h, today))
        .sort((a, b) => a.order - b.order),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api.data.habits, todayKey]
  )

  const todayRoutines = useMemo(
    () =>
      api.data.routines
        .filter((r) => !r.archived && routineScheduled(r, today))
        .sort((a, b) => a.order - b.order),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api.data.routines, todayKey]
  )

  // bugüne ait / gecikmiş açık görevler
  const todayTodos = api.data.todos
    .filter((t) => !t.done && t.due && t.due <= todayKey)
    .sort((a, b) => (a.due! < b.due! ? -1 : 1))

  const summary = todayCompletion(api.data.habits, api.data.logs)
  const done = scheduled.filter((h) => isDone(h, api.data.logs, todayKey))
  const pending = scheduled.filter((h) => !isDone(h, api.data.logs, todayKey))

  const strip = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))

  const nothing =
    scheduled.length === 0 &&
    todayRoutines.length === 0 &&
    todayTodos.length === 0

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Tarih şeridi */}
      <div className="flex justify-between gap-1">
        {strip.map((d) => {
          const isToday = dateKey(d) === todayKey
          const dayHabits = api.data.habits.filter(
            (h) => !h.archived && isScheduled(h, d)
          )
          const dDone = dayHabits.filter((h) =>
            isDone(h, api.data.logs, dateKey(d))
          ).length
          const rate = dayHabits.length ? dDone / dayHabits.length : 0
          return (
            <div
              key={dateKey(d)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-2",
                isToday && "bg-accent"
              )}
            >
              <span className="text-[10px] text-muted-foreground">
                {["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"][d.getDay()]}
              </span>
              <Ring value={rate} size={30} stroke={3}>
                <span className="text-[10px] font-semibold">{d.getDate()}</span>
              </Ring>
            </div>
          )
        })}
      </div>

      {/* Özet kart */}
      {scheduled.length > 0 && (
        <div className="flex items-center gap-4 rounded-2xl border bg-card p-4">
          <Ring value={summary.rate} size={64} stroke={7}>
            <span className="text-sm font-bold">%{Math.round(summary.rate * 100)}</span>
          </Ring>
          <div className="flex-1">
            <p className="font-semibold">{relativeDayLabel(today)}</p>
            <p className="text-sm text-muted-foreground">
              {summary.done}/{summary.total} tamamlandı
              {summary.done === summary.total && summary.total > 0 && " — harika! 🎉"}
            </p>
          </div>
        </div>
      )}

      {/* Bugünün rutinleri */}
      {todayRoutines.length > 0 && (
        <Group title="Rutinler" count={todayRoutines.length}>
          {todayRoutines.map((r) => {
            const prog = routineProgress(r, api.data.routineLogs, todayKey)
            return (
              <button
                key={r.id}
                onClick={() => onOpenRoutine(r)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-colors",
                  prog.total > 0 && prog.done === prog.total && "opacity-70"
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
                  <p className="text-xs text-muted-foreground">
                    {prog.done}/{prog.total} adım
                  </p>
                </div>
                <Ring value={prog.rate} size={38} stroke={4} color={colorVar(r.color)}>
                  {prog.total > 0 && prog.done === prog.total ? (
                    <Check className="size-4" style={{ color: colorVar(r.color) }} />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                </Ring>
              </button>
            )
          })}
        </Group>
      )}

      {/* Bugünün görevleri */}
      {todayTodos.length > 0 && (
        <Group title="Görevler" count={todayTodos.length}>
          {todayTodos.map((t) => {
            const due = dueInfo(t.due)
            const sub = subtaskProgress(t)
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-2xl border bg-card p-3"
              >
                <button
                  onClick={() => api.toggleTodo(t.id)}
                  aria-label="Tamamla"
                  className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-muted-foreground/30 transition-all active:scale-90"
                />
                <button onClick={() => onEditTodo(t)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        due.tone === "overdue" ? "text-destructive" : "text-primary"
                      )}
                    >
                      <CalendarDays className="size-3" />
                      {due.label}
                    </span>
                    {sub.total > 0 && (
                      <span className="text-muted-foreground">
                        ✓ {sub.done}/{sub.total}
                      </span>
                    )}
                  </p>
                </button>
              </div>
            )
          })}
        </Group>
      )}

      {/* Alışkanlıklar */}
      {pending.length > 0 && (
        <Group title="Alışkanlıklar" count={pending.length}>
          {pending.map((h) => (
            <TodayCard
              key={h.id}
              habit={h}
              api={api}
              dateKey={todayKey}
              onOpen={() => onOpenDetail(h)}
            />
          ))}
        </Group>
      )}

      {done.length > 0 && (
        <Group title="Tamamlanan alışkanlıklar" count={done.length}>
          {done.map((h) => (
            <TodayCard
              key={h.id}
              habit={h}
              api={api}
              dateKey={todayKey}
              onOpen={() => onOpenDetail(h)}
            />
          ))}
        </Group>
      )}

      {nothing && <EmptyToday hasHabits={api.data.habits.length > 0} api={api} />}
    </div>
  )
}

const SAMPLE_HABITS: Omit<Habit, "id" | "createdAt" | "archived" | "order">[] = [
  {
    name: "Su iç",
    type: "build",
    icon: "💧",
    color: "chart-5",
    category: "Sağlık",
    frequency: "daily",
    timesPerWeek: 7,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    measurable: true,
    target: 8,
    unit: "bardak",
    goalStreak: 0,
    note: "",
  },
  {
    name: "Kitap oku",
    type: "build",
    icon: "📚",
    color: "chart-3",
    category: "Zihin",
    frequency: "daily",
    timesPerWeek: 7,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    measurable: true,
    target: 20,
    unit: "dk",
    goalStreak: 0,
    note: "",
  },
  {
    name: "Spor yap",
    type: "build",
    icon: "🏋️",
    color: "chart-2",
    category: "Spor",
    frequency: "custom",
    timesPerWeek: 3,
    weekdays: [1, 3, 5],
    measurable: false,
    target: 1,
    unit: "",
    goalStreak: 0,
    note: "",
  },
  {
    name: "Sigara içme",
    type: "quit",
    icon: "🚭",
    color: "chart-4",
    category: "Sağlık",
    frequency: "daily",
    timesPerWeek: 7,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    measurable: false,
    target: 1,
    unit: "",
    goalStreak: 90,
    note: "Her temiz gün bir kazanım.",
  },
]

function Group({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title} · {count}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export function TodayCard({
  habit,
  api,
  dateKey: key,
  onOpen,
}: {
  habit: Habit
  api: HabitsApi
  dateKey: string
  onOpen: () => void
}) {
  const color = colorVar(habit.color)
  const goal = goalValue(habit)
  const val = dayValue(api.data.logs, habit.id, key)
  const done = isDone(habit, api.data.logs, key)
  const streak = computeStreak(habit, api.data.logs)

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors",
        done && "opacity-70"
      )}
    >
      <button
        onClick={onOpen}
        className="grid size-11 shrink-0 place-items-center rounded-xl text-xl"
        style={{ background: color, opacity: 0.95 }}
      >
        {habit.icon}
      </button>
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <p className={cn("font-medium truncate", done && "line-through")}>
          {habit.name}
        </p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {habit.measurable && (
            <span className="tabular-nums">
              {val}/{goal} {habit.unit}
            </span>
          )}
          {streak.current > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Flame className="size-3" /> {streak.current} {streak.unit}
            </span>
          )}
          {habit.type === "quit" && <span>🚫 bırakılıyor</span>}
        </p>
      </button>

      {habit.measurable ? (
        <div className="flex items-center gap-1.5">
          {val > 0 && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() => api.setValue(habit.id, key, Math.max(0, val - 1))}
            >
              <Minus className="size-4" />
            </Button>
          )}
          <button
            onClick={() => api.setValue(habit.id, key, val + 1)}
            className="relative"
          >
            <Ring value={val / goal} size={40} stroke={4} color={color}>
              {done ? (
                <Check className="size-4" style={{ color }} />
              ) : (
                <Plus className="size-4 text-muted-foreground" />
              )}
            </Ring>
          </button>
        </div>
      ) : (
        <button
          onClick={() => api.toggleDay(habit.id, key, goal)}
          aria-label={done ? "Geri al" : "Tamamla"}
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full border-2 transition-all active:scale-90",
            done ? "border-transparent text-white" : "border-muted-foreground/30"
          )}
          style={done ? { background: color } : undefined}
        >
          <Check className={cn("size-5", !done && "opacity-30")} />
        </button>
      )}
    </div>
  )
}

function EmptyToday({
  hasHabits,
  api,
}: {
  hasHabits: boolean
  api: HabitsApi
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center">
      <div className="text-5xl">{hasHabits ? "🌤️" : "🌱"}</div>
      <h3 className="text-lg font-semibold">
        {hasHabits ? "Bugün planlı alışkanlık yok" : "Henüz alışkanlık yok"}
      </h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        {hasHabits
          ? "Bugün için planlanmış bir alışkanlığın yok. Keyfini çıkar veya yeni bir tane ekle."
          : "Sağ alttaki + butonuyla kendi alışkanlığını ekle ya da örneklerle hızlı başla."}
      </p>
      {!hasHabits && (
        <Button
          variant="outline"
          className="mt-1"
          onClick={() => {
            SAMPLE_HABITS.forEach((h) => api.addHabit(h))
            toast.success("Örnek alışkanlıklar eklendi 🎉")
          }}
        >
          ✨ Örneklerle başla
        </Button>
      )}
    </div>
  )
}

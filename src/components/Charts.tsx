import type { ReactNode } from "react"
import type { Habit, Logs } from "@/lib/types"
import { lastNDays } from "@/lib/habits"
import { colorVar } from "@/lib/constants"
import { WEEKDAYS_SHORT } from "@/lib/date"

export function Ring({
  value,
  size = 44,
  stroke = 5,
  color = "var(--primary)",
  track = "var(--muted)",
  children,
}: {
  value: number // 0..1
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(1, value)))
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .4s ease" }}
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 grid place-items-center text-[11px] font-semibold">
          {children}
        </div>
      )}
    </div>
  )
}

export function MiniBars({
  habit,
  logs,
  days = 14,
  height = 56,
}: {
  habit: Habit
  logs: Logs
  days?: number
  height?: number
}) {
  const data = lastNDays(habit, logs, days)
  const color = colorVar(habit.color)
  const max = Math.max(habit.measurable ? habit.target : 1, ...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d) => {
        const ratio = max ? d.value / max : 0
        const h = Math.max(d.value > 0 ? 4 : 2, ratio * height)
        return (
          <div
            key={d.key}
            className="flex-1 rounded-[3px]"
            title={`${d.date.getDate()}.${d.date.getMonth() + 1}: ${d.value}`}
            style={{
              height: h,
              minWidth: 4,
              background: d.value > 0 ? color : "var(--muted)",
              opacity: d.value > 0 ? (d.done ? 1 : 0.55) : 1,
            }}
          />
        )
      })}
    </div>
  )
}

/** weekly pattern: % completion per weekday over all history */
export function WeekdayPattern({
  perDay,
  color,
  weekStart,
}: {
  perDay: number[] // length 7, 0..1, index 0=Sunday
  color: string
  weekStart: 0 | 1
}) {
  const order = Array.from({ length: 7 }, (_, i) => (i + weekStart) % 7)
  const c = colorVar(color)
  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height: 70 }}>
      {order.map((d) => {
        const v = perDay[d] ?? 0
        return (
          <div key={d} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-[4px]"
                style={{ height: `${Math.max(4, v * 100)}%`, background: c, opacity: 0.3 + v * 0.7 }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {WEEKDAYS_SHORT[d][0]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

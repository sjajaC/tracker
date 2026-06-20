import { useMemo, type CSSProperties } from "react"
import type { Habit, Logs } from "@/lib/types"
import { buildHeatmap, type HeatCell } from "@/lib/habits"
import { colorVar } from "@/lib/constants"
import { WEEKDAYS_SHORT, formatLongDate } from "@/lib/date"
import { cn } from "@/lib/utils"

interface Props {
  habit: Habit
  logs: Logs
  weeks?: number
  weekStart: 0 | 1
  cellSize?: number
  showLabels?: boolean
  onCellClick?: (cell: HeatCell) => void
}

export function Heatmap({
  habit,
  logs,
  weeks = 26,
  weekStart,
  cellSize = 13,
  showLabels = true,
  onCellClick,
}: Props) {
  const { columns, monthLabels } = useMemo(
    () => buildHeatmap(habit, logs, weeks, weekStart),
    [habit, logs, weeks, weekStart]
  )

  const gap = 3
  const color = colorVar(habit.color)
  // reorder weekday labels by weekStart
  const dayOrder = Array.from({ length: 7 }, (_, i) => (i + weekStart) % 7)

  return (
    <div className="inline-flex flex-col gap-1 text-[10px] text-muted-foreground">
      {showLabels && (
        <div
          className="flex"
          style={{ marginLeft: 22, gap, height: 12 }}
        >
          {columns.map((_, i) => {
            const label = monthLabels.find((m) => m.col === i)
            return (
              <div
                key={i}
                style={{ width: cellSize }}
                className="relative"
              >
                {label && (
                  <span className="absolute left-0 top-0 whitespace-nowrap">
                    {label.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div className="flex" style={{ gap }}>
        {showLabels && (
          <div
            className="flex flex-col justify-between pr-1"
            style={{ gap, width: 22 }}
          >
            {dayOrder.map((d, i) => (
              <span
                key={d}
                style={{ height: cellSize, lineHeight: `${cellSize}px` }}
              >
                {i % 2 === 1 ? WEEKDAYS_SHORT[d][0] : ""}
              </span>
            ))}
          </div>
        )}
        <div className="flex" style={{ gap }}>
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col" style={{ gap }}>
              {col.map((cell) => (
                <Cell
                  key={cell.key}
                  cell={cell}
                  size={cellSize}
                  color={color}
                  habit={habit}
                  onClick={onCellClick}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Cell({
  cell,
  size,
  color,
  habit,
  onClick,
}: {
  cell: HeatCell
  size: number
  color: string
  habit: Habit
  onClick?: (c: HeatCell) => void
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.max(2, size * 0.25),
  }

  if (!cell.inRange) {
    style.background = "transparent"
  } else if (cell.progress <= 0) {
    style.background = "var(--muted)"
  } else {
    // opacity ramp by progress (min 0.35 so partial is visible)
    const op = 0.35 + cell.progress * 0.65
    style.background = color
    style.opacity = op
  }

  const title = cell.inRange
    ? `${formatLongDate(cell.date)} — ${
        cell.done
          ? "tamamlandı"
          : cell.value > 0
            ? `${cell.value}${habit.measurable ? " " + habit.unit : ""}`
            : "boş"
      }`
    : ""

  return (
    <button
      type="button"
      title={title}
      onClick={cell.inRange && onClick ? () => onClick(cell) : undefined}
      disabled={!cell.inRange}
      className={cn(
        "transition-transform",
        cell.inRange && onClick && "hover:scale-125 cursor-pointer",
        cell.done && "ring-1 ring-inset ring-black/10"
      )}
      style={style}
      aria-label={title}
    />
  )
}

export function HeatmapLegend({ color }: { color: string }) {
  const c = colorVar(color)
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span>az</span>
      <span
        className="rounded-[2px]"
        style={{ width: 11, height: 11, background: "var(--muted)" }}
      />
      {[0.45, 0.7, 1].map((op) => (
        <span
          key={op}
          className="rounded-[2px]"
          style={{ width: 11, height: 11, background: c, opacity: op }}
        />
      ))}
      <span>çok</span>
    </div>
  )
}

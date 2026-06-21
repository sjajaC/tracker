import { useMemo, useState } from "react"
import type { Todo } from "@/lib/types"
import type { HabitsApi } from "@/hooks/useHabits"
import {
  PRIORITY,
  dueInfo,
  filterTodos,
  sortTodos,
  subtaskProgress,
  type TodoFilter,
} from "@/lib/tasks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarDays, ChevronDown, Trash2 } from "lucide-react"

const FILTERS: { key: TodoFilter; label: string }[] = [
  { key: "active", label: "Aktif" },
  { key: "today", label: "Bugün & Geciken" },
  { key: "upcoming", label: "Yaklaşan" },
  { key: "done", label: "Tamamlanan" },
  { key: "all", label: "Tümü" },
]

export function TodoView({
  api,
  onEdit,
}: {
  api: HabitsApi
  onEdit: (t: Todo) => void
}) {
  const [filter, setFilter] = useState<TodoFilter>("active")

  const list = useMemo(
    () => sortTodos(filterTodos(api.data.todos, filter)),
    [api.data.todos, filter]
  )

  const counts = useMemo(() => {
    const active = api.data.todos.filter((t) => !t.done).length
    const done = api.data.todos.filter((t) => t.done).length
    return { active, done }
  }, [api.data.todos])

  if (api.data.todos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <div className="text-5xl">📝</div>
        <h3 className="text-lg font-semibold">Görev yok</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Sağ alttaki + ile ilk görevini ekle. Öncelik, tarih ve alt görevler
          ekleyebilirsin.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Özet */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl border bg-card p-3 text-center">
          <div className="text-2xl font-bold tabular-nums">{counts.active}</div>
          <div className="text-xs text-muted-foreground">aktif görev</div>
        </div>
        <div className="flex-1 rounded-2xl border bg-card p-3 text-center">
          <div className="text-2xl font-bold tabular-nums text-primary">
            {counts.done}
          </div>
          <div className="text-xs text-muted-foreground">tamamlanan</div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {FILTERS.map((fl) => (
          <button
            key={fl.key}
            onClick={() => setFilter(fl.key)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === fl.key
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {fl.label}
          </button>
        ))}
      </div>

      {filter === "done" && counts.done > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="self-end text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={api.clearCompletedTodos}
        >
          <Trash2 className="size-4" /> Tamamlananları temizle
        </Button>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          Bu filtrede görev yok.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((t) => (
            <TodoCard key={t.id} todo={t} api={api} onEdit={() => onEdit(t)} />
          ))}
        </div>
      )}
    </div>
  )
}

function TodoCard({
  todo,
  api,
  onEdit,
}: {
  todo: Todo
  api: HabitsApi
  onEdit: () => void
}) {
  const [open, setOpen] = useState(false)
  const due = dueInfo(todo.due)
  const sub = subtaskProgress(todo)
  const prio = PRIORITY[todo.priority]

  const dueToneClass =
    due.tone === "overdue"
      ? "text-destructive"
      : due.tone === "today"
        ? "text-primary"
        : "text-muted-foreground"

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-colors",
        todo.done && "opacity-60"
      )}
      style={{ borderLeft: `3px solid ${prio.color}` }}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => api.toggleTodo(todo.id)}
          aria-label={todo.done ? "Geri al" : "Tamamla"}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full border-2 transition-all active:scale-90",
            todo.done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30"
          )}
        >
          {todo.done && "✓"}
        </button>

        <button onClick={onEdit} className="min-w-0 flex-1 text-left">
          <p className={cn("font-medium leading-snug", todo.done && "line-through")}>
            {todo.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {due.label && (
              <span className={cn("inline-flex items-center gap-1", dueToneClass)}>
                <CalendarDays className="size-3" />
                {due.label}
              </span>
            )}
            {todo.category && (
              <Badge variant="outline" className="px-1.5 py-0">
                {todo.category}
              </Badge>
            )}
            {sub.total > 0 && (
              <span className="text-muted-foreground">
                ✓ {sub.done}/{sub.total}
              </span>
            )}
          </div>
        </button>

        {todo.subtasks.length > 0 && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent"
            aria-label="Alt görevler"
          >
            <ChevronDown
              className={cn("size-4 transition-transform", open && "rotate-180")}
            />
          </button>
        )}
      </div>

      {open && todo.subtasks.length > 0 && (
        <div className="flex flex-col gap-1 border-t px-3 py-2 pl-12">
          {todo.subtasks.map((s) => (
            <button
              key={s.id}
              onClick={() => api.toggleSubtask(todo.id, s.id)}
              className="flex items-center gap-2 py-1 text-left text-sm"
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded border-2 text-[10px] transition-colors",
                  s.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {s.done && "✓"}
              </span>
              <span className={cn(s.done && "line-through text-muted-foreground")}>
                {s.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

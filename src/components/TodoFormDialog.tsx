import type { ReactNode } from "react"
import { useState } from "react"
import type { Priority, SubTask, Todo } from "@/lib/types"
import type { HabitsApi } from "@/hooks/useHabits"
import { PRIORITY } from "@/lib/tasks"
import { DEFAULT_CATEGORIES } from "@/lib/constants"
import { addDays, dateKey } from "@/lib/date"
import { uid } from "@/lib/habits"
import { FullScreenPage } from "@/components/FullScreenPage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Plus, Trash2, X, GripVertical } from "lucide-react"
import { toast } from "sonner"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Todo | null
  api: HabitsApi
}

interface FormState {
  title: string
  notes: string
  priority: Priority
  category: string
  due: string | null
  subtasks: SubTask[]
}

function initial(editing: Todo | null): FormState {
  if (editing) {
    return {
      title: editing.title,
      notes: editing.notes,
      priority: editing.priority,
      category: editing.category,
      due: editing.due,
      subtasks: editing.subtasks.map((s) => ({ ...s })),
    }
  }
  return {
    title: "",
    notes: "",
    priority: "medium",
    category: "",
    due: null,
    subtasks: [],
  }
}

export function TodoFormDialog({ open, onOpenChange, editing, api }: Props) {
  return (
    <Body
      key={open ? (editing?.id ?? "new") : "closed"}
      open={open}
      onOpenChange={onOpenChange}
      editing={editing}
      api={api}
    />
  )
}

function Body({ open, onOpenChange, editing, api }: Props) {
  const [f, setF] = useState<FormState>(() => initial(editing))
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF((s) => ({ ...s, [k]: v }))

  const todayK = dateKey(new Date())
  const tomorrowK = dateKey(addDays(new Date(), 1))
  const nextWeekK = dateKey(addDays(new Date(), 7))

  const addSub = () =>
    setF((s) => ({
      ...s,
      subtasks: [...s.subtasks, { id: uid(), title: "", done: false }],
    }))
  const setSub = (id: string, title: string) =>
    setF((s) => ({
      ...s,
      subtasks: s.subtasks.map((x) => (x.id === id ? { ...x, title } : x)),
    }))
  const toggleSub = (id: string) =>
    setF((s) => ({
      ...s,
      subtasks: s.subtasks.map((x) =>
        x.id === id ? { ...x, done: !x.done } : x
      ),
    }))
  const removeSub = (id: string) =>
    setF((s) => ({ ...s, subtasks: s.subtasks.filter((x) => x.id !== id) }))

  const save = () => {
    if (!f.title.trim()) {
      toast.error("Lütfen bir başlık gir")
      return
    }
    const payload = {
      title: f.title.trim(),
      notes: f.notes.trim(),
      priority: f.priority,
      category: f.category.trim(),
      due: f.due,
      subtasks: f.subtasks
        .filter((s) => s.title.trim())
        .map((s) => ({ ...s, title: s.title.trim() })),
    }
    if (editing) {
      api.updateTodo(editing.id, payload)
      toast.success("Görev güncellendi")
    } else {
      api.addTodo(payload)
      toast.success("Görev eklendi ✓")
    }
    onOpenChange(false)
  }

  const remove = () => {
    if (!editing) return
    api.deleteTodo(editing.id)
    toast.success("Görev silindi")
    onOpenChange(false)
  }

  return (
    <FullScreenPage
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Görevi Düzenle" : "Yeni Görev"}
      right={
        <Button size="sm" onClick={save} className="mr-1">
          {editing ? "Kaydet" : "Ekle"}
        </Button>
      }
    >
      <div className="flex flex-col gap-6 px-4 py-5 pb-12">
        <Field label="Başlık">
          <Input
            autoFocus={!editing}
            value={f.title}
            maxLength={120}
            onChange={(e) => set("title", e.target.value)}
            placeholder="ör. Faturayı öde, Sunumu hazırla"
          />
        </Field>

        <Field label="Öncelik">
          <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-lg bg-muted p-1">
            {(["low", "medium", "high"] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set("priority", p)}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors",
                  f.priority === p
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: PRIORITY[p].color }}
                />
                {PRIORITY[p].label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Bitiş tarihi">
          <div className="flex flex-wrap gap-2">
            <Chip active={f.due === todayK} onClick={() => set("due", todayK)}>
              Bugün
            </Chip>
            <Chip active={f.due === tomorrowK} onClick={() => set("due", tomorrowK)}>
              Yarın
            </Chip>
            <Chip active={f.due === nextWeekK} onClick={() => set("due", nextWeekK)}>
              +1 hafta
            </Chip>
            <Chip active={!f.due} onClick={() => set("due", null)}>
              Tarihsiz
            </Chip>
          </div>
          <Input
            type="date"
            value={f.due ?? ""}
            onChange={(e) => set("due", e.target.value || null)}
            className="mt-1"
          />
        </Field>

        <Field label="Kategori">
          <Input
            value={f.category}
            list="todo-cat-list"
            maxLength={20}
            onChange={(e) => set("category", e.target.value)}
            placeholder="İş, Ev, Kişisel…"
          />
          <datalist id="todo-cat-list">
            {[...new Set([...DEFAULT_CATEGORIES, ...api.categories])].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <Field label={`Alt görevler${f.subtasks.length ? ` (${f.subtasks.length})` : ""}`}>
          <div className="flex flex-col gap-2">
            {f.subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
                <button
                  type="button"
                  onClick={() => toggleSub(s.id)}
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors",
                    s.done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  )}
                >
                  {s.done && "✓"}
                </button>
                <Input
                  value={s.title}
                  onChange={(e) => setSub(s.id, e.target.value)}
                  placeholder="Alt adım…"
                  className={cn("h-9 flex-1", s.done && "line-through opacity-60")}
                />
                <button
                  type="button"
                  onClick={() => removeSub(s.id)}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addSub} className="self-start">
              <Plus className="size-4" /> Alt görev ekle
            </Button>
          </div>
        </Field>

        <Field label="Notlar">
          <textarea
            value={f.notes}
            onChange={(e) => set("notes", e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Detaylar, bağlantılar, hatırlatmalar…"
            className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
          />
        </Field>

        {editing && (
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={remove}
          >
            <Trash2 className="size-4" /> Görevi sil
          </Button>
        )}
      </div>
    </FullScreenPage>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-muted text-muted-foreground"
      )}
    >
      {children}
    </button>
  )
}

import type { ReactNode } from "react"
import { useState } from "react"
import type { Routine, RoutineStep, TimeOfDay } from "@/lib/types"
import type { HabitsApi } from "@/hooks/useHabits"
import { TIME_OF_DAY } from "@/lib/tasks"
import { ICONS, COLORS, colorVar } from "@/lib/constants"
import { WEEKDAYS_SHORT } from "@/lib/date"
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
  editing: Routine | null
  api: HabitsApi
}

interface FormState {
  name: string
  icon: string
  color: string
  timeOfDay: TimeOfDay
  time: string
  days: number[]
  steps: RoutineStep[]
}

function initial(editing: Routine | null): FormState {
  if (editing) {
    return {
      name: editing.name,
      icon: editing.icon,
      color: editing.color,
      timeOfDay: editing.timeOfDay,
      time: editing.time,
      days: [...editing.days],
      steps: editing.steps.map((s) => ({ ...s })),
    }
  }
  return {
    name: "",
    icon: "🌅",
    color: COLORS[0].key,
    timeOfDay: "morning",
    time: "",
    days: [],
    steps: [
      { id: uid(), title: "", minutes: 0 },
      { id: uid(), title: "", minutes: 0 },
    ],
  }
}

export function RoutineFormDialog({ open, onOpenChange, editing, api }: Props) {
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

  const toggleDay = (d: number) =>
    setF((s) => ({
      ...s,
      days: s.days.includes(d)
        ? s.days.filter((x) => x !== d)
        : [...s.days, d],
    }))

  const addStep = () =>
    setF((s) => ({
      ...s,
      steps: [...s.steps, { id: uid(), title: "", minutes: 0 }],
    }))
  const setStep = (id: string, patch: Partial<RoutineStep>) =>
    setF((s) => ({
      ...s,
      steps: s.steps.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }))
  const removeStep = (id: string) =>
    setF((s) => ({ ...s, steps: s.steps.filter((x) => x.id !== id) }))

  const save = () => {
    if (!f.name.trim()) {
      toast.error("Lütfen bir ad gir")
      return
    }
    const steps = f.steps
      .filter((s) => s.title.trim())
      .map((s) => ({ ...s, title: s.title.trim(), minutes: Math.max(0, s.minutes) }))
    if (steps.length === 0) {
      toast.error("En az bir adım ekle")
      return
    }
    const payload = {
      name: f.name.trim(),
      icon: f.icon,
      color: f.color,
      timeOfDay: f.timeOfDay,
      time: f.time,
      days: f.days,
      steps,
    }
    if (editing) {
      api.updateRoutine(editing.id, payload)
      toast.success("Rutin güncellendi")
    } else {
      api.addRoutine(payload)
      toast.success("Rutin oluşturuldu 🔁")
    }
    onOpenChange(false)
  }

  const remove = () => {
    if (!editing) return
    api.deleteRoutine(editing.id)
    toast.success("Rutin silindi")
    onOpenChange(false)
  }

  const totalMin = f.steps.reduce((s, st) => s + (st.minutes || 0), 0)

  return (
    <FullScreenPage
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Rutini Düzenle" : "Yeni Rutin"}
      right={
        <Button size="sm" onClick={save} className="mr-1">
          {editing ? "Kaydet" : "Oluştur"}
        </Button>
      }
    >
      <div className="flex flex-col gap-6 px-4 py-5 pb-12">
        <Field label="Ad">
          <Input
            autoFocus={!editing}
            value={f.name}
            maxLength={40}
            onChange={(e) => set("name", e.target.value)}
            placeholder="ör. Sabah rutini, Uyku öncesi, Antrenman"
          />
        </Field>

        <Field label="Zaman dilimi">
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
            {(Object.keys(TIME_OF_DAY) as TimeOfDay[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("timeOfDay", t)}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium transition-colors",
                  f.timeOfDay === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <span className="text-base">{TIME_OF_DAY[t].icon}</span>
                {TIME_OF_DAY[t].label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Saat (isteğe bağlı)">
            <Input
              type="time"
              value={f.time}
              onChange={(e) => set("time", e.target.value)}
            />
          </Field>
          <Field label="İkon">
            <details className="relative">
              <summary className="flex h-10 cursor-pointer list-none items-center justify-center rounded-md border bg-muted/40 text-xl">
                {f.icon}
              </summary>
              <div className="absolute z-10 mt-1 grid max-h-48 grid-cols-7 gap-1 overflow-y-auto rounded-lg border bg-popover p-2 shadow-lg">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={(e) => {
                      set("icon", ic)
                      ;(e.currentTarget.closest("details") as HTMLDetailsElement).open = false
                    }}
                    className="aspect-square rounded-md text-lg hover:bg-accent"
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </details>
          </Field>
        </div>

        <Field label="Renk">
          <div className="flex gap-2.5">
            {COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => set("color", c.key)}
                aria-label={c.label}
                className={cn(
                  "size-9 rounded-full transition-transform",
                  f.color === c.key
                    ? "scale-110 ring-2 ring-offset-2 ring-offset-background ring-foreground/40"
                    : "opacity-80"
                )}
                style={{ background: colorVar(c.key) }}
              />
            ))}
          </div>
        </Field>

        <Field label="Günler">
          <div className="flex gap-1.5">
            {WEEKDAYS_SHORT.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={cn(
                  "h-10 flex-1 rounded-lg border text-xs font-medium transition-colors",
                  f.days.includes(i)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-muted text-muted-foreground"
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Hiçbir gün seçmezsen rutin <strong>her gün</strong> uygulanır.
          </p>
        </Field>

        <Field
          label={`Adımlar${totalMin > 0 ? ` · toplam ~${totalMin} dk` : ""}`}
        >
          <div className="flex flex-col gap-2">
            {f.steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                  {i + 1}
                </span>
                <Input
                  value={s.title}
                  onChange={(e) => setStep(s.id, { title: e.target.value })}
                  placeholder="Adım (ör. Su iç, 10 dk meditasyon)"
                  className="h-9 flex-1"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={600}
                    value={s.minutes || ""}
                    onChange={(e) =>
                      setStep(s.id, { minutes: Math.max(0, Number(e.target.value) || 0) })
                    }
                    placeholder="dk"
                    className="h-9 w-16 text-center"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeStep(s.id)}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addStep} className="self-start">
              <Plus className="size-4" /> Adım ekle
            </Button>
          </div>
        </Field>

        {editing && (
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={remove}
          >
            <Trash2 className="size-4" /> Rutini sil
          </Button>
        )}
      </div>
    </FullScreenPage>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

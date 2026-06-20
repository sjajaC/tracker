import type { ReactNode } from "react"
import { useState } from "react"
import type { Frequency, Habit, HabitType } from "@/lib/types"
import type { HabitsApi } from "@/hooks/useHabits"
import { ICONS, COLORS, colorVar, DEFAULT_CATEGORIES } from "@/lib/constants"
import { WEEKDAYS_SHORT } from "@/lib/date"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Minus, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Habit | null
  api: HabitsApi
}

interface FormState {
  name: string
  type: HabitType
  icon: string
  color: string
  category: string
  frequency: Frequency
  timesPerWeek: number
  weekdays: number[]
  measurable: boolean
  target: number
  unit: string
  note: string
}

function initialForm(editing: Habit | null): FormState {
  if (editing) {
    return {
      name: editing.name,
      type: editing.type,
      icon: editing.icon,
      color: editing.color,
      category: editing.category,
      frequency: editing.frequency,
      timesPerWeek: editing.timesPerWeek,
      weekdays: editing.weekdays.length ? editing.weekdays : [1, 2, 3, 4, 5],
      measurable: editing.measurable,
      target: editing.target,
      unit: editing.unit,
      note: editing.note,
    }
  }
  return {
    name: "",
    type: "build",
    icon: ICONS[0],
    color: COLORS[0].key,
    category: "",
    frequency: "daily",
    timesPerWeek: 3,
    weekdays: [1, 2, 3, 4, 5],
    measurable: false,
    target: 8,
    unit: "",
    note: "",
  }
}

export function HabitFormDialog({ open, onOpenChange, editing, api }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Mounted only while open → fresh state each time it opens */}
        {open && (
          <FormBody
            editing={editing}
            api={api}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function FormBody({
  editing,
  api,
  onClose,
}: {
  editing: Habit | null
  api: HabitsApi
  onClose: () => void
}) {
  const [f, setF] = useState<FormState>(() => initialForm(editing))

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF((s) => ({ ...s, [k]: v }))

  const toggleWeekday = (d: number) =>
    setF((s) => ({
      ...s,
      weekdays: s.weekdays.includes(d)
        ? s.weekdays.filter((x) => x !== d)
        : [...s.weekdays, d],
    }))

  const save = () => {
    if (!f.name.trim()) {
      toast.error("Lütfen bir ad gir")
      return
    }
    if (f.frequency === "custom" && f.weekdays.length === 0) {
      toast.error("En az bir gün seç")
      return
    }
    const payload = {
      name: f.name.trim(),
      type: f.type,
      icon: f.icon,
      color: f.color,
      category: f.category.trim(),
      frequency: f.frequency,
      timesPerWeek: f.timesPerWeek,
      weekdays: f.weekdays,
      measurable: f.measurable,
      target: Math.max(1, f.target),
      unit: f.unit.trim(),
      note: f.note.trim(),
    }
    if (editing) {
      api.updateHabit(editing.id, payload)
      toast.success("Güncellendi")
    } else {
      api.addHabit(payload)
      toast.success("Alışkanlık eklendi 🎉")
    }
    onClose()
  }

  const remove = () => {
    if (!editing) return
    api.deleteHabit(editing.id)
    toast.success("Silindi")
    onClose()
  }

  const typeHint =
    f.type === "build"
      ? "Kazandırmak istediğin bir alışkanlık. Her tamamladığında işaretle."
      : "Bırakmak istediğin bir alışkanlık. Uzak kaldığın her gün = temiz gün."

  return (
    <>
      <DialogHeader className="px-5 py-4 border-b text-left">
        <DialogTitle>
          {editing ? "Alışkanlığı Düzenle" : "Yeni Alışkanlık"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Alışkanlık ayrıntılarını gir
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 px-5 py-5">
          {/* Ad */}
          <Field label="Ad">
            <Input
              autoFocus={!editing}
              value={f.name}
              maxLength={40}
              onChange={(e) => set("name", e.target.value)}
              placeholder="ör. Su iç, Kitap oku, Sigara içme"
            />
          </Field>

          {/* Tür */}
          <Field label="Tür" hint={typeHint}>
            <Seg
              options={[
                { v: "build", l: "✅ Kazandır" },
                { v: "quit", l: "🚫 Bırak" },
              ]}
              value={f.type}
              onChange={(v) => set("type", v as HabitType)}
            />
          </Field>

          {/* İkon */}
          <Field label="İkon">
            <div className="grid grid-cols-8 gap-1.5">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => set("icon", ic)}
                  className={cn(
                    "aspect-square rounded-lg text-lg grid place-items-center border transition-colors",
                    f.icon === ic
                      ? "border-primary bg-accent"
                      : "border-transparent bg-muted hover:bg-accent/60"
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </Field>

          {/* Renk */}
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

          {/* Kategori */}
          <Field label="Kategori">
            <Input
              value={f.category}
              list="cat-list"
              maxLength={20}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Sağlık, Spor, Çalışma…"
            />
            <datalist id="cat-list">
              {[...new Set([...DEFAULT_CATEGORIES, ...api.categories])].map(
                (c) => (
                  <option key={c} value={c} />
                )
              )}
            </datalist>
          </Field>

          {/* Sıklık */}
          <Field label="Sıklık">
            <Seg
              options={[
                { v: "daily", l: "Her gün" },
                { v: "weekly", l: "Haftada X" },
                { v: "custom", l: "Günleri seç" },
              ]}
              value={f.frequency}
              onChange={(v) => set("frequency", v as Frequency)}
            />
          </Field>

          {f.frequency === "weekly" && (
            <Field label="Haftada kaç kez">
              <Stepper
                value={f.timesPerWeek}
                min={1}
                max={7}
                onChange={(v) => set("timesPerWeek", v)}
                suffix="kez"
              />
            </Field>
          )}

          {f.frequency === "custom" && (
            <Field label="Günler">
              <div className="flex gap-1.5">
                {WEEKDAYS_SHORT.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleWeekday(i)}
                    className={cn(
                      "flex-1 h-10 rounded-lg text-xs font-medium border transition-colors",
                      f.weekdays.includes(i)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-muted text-muted-foreground"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Ölçülebilir */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex flex-col">
              <Label className="font-medium">Sayısal hedef</Label>
              <span className="text-xs text-muted-foreground">
                ör. 8 bardak su, 30 dk okuma
              </span>
            </div>
            <Switch
              checked={f.measurable}
              onCheckedChange={(v) => set("measurable", v)}
            />
          </div>

          {f.measurable && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hedef">
                <Stepper
                  value={f.target}
                  min={1}
                  max={9999}
                  onChange={(v) => set("target", v)}
                />
              </Field>
              <Field label="Birim">
                <Input
                  value={f.unit}
                  maxLength={12}
                  onChange={(e) => set("unit", e.target.value)}
                  placeholder="bardak, dk…"
                />
              </Field>
            </div>
          )}

          {/* Not */}
          <Field label="Not (isteğe bağlı)">
            <Input
              value={f.note}
              maxLength={80}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Kendine bir hatırlatma"
            />
          </Field>

          {editing && (
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={remove}
            >
              <Trash2 className="size-4" /> Bu alışkanlığı sil
            </Button>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-3 border-t p-4">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          İptal
        </Button>
        <Button className="flex-1" onClick={save}>
          {editing ? "Kaydet" : "Ekle"}
        </Button>
      </div>
    </>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { v: T; l: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "h-9 rounded-md text-sm font-medium transition-colors",
            value === o.v
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground"
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="size-4" />
      </Button>
      <div className="flex-1 h-10 rounded-md border bg-muted/40 grid place-items-center font-semibold tabular-nums">
        {value}{" "}
        {suffix && (
          <span className="text-muted-foreground font-normal ml-1 text-sm">
            {suffix}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}

import type { ReactNode, ChangeEvent } from "react"
import { useRef, useState } from "react"
import type { AppData, ThemeMode } from "@/lib/types"
import type { HabitsApi } from "@/hooks/useHabits"
import { estimateSize } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Download, Upload, Trash2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

export function SettingsView({ api }: { api: HabitsApi }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const { theme, weekStart } = api.data.settings

  const exportData = () => {
    const blob = new Blob([JSON.stringify(api.data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `aliskanlik-yedek-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Yedek indirildi")
  }

  const onImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData
        if (!parsed || !Array.isArray(parsed.habits)) {
          throw new Error("Geçersiz dosya")
        }
        api.importData(parsed)
        toast.success(`${parsed.habits.length} alışkanlık geri yüklendi`)
      } catch {
        toast.error("Dosya okunamadı. Geçerli bir yedek seç.")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const habitCount = api.data.habits.length
  const logDays = Object.values(api.data.logs).reduce(
    (s, m) => s + Object.keys(m).length,
    0
  )

  return (
    <div className="flex flex-col gap-6 pb-28">
      {/* Görünüm */}
      <SettingsGroup title="Görünüm">
        <Row label="Tema">
          <SegSmall<ThemeMode>
            options={[
              { v: "light", l: "Açık" },
              { v: "dark", l: "Koyu" },
              { v: "system", l: "Sistem" },
            ]}
            value={theme}
            onChange={(v) => api.setSettings({ theme: v })}
          />
        </Row>
        <Separator />
        <Row label="Haftanın ilk günü">
          <SegSmall<0 | 1>
            options={[
              { v: 1, l: "Pzt" },
              { v: 0, l: "Paz" },
            ]}
            value={weekStart}
            onChange={(v) => api.setSettings({ weekStart: v })}
          />
        </Row>
      </SettingsGroup>

      {/* Veri */}
      <SettingsGroup title="Veri & Yedekleme">
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Tüm verilerin yalnızca bu tarayıcıda (localStorage) saklanır. Hiçbir
            şey sunucuya gönderilmez. Tarayıcı verilerini temizlersen kaybolur —
            düzenli yedek almanı öneririz.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="size-4" /> Yedeği indir
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Yedekten yükle
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={onImportFile}
        />
        <p className="text-xs text-muted-foreground">
          {habitCount} alışkanlık · {logDays} kayıtlı gün ·{" "}
          {estimateSize(api.data)} kullanılıyor
        </p>
      </SettingsGroup>

      {/* Tehlikeli bölge */}
      <SettingsGroup title="Tehlikeli Bölge">
        <Button
          variant="outline"
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => setConfirmReset(true)}
        >
          <Trash2 className="size-4" /> Tüm verileri sil
        </Button>
      </SettingsGroup>

      <p className="text-center text-xs text-muted-foreground">
        Alışkanlık Takip · Çevrimdışı çalışan, kurulabilir web uygulaması (PWA)
      </p>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emin misin?</DialogTitle>
            <DialogDescription>
              Tüm alışkanlıkların ve geçmiş kayıtların kalıcı olarak silinecek.
              Bu işlem geri alınamaz. Önce yedek almak ister misin?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                api.resetAll()
                setConfirmReset(false)
                toast.success("Tüm veriler silindi")
              }}
            >
              Evet, sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SettingsGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
        {children}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  )
}

function SegSmall<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { v: T; l: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === o.v
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

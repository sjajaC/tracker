import type { ReactNode } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Tam ekran "sayfa" sunumu. Görsel olarak bir alt-sayfa gibi davranır
 * (alttan kayar, tüm ekranı kaplar) ama erişilebilirlik için Radix Dialog
 * altyapısını kullanır (odak tuzağı, ESC ile kapatma).
 */
export function FullScreenPage({
  open,
  onOpenChange,
  title,
  right,
  children,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: ReactNode
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50 mx-auto flex max-w-md flex-col bg-background outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
            "duration-300"
          )}
        >
          <header
            className="flex items-center gap-1 border-b px-2 py-2"
            style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
          >
            <DialogPrimitive.Close
              className="grid size-9 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-accent active:scale-95"
              aria-label="Geri"
            >
              <ChevronLeft className="size-6" />
            </DialogPrimitive.Close>
            <DialogPrimitive.Title className="flex-1 truncate text-base font-semibold">
              {title}
            </DialogPrimitive.Title>
            {right}
          </header>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

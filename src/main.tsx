import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "next-themes"
import "./index.css"
import App from "./App.tsx"

// Yeni bir sürüm yayınlandığında (service worker güncellenince) sayfayı
// otomatik yenile; böylece kullanıcı eski önbelleğe takılıp kalmaz.
if ("serviceWorker" in navigator) {
  let hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) {
      // İlk kurulum: henüz kontrol eden SW yoktu, yenilemeye gerek yok.
      hadController = true
      return
    }
    window.location.reload()
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </StrictMode>
)

# 🌱 Alışkanlık Takip

Alışkanlıklarını oluştur, kötü alışkanlıklarından kurtul. **Mobil uygulama gibi çalışan**, çevrimdışı kullanılabilen ve telefona kurulabilen (PWA) bir alışkanlık takip uygulaması. Tüm verilerin **yalnızca tarayıcında (localStorage)** saklanır — sunucu yok, hesap yok, takip yok.

Tasarım [shadcn/ui](https://ui.shadcn.com) bileşenleri + Tailwind CSS v4 ile yapıldı.

## ✨ Özellikler

### İki tür alışkanlık
- **✅ Kazandır** — günlük yapmak istediklerin (su iç, kitap oku, spor)
- **🚫 Bırak** — uzak durmak istediklerin (sigara, şeker, ekran). Uzak kaldığın her gün “temiz gün” olarak sayılır.

### Esnek hedefler
- **Her gün**, **haftada X kez** ya da **belirli günleri seç** (ör. Pzt-Çar-Cum)
- **Sayısal hedefler** — “8 bardak su”, “30 dk okuma” gibi ölçülebilir alışkanlıklar
- İkon, renk, kategori ve not

### Çok detaylı takip & görselleştirme
- **GitHub tarzı aktivite ısı haritası** (heatmap) — 30 haftaya kadar; kareye dokunarak geçmiş günleri işaretle
- **Seri (streak) sayacı** — güncel seri + en iyi seri (günlük/haftalık)
- **Tamamlama oranı** — tüm zamanlar ve son 30 gün
- **Son 14 gün** mini bar grafiği
- **“Hangi günler daha başarılısın?”** — haftanın günlerine göre başarı deseni
- **Günlük halka (ring) ilerlemesi** ve 7 günlük tarih şeridi

### İstatistik paneli
- Aktif alışkanlık sayısı, 30 gün ortalaması, en iyi seri, “mükemmel gün” sayısı
- Son 30 günün genel tamamlama grafiği
- 🔥 Seri sıralaması
- Bugünün tüm alışkanlıkları tek bakışta halkalarla

### Uygulama hissi (PWA)
- Telefona/masaüstüne **kurulabilir**, tam ekran çalışır
- **Çevrimdışı** çalışır (Service Worker ile önbellekleme)
- Alt navigasyon, dokunma dostu hedefler, koyu/açık/sistem teması
- Güvenli alan (notch) desteği

### Veri senin
- Tek tıkla **JSON yedeği indir** ve **yedekten geri yükle**
- Her şey `localStorage`’da; istediğinde tek tuşla temizle

## 🚀 Çalıştırma

```bash
npm install
npm run dev        # geliştirme sunucusu
npm run build      # üretim derlemesi (dist/)
npm run preview    # derlemeyi yerel önizle
```

> Telefonda “uygulama gibi” denemek için: tarayıcıda aç → menüden **“Ana ekrana ekle”**.

## 🌐 Canlıya alma (GitHub Pages)

Proje, push'ta otomatik yayınlanacak şekilde **GitHub Actions + GitHub Pages** ile kuruludur (`.github/workflows/deploy.yml`).

**İlk kurulum (tek seferlik):**
1. Bu dalı **`main`** dalına birleştir (veya `main`'e push'la). Workflow yalnızca `main`/`master`'a push'ta tetiklenir.
2. GitHub'da depoda: **Settings → Pages → Build and deployment → Source = “GitHub Actions”** seç.
   (Workflow bunu otomatik açmayı dener; yine de kapalıysa buradan aç.)
3. **Actions** sekmesinden “Deploy to GitHub Pages” çalışmasının yeşil olmasını bekle.

Yayınlanan adres: **`https://<kullanıcı-adı>.github.io/tracker/`**

**Notlar**
- Vite `base` yolu CI'da otomatik olarak `/<repo-adı>/` (yani `/tracker/`) ayarlanır; bu sayede CSS/JS/PWA dosyaları alt yolda 404 olmaz. Lokal geliştirmede `/` kullanılır.
- Depo adını değiştirirsen base otomatik uyum sağlar (repo adından okunur).
- Özel alan adı (custom domain) veya `kullanıcı.github.io` kök sitesi kullanacaksan base'i `/` yapmak için workflow'daki `BASE_PATH`'i kaldır.
- Manuel yayın: **Actions → Deploy to GitHub Pages → Run workflow**.

## 🧱 Teknolojiler

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** + **shadcn/ui** (new-york stili, Radix UI tabanlı)
- **lucide-react** ikonlar, **sonner** bildirimler, **next-themes** tema
- **vite-plugin-pwa** (Workbox) — manifest + service worker

## 📁 Proje yapısı

```
src/
  components/
    ui/                # shadcn/ui bileşenleri (button, card, dialog, ...)
    Heatmap.tsx        # GitHub tarzı ısı haritası
    Charts.tsx         # Ring, MiniBars, WeekdayPattern
    HabitFormDialog.tsx
    HabitDetailDialog.tsx
  views/
    TodayView.tsx      # Bugün
    HabitsView.tsx     # Liste + mini heatmap
    StatsView.tsx      # İstatistik paneli
    SettingsView.tsx   # Tema, yedekleme, sıfırlama
  hooks/useHabits.ts   # localStorage destekli durum yönetimi
  lib/
    types.ts           # veri modeli
    habits.ts          # seri, istatistik, zamanlama, heatmap mantığı
    date.ts            # tarih yardımcıları (TR)
    storage.ts         # localStorage yükle/kaydet/yedek
    constants.ts       # ikon/renk/kategori
```

## 🔒 Gizlilik

Hiçbir veri sunucuya gönderilmez. Tüm alışkanlıkların ve geçmişin tarayıcının `localStorage` alanında tutulur. Tarayıcı verilerini temizlersen kaybolur — bu yüzden **Ayarlar → Yedeği indir** ile düzenli yedek almanı öneririz.

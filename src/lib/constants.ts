export const ICONS = [
  "💧", "🏃", "📚", "🧘", "💪", "🥗", "😴", "🦷",
  "🚭", "🍷", "📵", "🍔", "🎮", "🛒", "☕", "🍬",
  "✍️", "🎯", "🧹", "💊", "🌱", "🎸", "🧠", "💰",
  "🚶", "🚴", "🏋️", "⛹️", "🤸", "🧗", "🏊", "⚽",
  "🎨", "🎧", "📝", "🗣️", "🌅", "🌙", "🙏", "❤️",
]

/** color key -> css var token (defined in index.css @theme) */
export const COLORS = [
  { key: "chart-1", label: "Mor" },
  { key: "chart-2", label: "Yeşil" },
  { key: "chart-3", label: "Sarı" },
  { key: "chart-4", label: "Kırmızı" },
  { key: "chart-5", label: "Mavi" },
]

export function colorVar(key: string): string {
  return `var(--${key})`
}

export const DEFAULT_CATEGORIES = [
  "Sağlık",
  "Spor",
  "Çalışma",
  "Zihin",
  "Kişisel",
  "Para",
]

const MAP: Record<string, string> = {
  "real-estate": "🏠",
  "cars-vehicles": "🚗",
  "mobile-phones-tablets": "📱",
  electronics: "💻",
  "home-appliances": "🔌",
  "furniture-home-garden": "🛋️",
  "clothing-accessories": "👕",
  "jewelry-watches": "💍",
  "cameras-imaging": "📷",
  "consoles-video-games": "🎮",
  "musical-instruments": "🎸",
  "sports-equipment": "🏀",
  pets: "🐾",
  jobs: "💼",
};

export function categoryEmoji(slug: string): string {
  return MAP[slug] ?? "🏷️";
}

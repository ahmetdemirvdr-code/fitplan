export const colors = {
  background: "#1A1A2E",
  backgroundGradient: "#1E2D4A",
  primary: "#FF6B35",
  primaryDark: "#E55A25",
  border: "#2A3A5C",
  textPrimary: "#EAEAEA",
  textMuted: "#9CA3AF",
  success: "#2ECC71",
  warning: "#F1C40F",
  danger: "#E74C3C",
  info: "#4ECDC4",
  scoreEmpty: "#243044",
  mealBreakfast: "#FFE66D",
  mealLunch: "#FF6B35",
  mealDinner: "#E74C3C",
  mealSnack: "#a29bfe",
  cardBackground: "#16213E",
  cardBorder: "#2A3A5C",
  purple: "#a29bfe",
};

export const goalLabels: Record<string, string> = {
  LOSE_WEIGHT: "Kilo ver",
  BUILD_MUSCLE: "Kas yap",
  MAINTAIN: "Form koru",
  ENDURANCE: "Dayanıklılık",
};

export const levelLabels: Record<string, string> = {
  BEGINNER: "Başlangıç",
  INTERMEDIATE: "Orta",
  ADVANCED: "İleri",
};

export const mealTypeLabels: Record<string, string> = {
  BREAKFAST: "Kahvaltı",
  LUNCH: "Öğle",
  DINNER: "Akşam",
  SNACK: "Atıştırmalık",
};

export const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/** Android emulator → host machine. Physical device: set EXPO_PUBLIC_API_URL. */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? "http://10.0.2.2:3000" : "https://strivefit.duckdns.org");

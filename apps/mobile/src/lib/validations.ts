import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalı"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z
    .string()
    .min(6, "Şifre en az 6 karakter olmalı")
    .max(100, "Şifre en fazla 100 karakter olabilir"),
});

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

export const profileSchema = z.object({
  // Step 1 - Personal
  age: z.number().min(14, "Yaş en az 14 olmalı").max(100, "Yaş en fazla 100 olabilir"),
  gender: z.enum(["MALE", "FEMALE"]),
  height: z.number().min(100, "Boy en az 100 cm olmalı").max(250, "Boy en fazla 250 cm olabilir"),
  weight: z.number().min(30, "Kilo en az 30 kg olmalı").max(300, "Kilo en fazla 300 kg olabilir"),
  bodyFatPercentage: z.number().min(3).max(60).nullable().optional(),

  // Step 2 - Goals
  goal: z.enum(["LOSE_WEIGHT", "BUILD_MUSCLE", "MAINTAIN", "ENDURANCE"]),
  targetWeight: z.number().min(30).max(300).nullable().optional(),
  targetDuration: z.string().nullable().optional(),

  // Step 3 - Health
  healthConditions: z.array(z.string()),
  allergies: z.array(z.string()),
  injuries: z.string().nullable().optional(),
  dietPreference: z.enum(["NORMAL", "VEGETARIAN", "VEGAN", "KETO", "OTHER"]),

  // Step 4 - Experience
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),

  // Step 5 - Equipment
  hasGymAccess: z.boolean(),
  homeEquipment: z.array(z.string()),
  bodyweightOnly: z.boolean(),

  // Step 6 - Time
  daysPerWeek: z.number().min(1).max(7),
  minutesPerDay: z.number().min(15).max(120),
  preferredTime: z.enum(["MORNING", "NOON", "EVENING", "ANY"]),

  // Step 7 - Nutrition
  mealsPerDay: z.number().min(2).max(6),
  hasSnacks: z.boolean(),
  eatsAtHome: z.boolean(),
  budget: z.enum(["LOW", "MEDIUM", "HIGH"]),
  waterHabit: z.enum(["LOW", "MEDIUM", "GOOD"]),
});

export const foodLogSchema = z.object({
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  description: z.string().min(1, "Yemek açıklaması gerekli"),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
});

export const waterLogSchema = z.object({
  amount: z.number().min(1, "Miktar en az 1 ml olmalı").max(5000, "Miktar en fazla 5000 ml olabilir"),
});

export const measurementSchema = z.object({
  weight: z.number().min(30).max(300).nullable().optional(),
  chestMeasure: z.number().min(30).max(200).nullable().optional(),
  waistMeasure: z.number().min(30).max(200).nullable().optional(),
  hipMeasure: z.number().min(30).max(200).nullable().optional(),
  armMeasure: z.number().min(15).max(80).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type FoodLogInput = z.infer<typeof foodLogSchema>;
export type WaterLogInput = z.infer<typeof waterLogSchema>;
export type MeasurementInput = z.infer<typeof measurementSchema>;

"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Dumbbell,
  Droplets,
  TrendingUp,
  Flame,
  Loader2,
  Sun,
  Sunset,
  Zap,
  Apple,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { DEFAULT_AVATAR_ID } from "@/lib/avatars";

interface PlanData {
  dailyCalorieTarget: number;
  dailyWaterTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
}

interface WorkoutData {
  isRestDay: boolean;
  name: string;
  exercises: Array<{ id: string; name: string }>;
  workoutLog?: { isCompleted: boolean } | null;
}

interface FoodLogData {
  totals: { calories: number; protein: number; carbs: number; fat: number };
}

interface WaterData {
  totalMl: number;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: "Günaydın", icon: <Sun size={26} className="text-yellow-400" /> };
  }
  if (hour >= 12 && hour < 18) {
    return { text: "İyi günler", icon: <Zap size={26} className="text-orange-400" /> };
  }
  return { text: "İyi akşamlar", icon: <Sunset size={26} className="text-purple-400" /> };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [food, setFood] = useState<FoodLogData | null>(null);
  const [water, setWater] = useState<WaterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingWater, setAddingWater] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);

  const fetchData = useCallback(async () => {
    try {
      const [planRes, workoutRes, foodRes, waterRes, profileRes, avatarRes] =
        await Promise.all([
          fetch("/api/plan/active"),
          fetch("/api/workout/today"),
          fetch("/api/food/log"),
          fetch("/api/water/log"),
          fetch("/api/profile"),
          fetch("/api/profile/avatar"),
        ]);

      if (planRes.ok) setPlan(await planRes.json());
      else setPlan(null);
      setHasProfile(profileRes.ok);
      if (avatarRes.ok) {
        const a = await avatarRes.json();
        if (a.avatarId) setAvatarId(a.avatarId);
      }
      if (workoutRes.ok) setWorkout(await workoutRes.json());
      if (foodRes.ok) setFood(await foodRes.json());
      if (waterRes.ok) setWater(await waterRes.json());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addWaterQuick = async () => {
    setAddingWater(true);
    try {
      const res = await fetch("/api/water/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 200 }),
      });
      if (res.ok) {
        await fetchData();
        toast.success("200ml su eklendi");
      } else {
        toast.error("Su eklenemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setAddingWater(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  if (!plan) {
    const restorePlan = async () => {
      setRestoring(true);
      try {
        const res = await fetch("/api/plan/restore", { method: "POST" });
        if (res.ok) {
          toast.success("Önceki planın geri yüklendi");
          await fetchData();
        } else {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || "Geri yüklenecek plan yok");
        }
      } catch {
        toast.error("Bir hata oluştu");
      } finally {
        setRestoring(false);
      }
    };

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6B35]/20">
          <Dumbbell className="h-8 w-8 text-[#FF6B35]" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-[#EAEAEA]">
          {hasProfile ? "Aktif Plan Yok" : "Henüz Planın Yok"}
        </h2>
        <p className="mb-6 max-w-sm text-[#EAEAEA]/60">
          {hasProfile
            ? "Profilin duruyor. Önceki planını geri yükleyebilir veya profilinden yeni plan oluşturabilirsin."
            : "Profilini oluştur ve AI sana özel bir plan hazırlasın."}
        </p>
        <div className="flex w-full max-w-xs flex-col gap-2">
          {hasProfile && (
            <>
              <Button
                className="h-12 rounded-xl px-6 font-semibold text-[#1A1A2E]"
                style={{ background: "#4ECDC4" }}
                onClick={restorePlan}
                disabled={restoring}
              >
                {restoring ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Önceki planı geri yükle"
                )}
              </Button>
              <Link href="/profile">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-xl"
                >
                  Profile git
                </Button>
              </Link>
            </>
          )}
          {!hasProfile && (
            <Link href="/onboarding">
              <Button
                className="h-12 w-full rounded-xl px-6 font-semibold text-white shadow-lg shadow-[#FF6B35]/25"
                style={{ background: "linear-gradient(135deg, #FF6B35, #ff8c5a)" }}
              >
                Profil Oluştur
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const greeting = getGreeting();
  const firstName = session?.user?.name?.split(" ")[0] || "";
  const caloriePercent = Math.min(
    ((food?.totals.calories || 0) / plan.dailyCalorieTarget) * 100,
    100
  );
  const waterTargetMl = plan.dailyWaterTarget * 1000;
  const waterPercent = Math.min(((water?.totalMl || 0) / waterTargetMl) * 100, 100);
  const workoutDone = !!workout?.workoutLog?.isCompleted;
  const workoutLabel = workout?.isRestDay
    ? "Dinlenme"
    : workoutDone
      ? "Tamam"
      : "Bekliyor";
  const workoutColor = workout?.isRestDay
    ? "#4ECDC4"
    : workoutDone
      ? "#2ECC71"
      : "rgba(234,234,234,0.35)";

  const dateStr = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="px-5 py-6">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Greeting */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-3">
              {greeting.icon}
              <h1 className="text-2xl font-bold text-[#EAEAEA]">
                {greeting.text}
                {firstName ? `, ${firstName}` : ""}!
              </h1>
            </div>
            <p className="ml-10 text-sm text-[#EAEAEA]/50">{dateStr}</p>
          </div>
          <Link href="/profile" aria-label="Profil ve avatar">
            <UserAvatar avatarId={avatarId} size={48} />
          </Link>
        </div>

        {/* Daily overview row */}
        <div
          className="rounded-2xl border border-white/[0.07] p-4"
          style={{ background: "linear-gradient(135deg, #16213E 0%, #1a1f3a 100%)" }}
        >
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="font-stat text-lg font-semibold text-[#FF6B35]">
                {food?.totals.calories || 0}
              </div>
              <div className="text-[10px] text-[#EAEAEA]/50">kcal</div>
            </div>
            <div>
              <div className="font-stat text-lg font-semibold text-[#4ECDC4]">
                {food?.totals.protein || 0}g
              </div>
              <div className="text-[10px] text-[#EAEAEA]/50">protein</div>
            </div>
            <div>
              <div className="font-stat text-lg font-semibold text-[#4ECDC4]">
                {((water?.totalMl || 0) / 1000).toFixed(1)}
              </div>
              <div className="text-[10px] text-[#EAEAEA]/50">L su</div>
            </div>
            <div>
              <div className="font-stat text-sm font-semibold" style={{ color: workoutColor }}>
                {workoutLabel}
              </div>
              <div className="text-[10px] text-[#EAEAEA]/50">antrenman</div>
            </div>
          </div>
        </div>

        {/* Calorie card */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-[#FF6B35]" />
                <span className="font-semibold">Kalori</span>
              </div>
              <span className="font-stat text-sm text-[#EAEAEA]/60">
                {food?.totals.calories || 0} / {plan.dailyCalorieTarget} kcal
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#1A1A2E]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${caloriePercent}%`,
                  background: "linear-gradient(90deg, #FF6B35, #FFE66D)",
                }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-stat font-semibold text-[#4ECDC4]">
                  {food?.totals.protein || 0}g
                </div>
                <div className="text-[#EAEAEA]/40">Protein</div>
              </div>
              <div>
                <div className="font-stat font-semibold text-[#FFE66D]">
                  {food?.totals.carbs || 0}g
                </div>
                <div className="text-[#EAEAEA]/40">Karb</div>
              </div>
              <div>
                <div className="font-stat font-semibold text-[#E74C3C]">
                  {food?.totals.fat || 0}g
                </div>
                <div className="text-[#EAEAEA]/40">Yağ</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Water progress */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-[#4ECDC4]" />
                <span className="font-semibold">Su</span>
              </div>
              <span className="font-stat text-sm text-[#EAEAEA]/60">
                {((water?.totalMl || 0) / 1000).toFixed(1)} / {plan.dailyWaterTarget} L
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#1A1A2E]">
              <div
                className="h-full rounded-full bg-[#4ECDC4] transition-all duration-500"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Today's workout */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-[#FF6B35]" />
                <span className="font-semibold">Bugünün Antrenmanı</span>
              </div>
              {workoutDone && (
                <span className="rounded-full bg-[#2ECC71]/20 px-2 py-0.5 text-xs font-medium text-[#2ECC71]">
                  Tamamlandı
                </span>
              )}
            </div>
            {workout?.isRestDay ? (
              <p className="text-[#EAEAEA]/60">Bugün dinlenme günü. İyi dinlen!</p>
            ) : (
              <p className="text-sm text-[#EAEAEA]/60">
                {workout?.name} — {workout?.exercises?.length || 0} hareket
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick actions — 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/workout" className="block">
            <button
              type="button"
              className="flex h-full min-h-[96px] w-full flex-col items-start justify-between rounded-2xl p-4 text-left font-semibold text-white shadow-lg shadow-[#FF6B35]/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #FF6B35, #ff8c5a)" }}
            >
              <Dumbbell size={22} />
              <span className="text-sm leading-tight">
                Antrenmana
                <br />
                Başla
              </span>
            </button>
          </Link>

          <button
            type="button"
            onClick={addWaterQuick}
            disabled={addingWater}
            className="flex h-full min-h-[96px] w-full flex-col items-start justify-between rounded-2xl p-4 text-left font-semibold text-[#1A1A2E] shadow-lg shadow-[#4ECDC4]/20 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #4ECDC4, #6eddd6)" }}
          >
            {addingWater ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <Droplets size={22} />
            )}
            <span className="text-sm leading-tight">
              Su Ekle
              <br />
              <span className="text-xs font-medium opacity-70">+200ml</span>
            </span>
          </button>

          <Link href="/nutrition/add" className="block">
            <button
              type="button"
              className="flex h-full min-h-[96px] w-full flex-col items-start justify-between rounded-2xl p-4 text-left font-semibold text-[#1A1A2E] shadow-lg shadow-[#2ECC71]/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #2ECC71, #6ee7a0)" }}
            >
              <Apple size={22} />
              <span className="text-sm leading-tight">Yemek Ekle</span>
            </button>
          </Link>

          <Link href="/progress" className="block">
            <button
              type="button"
              className="flex h-full min-h-[96px] w-full flex-col items-start justify-between rounded-2xl border border-[#FFE66D]/25 p-4 text-left font-semibold text-[#EAEAEA] shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #16213E, #1e2d4f)" }}
            >
              <TrendingUp size={22} className="text-[#FFE66D]" />
              <span className="text-sm leading-tight">İlerleme</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

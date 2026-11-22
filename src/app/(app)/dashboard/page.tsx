"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Dumbbell,
  Apple,
  Droplets,
  TrendingUp,
  Flame,
  Loader2,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

export default function DashboardPage() {
  const { data: session } = useSession();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [food, setFood] = useState<FoodLogData | null>(null);
  const [water, setWater] = useState<WaterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [planRes, workoutRes, foodRes, waterRes] = await Promise.all([
          fetch("/api/plan/active"),
          fetch("/api/workout/today"),
          fetch("/api/food/log"),
          fetch("/api/water/log"),
        ]);

        if (planRes.ok) setPlan(await planRes.json());
        if (workoutRes.ok) setWorkout(await workoutRes.json());
        if (foodRes.ok) setFood(await foodRes.json());
        if (waterRes.ok) setWater(await waterRes.json());
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <Dumbbell className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="mb-2 text-xl font-bold">Henuz Planin Yok</h2>
        <p className="mb-6 text-muted-foreground">
          Profilini olustur ve AI sana ozel bir plan hazirlasin.
        </p>
        <Link href="/onboarding">
          <Button className="bg-green-600 hover:bg-green-700 rounded-xl h-12 px-6">
            Profil Olustur
          </Button>
        </Link>
      </div>
    );
  }

  const caloriePercent = plan
    ? Math.min(
        ((food?.totals.calories || 0) / plan.dailyCalorieTarget) * 100,
        100
      )
    : 0;
  const waterPercent = plan
    ? Math.min(
        ((water?.totalMl || 0) / (plan.dailyWaterTarget * 1000)) * 100,
        100
      )
    : 0;

  const today = new Date();
  const dateStr = today.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Merhaba, {session?.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">{dateStr}</p>
        </div>

        <div className="space-y-4">
          {/* Calorie Card */}
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">Kalori</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {food?.totals.calories || 0} / {plan.dailyCalorieTarget} kcal
                </span>
              </div>
              <Progress value={caloriePercent} className="h-3" />
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="font-semibold text-blue-600">
                    {food?.totals.protein || 0}g
                  </div>
                  <div className="text-muted-foreground">Protein</div>
                </div>
                <div>
                  <div className="font-semibold text-amber-600">
                    {food?.totals.carbs || 0}g
                  </div>
                  <div className="text-muted-foreground">Karb</div>
                </div>
                <div>
                  <div className="font-semibold text-red-500">
                    {food?.totals.fat || 0}g
                  </div>
                  <div className="text-muted-foreground">Yag</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Water Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Su</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {((water?.totalMl || 0) / 1000).toFixed(1)} /{" "}
                  {plan.dailyWaterTarget} L
                </span>
              </div>
              <Progress value={waterPercent} className="h-3" />
            </CardContent>
          </Card>

          {/* Workout Card */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Bugunun Antrenmani</span>
                </div>
                {workout?.workoutLog?.isCompleted && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Tamamlandi
                  </span>
                )}
              </div>
              {workout?.isRestDay ? (
                <p className="text-muted-foreground">
                  Bugn dinlenme gunu. Iyi dinlen!
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {workout?.name} -{" "}
                    {workout?.exercises?.length || 0} hareket
                  </p>
                  <Link href="/workout">
                    <Button
                      variant="outline"
                      className="mt-3 w-full rounded-xl"
                    >
                      Antrenmana Git
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Link href="/nutrition/add">
              <Card className="cursor-pointer hover:border-orange-200 transition-colors">
                <CardContent className="flex flex-col items-center gap-1 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <Apple className="h-5 w-5 text-orange-500" />
                  </div>
                  <span className="text-xs font-medium">Yemek Ekle</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/water">
              <Card className="cursor-pointer hover:border-blue-200 transition-colors">
                <CardContent className="flex flex-col items-center gap-1 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Plus className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-xs font-medium">Su Ic</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/progress">
              <Card className="cursor-pointer hover:border-purple-200 transition-colors">
                <CardContent className="flex flex-col items-center gap-1 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="text-xs font-medium">Ilerleme</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

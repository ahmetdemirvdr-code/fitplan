"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  Dumbbell,
  Loader2,
  RefreshCw,
  Crown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";

interface ProfileData {
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal: string;
  experienceLevel: string;
  daysPerWeek: number;
}

interface PlanData {
  id: string;
  createdAt: string;
  durationWeeks: number;
  dailyCalorieTarget: number;
}

const goalLabels: Record<string, string> = {
  LOSE_WEIGHT: "Kilo Verme",
  BUILD_MUSCLE: "Kas Yapma",
  MAINTAIN: "Form Koruma",
  ENDURANCE: "Dayaniklilik",
};

const levelLabels: Record<string, string> = {
  BEGINNER: "Baslangic",
  INTERMEDIATE: "Orta",
  ADVANCED: "Ileri",
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, planRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/plan/active"),
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (planRes.ok) setPlan(await planRes.json());
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegeneratePlan = async () => {
    setRegenerating(true);
    toast.info("Plan yeniden olusturuluyor...");

    try {
      const res = await fetch("/api/plan/generate", { method: "POST" });
      if (res.ok) {
        toast.success("Yeni plan olusturuldu!");
        fetchData();
      } else {
        toast.error("Plan olusturulamadi");
      }
    } catch {
      toast.error("Bir hata olustu");
    } finally {
      setRegenerating(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md">
        {/* User Info */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <User className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-xl font-bold">{session?.user?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {session?.user?.email}
          </p>
          <Badge variant="secondary" className="mt-2">
            <Crown className="mr-1 h-3 w-3" />
            Ucretsiz Plan
          </Badge>
        </div>

        {/* Profile Stats */}
        {profile && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="mb-3 font-semibold">Profilim</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Yas:</span>{" "}
                  <span className="font-medium">{profile.age}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Boy:</span>{" "}
                  <span className="font-medium">{profile.height} cm</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Kilo:</span>{" "}
                  <span className="font-medium">{profile.weight} kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hedef:</span>{" "}
                  <span className="font-medium">
                    {goalLabels[profile.goal]}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Seviye:</span>{" "}
                  <span className="font-medium">
                    {levelLabels[profile.experienceLevel]}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gun/Hafta:</span>{" "}
                  <span className="font-medium">{profile.daysPerWeek}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Plan */}
        {plan && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Aktif Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(plan.createdAt).toLocaleDateString("tr-TR")} tarihinde
                    olusturuldu
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plan.durationWeeks} haftalik - {plan.dailyCalorieTarget}{" "}
                    kcal/gun
                  </p>
                </div>
                <Dumbbell className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-12 justify-between rounded-xl"
            onClick={handleRegeneratePlan}
            disabled={regenerating}
          >
            <div className="flex items-center gap-2">
              <RefreshCw
                className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`}
              />
              <span>Planimi Guncelle</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Link href="/profile/settings">
            <Button
              variant="outline"
              className="w-full h-12 justify-between rounded-xl"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Ayarlar</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>

          <Separator className="my-4" />

          <Button
            variant="ghost"
            className="w-full h-12 justify-start rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cikis Yap
          </Button>
        </div>
      </div>
    </div>
  );
}

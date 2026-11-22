"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ClipboardPaste,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PlanGeneratingStatus } from "@/components/plan-generating-status";

const STEPS = [
  "Kişisel Bilgiler",
  "Hedef",
  "Sağlık Durumu",
  "Spor Geçmişi",
  "Ekipman",
  "Zaman",
  "Beslenme",
];

type OnboardingMode = "choose" | "questionnaire" | "import";

type FormData = {
  age: number;
  gender: string;
  height: number;
  weight: number;
  bodyFatPercentage: number | null;
  goal: string;
  targetWeight: number | null;
  targetDuration: string | null;
  healthConditions: string[];
  allergies: string[];
  injuries: string | null;
  dietPreference: string;
  experienceLevel: string;
  hasGymAccess: boolean;
  homeEquipment: string[];
  bodyweightOnly: boolean;
  daysPerWeek: number;
  minutesPerDay: number;
  preferredTime: string;
  mealsPerDay: number;
  hasSnacks: boolean;
  eatsAtHome: boolean;
  budget: string;
  waterHabit: string;
};

const initialForm: FormData = {
  age: 25,
  gender: "MALE",
  height: 175,
  weight: 75,
  bodyFatPercentage: null,
  goal: "BUILD_MUSCLE",
  targetWeight: null,
  targetDuration: null,
  healthConditions: [],
  allergies: [],
  injuries: null,
  dietPreference: "NORMAL",
  experienceLevel: "BEGINNER",
  hasGymAccess: true,
  homeEquipment: [],
  bodyweightOnly: false,
  daysPerWeek: 4,
  minutesPerDay: 60,
  preferredTime: "ANY",
  mealsPerDay: 3,
  hasSnacks: true,
  eatsAtHome: true,
  budget: "MEDIUM",
  waterHabit: "MEDIUM",
};

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRetake = searchParams.get("retake") === "1";
  const [mode, setMode] = useState<OnboardingMode>(
    isRetake ? "questionnaire" : "choose"
  );
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [existingProgram, setExistingProgram] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => {
    if (!isRetake) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setForm((prev) => ({
          ...prev,
          age: data.age ?? prev.age,
          gender: data.gender ?? prev.gender,
          height: data.height ?? prev.height,
          weight: data.weight ?? prev.weight,
          bodyFatPercentage: data.bodyFatPercentage ?? prev.bodyFatPercentage,
          goal: data.goal ?? prev.goal,
          targetWeight: data.targetWeight ?? prev.targetWeight,
          targetDuration: data.targetDuration ?? prev.targetDuration,
          healthConditions: data.healthConditions ?? prev.healthConditions,
          allergies: data.allergies ?? prev.allergies,
          injuries: data.injuries ?? prev.injuries,
          dietPreference: data.dietPreference ?? prev.dietPreference,
          experienceLevel: data.experienceLevel ?? prev.experienceLevel,
          hasGymAccess: data.hasGymAccess ?? prev.hasGymAccess,
          homeEquipment: data.homeEquipment ?? prev.homeEquipment,
          bodyweightOnly: data.bodyweightOnly ?? prev.bodyweightOnly,
          daysPerWeek: data.daysPerWeek ?? prev.daysPerWeek,
          minutesPerDay: data.minutesPerDay ?? prev.minutesPerDay,
          preferredTime: data.preferredTime ?? prev.preferredTime,
          mealsPerDay: data.mealsPerDay ?? prev.mealsPerDay,
          hasSnacks: data.hasSnacks ?? prev.hasSnacks,
          eatsAtHome: data.eatsAtHome ?? prev.eatsAtHome,
          budget: data.budget ?? prev.budget,
          waterHabit: data.waterHabit ?? prev.waterHabit,
        }));
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isRetake]);

  const progress = ((step + 1) / STEPS.length) * 100;

  const updateForm = (key: keyof FormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: "healthConditions" | "allergies" | "homeEquipment", item: string) => {
    setForm((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(item)
          ? arr.filter((i) => i !== item)
          : [...arr, item],
      };
    });
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
    else if (isRetake) router.push("/profile");
    else setMode("choose");
  };

  const saveProfileAndGenerate = async (programText?: string) => {
    setLoading(true);
    try {
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!profileRes.ok) {
        const data = await profileRes.json();
        toast.error(data.error || "Profil kaydedilemedi");
        setLoading(false);
        return;
      }

      toast.success(
        programText
          ? "Programın alındı! Strive formatına dönüştürülüyor..."
          : "Profil kaydedildi! Plan oluşturuluyor..."
      );
      setGeneratingPlan(true);

      const planRes = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          programText ? { existingProgram: programText } : {}
        ),
      });

      if (!planRes.ok) {
        const data = await planRes.json().catch(() => ({}));
        toast.error(
          data.error ||
            "Plan oluşturulamadı. Dashboard'dan tekrar deneyebilirsiniz."
        );
        router.push(data.code === "AI_BUDGET_EXCEEDED" ? "/profile" : "/dashboard");
        return;
      }

      toast.success("Planın hazır!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
      setGeneratingPlan(false);
    }
  };

  const handleSubmit = async () => {
    await saveProfileAndGenerate();
  };

  const handleImportSubmit = async () => {
    const text = existingProgram.trim();
    if (text.length < 40) {
      toast.error("Lütfen mevcut programını biraz daha detaylı yapıştır");
      return;
    }
    if (!form.age || !form.height || !form.weight || !form.gender) {
      toast.error("Yaş, boy, kilo ve cinsiyet gerekli");
      return;
    }
    await saveProfileAndGenerate(text);
  };

  if (generatingPlan) {
    return (
      <PlanGeneratingStatus
        detail={
          mode === "import"
            ? "Mevcut programın Strive formatına dönüştürülüyor..."
            : "AI sana özel spor ve beslenme planı oluşturuyor..."
        }
      />
    );
  }

  if (mode === "choose") {
    return (
      <div className="flex min-h-screen flex-col bg-background px-5 py-10">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Planını nasıl oluşturalım?</h1>
            <p className="mt-2 text-sm text-[#EAEAEA]/50">
              Soru-cevap ile sıfırdan plan veya elindeki programı yapıştır.
            </p>
            {isRetake && (
              <p className="mt-2 text-xs text-[#4ECDC4]">
                Mevcut profilin ve planın duruyor. Kaydetmeden çıkarsan hiçbir şey silinmez.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setMode("questionnaire");
              setStep(0);
            }}
            className="flex w-full items-start gap-4 rounded-2xl border border-[#FF6B35]/30 bg-[#FF6B35]/10 p-4 text-left transition hover:bg-[#FF6B35]/15"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/20 text-[#FF6B35]">
              <MessageSquare size={22} />
            </div>
            <div>
              <p className="font-semibold text-[#EAEAEA]">Soru-cevap ile oluştur</p>
              <p className="mt-1 text-sm text-[#EAEAEA]/50">
                7 adımda bilgilerini paylaş; AI sana özel plan hazırlasın.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("import")}
            className="flex w-full items-start gap-4 rounded-2xl border border-[#4ECDC4]/30 bg-[#4ECDC4]/10 p-4 text-left transition hover:bg-[#4ECDC4]/15"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#4ECDC4]/20 text-[#4ECDC4]">
              <ClipboardPaste size={22} />
            </div>
            <div>
              <p className="font-semibold text-[#EAEAEA]">Kendi programımı yapıştır</p>
              <p className="mt-1 text-sm text-[#EAEAEA]/50">
                Mevcut antrenman programını yapıştır; sorular atlanır, AI buna göre planı kurar.
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (mode === "import") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto max-w-md">
            <p className="font-medium text-[#4ECDC4]">Programı içe aktar</p>
            <p className="text-xs text-[#EAEAEA]/40">
              Soru-cevap atlandı · Minimal bilgiler + program metni
            </p>
          </div>
        </div>

        <div className="flex-1 px-4 py-6">
          <div className="mx-auto max-w-md space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="import-age">Yaş</Label>
                <Input
                  id="import-age"
                  type="number"
                  value={form.age}
                  onChange={(e) => updateForm("age", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cinsiyet</Label>
                <div className="flex gap-2">
                  {[
                    { v: "MALE", l: "Erkek" },
                    { v: "FEMALE", l: "Kadın" },
                  ].map((g) => (
                    <Button
                      key={g.v}
                      type="button"
                      variant={form.gender === g.v ? "default" : "outline"}
                      className="flex-1 rounded-xl"
                      onClick={() => updateForm("gender", g.v)}
                    >
                      {g.l}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-height">Boy (cm)</Label>
                <Input
                  id="import-height"
                  type="number"
                  value={form.height}
                  onChange={(e) => updateForm("height", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-weight">Kilo (kg)</Label>
                <Input
                  id="import-weight"
                  type="number"
                  value={form.weight}
                  onChange={(e) => updateForm("weight", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hedef</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "LOSE_WEIGHT", l: "Kilo ver" },
                  { v: "BUILD_MUSCLE", l: "Kas yap" },
                  { v: "MAINTAIN", l: "Koruma" },
                  { v: "ENDURANCE", l: "Dayanıklılık" },
                ].map((g) => (
                  <Button
                    key={g.v}
                    type="button"
                    variant={form.goal === g.v ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => updateForm("goal", g.v)}
                  >
                    {g.l}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="existing-program">Mevcut antrenman programın</Label>
              <Textarea
                id="existing-program"
                value={existingProgram}
                onChange={(e) => setExistingProgram(e.target.value)}
                placeholder={`Örnek:\nPazartesi - Göğüs\nBench Press 4x8-10\nIncline DB Press 3x10\n...\nÇarşamba - Sırt\nPull-up 4x8\n...`}
                className="min-h-[220px] rounded-xl bg-[#16213E] text-sm"
              />
              <p className="text-xs text-[#EAEAEA]/40">
                Günler, hareketler, set/tekrar yazman yeterli. AI bunu Strive formatına çevirir.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 border-t bg-background px-4 py-4">
          <div className="mx-auto flex max-w-md gap-3">
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-xl"
              onClick={() => setMode("choose")}
              disabled={loading}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Geri
            </Button>
            <Button
              className="h-12 flex-1 rounded-xl bg-[#4ECDC4] font-semibold text-[#1A1A2E] hover:bg-[#3DBDB4]"
              onClick={handleImportSubmit}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Programdan Oluştur"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto max-w-md">
          {isRetake && (
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs text-[#4ECDC4]">
                Kaydetmeden çıkarsan mevcut planın korunur
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-[#EAEAEA]/60"
                onClick={() => router.push("/dashboard")}
              >
                Vazgeç
              </Button>
            </div>
          )}
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-[#FF6B35]">
              Adım {step + 1}/{STEPS.length}
            </span>
            <span className="text-muted-foreground">{STEPS[step]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          {step === 0 && <Step1Personal form={form} updateForm={updateForm} />}
          {step === 1 && <Step2Goal form={form} updateForm={updateForm} />}
          {step === 2 && (
            <Step3Health
              form={form}
              updateForm={updateForm}
              toggleArrayItem={toggleArrayItem}
            />
          )}
          {step === 3 && <Step4Experience form={form} updateForm={updateForm} />}
          {step === 4 && (
            <Step5Equipment
              form={form}
              updateForm={updateForm}
              toggleArrayItem={toggleArrayItem}
            />
          )}
          {step === 5 && <Step6Time form={form} updateForm={updateForm} />}
          {step === 6 && <Step7Nutrition form={form} updateForm={updateForm} />}
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 border-t bg-background px-4 py-4">
        <div className="mx-auto flex max-w-md gap-3">
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-xl"
            onClick={handlePrev}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Geri
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              className="h-12 flex-1 rounded-xl bg-[#FF6B35] hover:bg-[#E55A25] shadow-lg shadow-[#FF6B35]/25"
              onClick={handleNext}
            >
              Devam
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="h-12 flex-1 rounded-xl bg-[#FF6B35] hover:bg-[#E55A25] shadow-lg shadow-[#FF6B35]/25"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Planımı Oluştur
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== STEP COMPONENTS ====================

interface StepProps {
  form: FormData;
  updateForm: (key: keyof FormData, value: unknown) => void;
  toggleArrayItem?: (key: "healthConditions" | "allergies" | "homeEquipment", item: string) => void;
}

function Step1Personal({ form, updateForm }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Kişisel Bilgilerin</h2>
        <p className="text-sm text-muted-foreground">
          Sana uygun plan için temel bilgilerini gir
        </p>
      </div>

      <div className="space-y-2">
        <Label>Cinsiyet</Label>
        <div className="grid grid-cols-2 gap-3">
          <SelectCard
            selected={form.gender === "MALE"}
            onClick={() => updateForm("gender", "MALE")}
            label="Erkek"
          />
          <SelectCard
            selected={form.gender === "FEMALE"}
            onClick={() => updateForm("gender", "FEMALE")}
            label="Kadın"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Yaş</Label>
        <Input
          id="age"
          type="number"
          value={form.age}
          onChange={(e) => updateForm("age", parseInt(e.target.value) || 0)}
          min={14}
          max={100}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="height">Boy (cm)</Label>
          <Input
            id="height"
            type="number"
            value={form.height}
            onChange={(e) =>
              updateForm("height", parseInt(e.target.value) || 0)
            }
            min={100}
            max={250}
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Kilo (kg)</Label>
          <Input
            id="weight"
            type="number"
            value={form.weight}
            onChange={(e) =>
              updateForm("weight", parseInt(e.target.value) || 0)
            }
            min={30}
            max={300}
            className="h-12 rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bodyFat">Vücut Yağ Oranı (%) - Opsiyonel</Label>
        <Input
          id="bodyFat"
          type="number"
          value={form.bodyFatPercentage || ""}
          onChange={(e) =>
            updateForm(
              "bodyFatPercentage",
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          placeholder="Bilmiyorsaniz bos birakin"
          className="h-12 rounded-xl"
        />
      </div>
    </div>
  );
}

function Step2Goal({ form, updateForm }: StepProps) {
  const goals = [
    { value: "LOSE_WEIGHT", label: "Kilo Vermek", emoji: "🏃" },
    { value: "BUILD_MUSCLE", label: "Kas Yapmak", emoji: "💪" },
    { value: "MAINTAIN", label: "Formu Korumak", emoji: "⚡" },
    { value: "ENDURANCE", label: "Dayanıklılığı Artırmak", emoji: "🔥" },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Hedefin Ne?</h2>
        <p className="text-sm text-muted-foreground">Ana hedefini sec</p>
      </div>

      <div className="space-y-3">
        {goals.map((g) => (
          <SelectCard
            key={g.value}
            selected={form.goal === g.value}
            onClick={() => updateForm("goal", g.value)}
            label={`${g.emoji} ${g.label}`}
            full
          />
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetWeight">Hedef Kilo (kg) - Opsiyonel</Label>
        <Input
          id="targetWeight"
          type="number"
          value={form.targetWeight || ""}
          onChange={(e) =>
            updateForm(
              "targetWeight",
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          placeholder="Bos birakabilirsiniz"
          className="h-12 rounded-xl"
        />
      </div>
    </div>
  );
}

function Step3Health({ form, updateForm, toggleArrayItem }: StepProps) {
  const conditions = ["Diyabet", "Tansiyon", "Kalp", "Astim", "Diğer"];
  const allergyOptions = [
    "Laktoz",
    "Gluten",
    "Fistik",
    "Yumurta",
    "Deniz Urunleri",
    "Diğer",
  ];
  const diets = [
    { value: "NORMAL", label: "Normal" },
    { value: "VEGETARIAN", label: "Vejetaryen" },
    { value: "VEGAN", label: "Vegan" },
    { value: "KETO", label: "Ketojenik" },
    { value: "OTHER", label: "Diğer" },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Sağlık Durumun</h2>
        <p className="text-sm text-muted-foreground">
          Guvenligin için onemli bilgiler
        </p>
      </div>

      <div className="space-y-3">
        <Label>Kronik Hastalik</Label>
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => (
            <ChipToggle
              key={c}
              label={c}
              selected={form.healthConditions.includes(c)}
              onClick={() => toggleArrayItem!("healthConditions", c)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Gida Alerjisi / Intoleransi</Label>
        <div className="flex flex-wrap gap-2">
          {allergyOptions.map((a) => (
            <ChipToggle
              key={a}
              label={a}
              selected={form.allergies.includes(a)}
              onClick={() => toggleArrayItem!("allergies", a)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="injuries">
          Sakatlık / Kişitlama - Opsiyonel
        </Label>
        <Input
          id="injuries"
          value={form.injuries || ""}
          onChange={(e) =>
            updateForm("injuries", e.target.value || null)
          }
          placeholder="Örneğin: Bel fitigi, diz problemi..."
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-3">
        <Label>Diyet Tercihi</Label>
        <div className="grid grid-cols-2 gap-2">
          {diets.map((d) => (
            <SelectCard
              key={d.value}
              selected={form.dietPreference === d.value}
              onClick={() => updateForm("dietPreference", d.value)}
              label={d.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4Experience({ form, updateForm }: StepProps) {
  const levels = [
    {
      value: "BEGINNER",
      label: "Başlangıç",
      desc: "Spor yapmaya yeni başlıyorum veya düzensiz yapıyorum",
    },
    {
      value: "INTERMEDIATE",
      label: "Orta Seviye",
      desc: "6+ aydır düzenli spor yapıyorum",
    },
    {
      value: "ADVANCED",
      label: "İleri Seviye",
      desc: "1+ yıldır düzenli ve yoğun spor yapıyorum",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Spor Gecmisin</h2>
        <p className="text-sm text-muted-foreground">
          Deneyim seviyeni belirleyelim
        </p>
      </div>

      <div className="space-y-3">
        {levels.map((l) => (
          <Card
            key={l.value}
            className={`cursor-pointer transition-all ${
              form.experienceLevel === l.value
          ? "border-[#FF6B35] bg-[#FF6B35]/10"
                    : "hover:border-[#FF6B35]/30"
            }`}
            onClick={() => updateForm("experienceLevel", l.value)}
          >
            <CardContent className="p-4">
              <div className="font-semibold">{l.label}</div>
              <div className="text-sm text-muted-foreground">{l.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Step5Equipment({ form, updateForm, toggleArrayItem }: StepProps) {
  const equipment = [
    "Dambil",
    "Barfiks Cubugu",
    "Direnc Bandi",
    "Bench",
    "Halat",
    "Kettlebell",
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Ekipman Erişimin</h2>
        <p className="text-sm text-muted-foreground">
          Hangi ekipmanlara erişiminiz var?
        </p>
      </div>

      <div className="space-y-3">
        <Label>Spor Salonu Uyeligin Var mi?</Label>
        <div className="grid grid-cols-2 gap-3">
          <SelectCard
            selected={form.hasGymAccess}
            onClick={() => updateForm("hasGymAccess", true)}
            label="Evet"
          />
          <SelectCard
            selected={!form.hasGymAccess}
            onClick={() => updateForm("hasGymAccess", false)}
            label="Hayır"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Evde Ekipman</Label>
        <div className="flex flex-wrap gap-2">
          {equipment.map((e) => (
            <ChipToggle
              key={e}
              label={e}
              selected={form.homeEquipment.includes(e)}
              onClick={() => toggleArrayItem!("homeEquipment", e)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="bodyweightOnly"
          checked={form.bodyweightOnly}
          onCheckedChange={(checked) =>
            updateForm("bodyweightOnly", !!checked)
          }
        />
        <Label htmlFor="bodyweightOnly" className="cursor-pointer">
          Sadece vücut ağırlığı ile calismayi tercih ederim
        </Label>
      </div>
    </div>
  );
}

function Step6Time({ form, updateForm }: StepProps) {
  const durations = [15, 30, 45, 60, 90];
  const times = [
    { value: "MORNING", label: "Sabah" },
    { value: "NOON", label: "Öğle" },
    { value: "EVENING", label: "Akşam" },
    { value: "ANY", label: "Farketmez" },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Zaman Planın</h2>
        <p className="text-sm text-muted-foreground">
          Haftada ne kadar zaman ayirabilirsin?
        </p>
      </div>

      <div className="space-y-3">
        <Label>Haftada Kac Gun Spor Yapabilirsin?</Label>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <button
              key={d}
              onClick={() => updateForm("daysPerWeek", d)}
              className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium transition-all ${
                form.daysPerWeek === d
                  ? "bg-[#FF6B35] text-white"
                  : "bg-muted text-muted-foreground hover:bg-[#FF6B35]/20"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Gunde Kac Dakika?</Label>
        <div className="flex flex-wrap justify-center gap-2">
          {durations.map((d) => (
            <SelectCard
              key={d}
              selected={form.minutesPerDay === d}
              onClick={() => updateForm("minutesPerDay", d)}
              label={`${d} dk`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Tercih Ettigin Zaman</Label>
        <div className="grid grid-cols-2 gap-2">
          {times.map((t) => (
            <SelectCard
              key={t.value}
              selected={form.preferredTime === t.value}
              onClick={() => updateForm("preferredTime", t.value)}
              label={t.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step7Nutrition({ form, updateForm }: StepProps) {
  const budgets = [
    { value: "LOW", label: "Düşük" },
    { value: "MEDIUM", label: "Orta" },
    { value: "HIGH", label: "Yüksek" },
  ];
  const waterHabits = [
    { value: "LOW", label: "Az" },
    { value: "MEDIUM", label: "Orta" },
    { value: "GOOD", label: "Iyi" },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Beslenme Alışkanlıklarin</h2>
        <p className="text-sm text-muted-foreground">
          Beslenme planıni kişisellestirelim
        </p>
      </div>

      <div className="space-y-3">
        <Label>Gunde Kac Öğün Yiyorsun?</Label>
        <div className="flex justify-center gap-2">
          {[2, 3, 4, 5].map((m) => (
            <SelectCard
              key={m}
              selected={form.mealsPerDay === m}
              onClick={() => updateForm("mealsPerDay", m)}
              label={`${m}`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="hasSnacks"
          checked={form.hasSnacks}
          onCheckedChange={(checked) => updateForm("hasSnacks", !!checked)}
        />
        <Label htmlFor="hasSnacks" className="cursor-pointer">
          Ara öğün yapıyorum
        </Label>
      </div>

      <div className="space-y-3">
        <Label>Genelde Nerede Yiyorsun?</Label>
        <div className="grid grid-cols-2 gap-3">
          <SelectCard
            selected={form.eatsAtHome}
            onClick={() => updateForm("eatsAtHome", true)}
            label="Evde"
          />
          <SelectCard
            selected={!form.eatsAtHome}
            onClick={() => updateForm("eatsAtHome", false)}
            label="Dışarıda"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Yemek Bütçen</Label>
        <div className="grid grid-cols-3 gap-2">
          {budgets.map((b) => (
            <SelectCard
              key={b.value}
              selected={form.budget === b.value}
              onClick={() => updateForm("budget", b.value)}
              label={b.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Su İçme Alışkanlığın</Label>
        <div className="grid grid-cols-3 gap-2">
          {waterHabits.map((w) => (
            <SelectCard
              key={w.value}
              selected={form.waterHabit === w.value}
              onClick={() => updateForm("waterHabit", w.value)}
              label={w.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== UI HELPERS ====================

function SelectCard({
  selected,
  onClick,
  label,
  full,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
        full ? "w-full text-left" : ""
      } ${
        selected
          ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
          : "border-border hover:border-[#FF6B35]/30"
      }`}
    >
      {label}
    </button>
  );
}

function ChipToggle({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
        selected
          ? "border-[#FF6B35] bg-[#FF6B35]/15 text-[#FF6B35]"
          : "border-border text-muted-foreground hover:border-[#FF6B35]/30"
      }`}
    >
      {label}
    </button>
  );
}

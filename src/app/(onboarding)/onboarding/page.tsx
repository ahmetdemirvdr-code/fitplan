"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const STEPS = [
  "Kisisel Bilgiler",
  "Hedef",
  "Saglik Durumu",
  "Spor Gecmisi",
  "Ekipman",
  "Zaman",
  "Beslenme",
];

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
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

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
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Save profile
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

      toast.success("Profil kaydedildi! Plan olusturuluyor...");
      setGeneratingPlan(true);

      // Generate fitness plan
      const planRes = await fetch("/api/plan/generate", {
        method: "POST",
      });

      if (!planRes.ok) {
        toast.error("Plan olusturulamadi. Dashboard'dan tekrar deneyebilirsiniz.");
        router.push("/dashboard");
        return;
      }

      toast.success("Planin hazir!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Bir hata olustu");
    } finally {
      setLoading(false);
      setGeneratingPlan(false);
    }
  };

  if (generatingPlan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Sparkles className="h-10 w-10 text-green-600 animate-pulse" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Planin Hazirlaniyor</h2>
          <p className="text-muted-foreground">
            AI sana ozel spor ve beslenme plani olusturuyor...
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Bu islem 15-30 saniye surebilir
          </p>
          <Loader2 className="mx-auto mt-6 h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-green-600">
              Adim {step + 1}/{STEPS.length}
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
          {step > 0 && (
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-xl"
              onClick={handlePrev}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Geri
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              className="h-12 flex-1 rounded-xl bg-green-600 hover:bg-green-700"
              onClick={handleNext}
            >
              Devam
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="h-12 flex-1 rounded-xl bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Planimi Olustur
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
        <h2 className="text-xl font-bold">Kisisel Bilgilerin</h2>
        <p className="text-sm text-muted-foreground">
          Sana uygun plan icin temel bilgilerini gir
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
            label="Kadin"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Yas</Label>
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
        <Label htmlFor="bodyFat">Vucut Yag Orani (%) - Opsiyonel</Label>
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
    { value: "ENDURANCE", label: "Dayanikliligi Artirmak", emoji: "🔥" },
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
  const conditions = ["Diyabet", "Tansiyon", "Kalp", "Astim", "Diger"];
  const allergyOptions = [
    "Laktoz",
    "Gluten",
    "Fistik",
    "Yumurta",
    "Deniz Urunleri",
    "Diger",
  ];
  const diets = [
    { value: "NORMAL", label: "Normal" },
    { value: "VEGETARIAN", label: "Vejetaryen" },
    { value: "VEGAN", label: "Vegan" },
    { value: "KETO", label: "Ketojenik" },
    { value: "OTHER", label: "Diger" },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Saglik Durumun</h2>
        <p className="text-sm text-muted-foreground">
          Guvenligin icin onemli bilgiler
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
          Sakatlik / Kisitlama - Opsiyonel
        </Label>
        <Input
          id="injuries"
          value={form.injuries || ""}
          onChange={(e) =>
            updateForm("injuries", e.target.value || null)
          }
          placeholder="Ornegin: Bel fitigi, diz problemi..."
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
      label: "Baslangic",
      desc: "Spor yapmaya yeni basliyorum veya duzensiz yapiyorum",
    },
    {
      value: "INTERMEDIATE",
      label: "Orta Seviye",
      desc: "6+ aydir duzenli spor yapiyorum",
    },
    {
      value: "ADVANCED",
      label: "Ileri Seviye",
      desc: "1+ yildir duzenli ve yogun spor yapiyorum",
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
                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                : "hover:border-green-200"
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
        <h2 className="text-xl font-bold">Ekipman Erisimin</h2>
        <p className="text-sm text-muted-foreground">
          Hangi ekipmanlara erisiminiz var?
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
            label="Hayir"
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
          Sadece vucut agirligi ile calismayi tercih ederim
        </Label>
      </div>
    </div>
  );
}

function Step6Time({ form, updateForm }: StepProps) {
  const durations = [15, 30, 45, 60, 90];
  const times = [
    { value: "MORNING", label: "Sabah" },
    { value: "NOON", label: "Ogle" },
    { value: "EVENING", label: "Aksam" },
    { value: "ANY", label: "Farketmez" },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Zaman Planin</h2>
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
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-green-100"
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
    { value: "LOW", label: "Dusuk" },
    { value: "MEDIUM", label: "Orta" },
    { value: "HIGH", label: "Yuksek" },
  ];
  const waterHabits = [
    { value: "LOW", label: "Az" },
    { value: "MEDIUM", label: "Orta" },
    { value: "GOOD", label: "Iyi" },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Beslenme Aliskanliklarin</h2>
        <p className="text-sm text-muted-foreground">
          Beslenme planini kisisellestirelim
        </p>
      </div>

      <div className="space-y-3">
        <Label>Gunde Kac Ogun Yiyorsun?</Label>
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
          Ara ogun yapiyorum
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
            label="Disarida"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Yemek Butcen</Label>
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
        <Label>Su Icme Aliskanlgin</Label>
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
          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
          : "border-border hover:border-green-200"
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
          ? "border-green-500 bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
          : "border-border text-muted-foreground hover:border-green-200"
      }`}
    >
      {label}
    </button>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dumbbell,
  Check,
  Clock,
  Coffee,
  Loader2,
  Trophy,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  Target,
  CalendarDays,
  Lock,
  Info,
  AlertTriangle,
  Wrench,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ExerciseIllustration,
  splitHowTo,
} from "@/components/workout/exercise-illustration";
import { getPlanWeekNumber, resolvePhaseWeekNumber } from "@/lib/plan-week";

interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  sets: number;
  reps: string;
  weight: string | null;
  restSeconds: number;
  description: string;
  gifUrl: string | null;
  order: number;
}

interface WorkoutDay {
  id: string;
  dayOfWeek: number;
  weekNumber: number;
  name: string;
  isRestDay: boolean;
  exercises: Exercise[];
}

const DAY_META = [
  { dayOfWeek: 1, short: "Pzt", full: "Pazartesi" },
  { dayOfWeek: 2, short: "Sal", full: "Salı" },
  { dayOfWeek: 3, short: "Çar", full: "Çarşamba" },
  { dayOfWeek: 4, short: "Per", full: "Perşembe" },
  { dayOfWeek: 5, short: "Cum", full: "Cuma" },
  { dayOfWeek: 6, short: "Cmt", full: "Cumartesi" },
  { dayOfWeek: 7, short: "Paz", full: "Pazar" },
];

function toPlanDow(date: Date) {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

type GuideData = {
  steps: string[];
  tips: string[];
  commonMistakes: string[];
  targetMuscle: string | null;
  equipment: string | null;
  cached: boolean;
};

function ExerciseDetails({ exercise }: { exercise: Exercise }) {
  const fallbackSteps = splitHowTo(exercise.description);
  const [guide, setGuide] = useState<GuideData | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadGuide() {
      setLoadingGuide(true);
      try {
        const params = new URLSearchParams({
          nameEn: exercise.nameEn || exercise.name,
          name: exercise.name,
        });
        const res = await fetch(`/api/exercises/guide?${params}`);
        if (!res.ok) throw new Error("guide failed");
        const data = await res.json();
        if (!cancelled) {
          setGuide({
            steps: data.steps || [],
            tips: data.tips || [],
            commonMistakes: data.commonMistakes || [],
            targetMuscle: data.targetMuscle || null,
            equipment: data.equipment || null,
            cached: !!data.cached,
          });
        }
      } catch {
        if (!cancelled) setGuide(null);
      } finally {
        if (!cancelled) setLoadingGuide(false);
      }
    }
    loadGuide();
    return () => {
      cancelled = true;
    };
  }, [exercise.nameEn, exercise.name]);

  const steps = guide?.steps?.length ? guide.steps : fallbackSteps;

  return (
    <div className="mt-4 space-y-4">
      {exercise.gifUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={exercise.gifUrl}
          alt={exercise.name}
          className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg shadow-black/30"
          loading="lazy"
        />
      ) : (
        <ExerciseIllustration
          nameEn={exercise.nameEn}
          name={exercise.name}
          alt={exercise.name}
          className="aspect-[4/3] w-full rounded-2xl shadow-lg shadow-black/30"
        />
      )}

      <div className="flex flex-wrap gap-2">
        {exercise.nameEn && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6B35]/15 px-2.5 py-1 text-[11px] font-medium text-[#FF6B35]">
            <Target size={12} />
            {exercise.nameEn}
          </span>
        )}
        {guide?.targetMuscle && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#a29bfe]/15 px-2.5 py-1 text-[11px] font-medium text-[#a29bfe]">
            {guide.targetMuscle}
          </span>
        )}
        {guide?.equipment && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#4ECDC4]/15 px-2.5 py-1 text-[11px] font-medium text-[#4ECDC4]">
            <Wrench size={12} />
            {guide.equipment}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFE66D]/15 px-2.5 py-1 text-[11px] font-medium text-[#FFE66D]">
          <Coffee size={12} />
          Dinlenme {exercise.restSeconds || 60} sn
        </span>
        {exercise.weight && (
          <span className="inline-flex items-center rounded-full bg-[#4ECDC4]/15 px-2.5 py-1 text-[11px] font-medium text-[#4ECDC4]">
            {exercise.weight}
          </span>
        )}
      </div>

      {loadingGuide && (
        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#1A1A2E] px-3 py-3 text-sm text-[#EAEAEA]/50">
          <Loader2 size={16} className="animate-spin text-[#FF6B35]" />
          Detaylı anlatım hazırlanıyor…
        </div>
      )}

      {steps.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-[#1A1A2E] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#EAEAEA]/40">
              <ListOrdered size={13} />
              Nasıl yapılır?
            </div>
            {guide && !loadingGuide && (
              <span className="text-[10px] text-[#EAEAEA]/30">
                {guide.cached ? "Kayıtlı rehber" : "Yeni oluşturuldu"}
              </span>
            )}
          </div>
          <ol className="space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-[#EAEAEA]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6B35]/15 text-[11px] font-bold text-[#FF6B35]">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!!guide?.tips?.length && (
        <div className="rounded-xl border border-[#4ECDC4]/25 bg-[#4ECDC4]/10 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#4ECDC4]">
            <Info size={13} />
            İpuçları
          </div>
          <ul className="space-y-1.5">
            {guide.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-[#EAEAEA]/85">
                <span className="text-[#FFE66D]">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!guide?.commonMistakes?.length && (
        <div className="rounded-xl border border-[#E74C3C]/25 bg-[#E74C3C]/10 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#E74C3C]">
            <AlertTriangle size={13} />
            Yaygın hatalar
          </div>
          <ul className="space-y-1.5">
            {guide.commonMistakes.map((mistake, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-[#EAEAEA]/85">
                <span className="text-[#E74C3C]">•</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function WorkoutPage() {
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [planMeta, setPlanMeta] = useState<{
    createdAt: string;
    durationWeeks: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDow, setSelectedDow] = useState<number>(() => toPlanDow(new Date()));
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  const today = useMemo(() => startOfToday(), []);
  const todayDow = toPlanDow(today);

  const { planWeek, phaseWeek, phaseLabel } = useMemo(() => {
    if (!planMeta) {
      return { planWeek: 1, phaseWeek: 1, phaseLabel: "Faz 1" };
    }
    const pw = Math.min(
      getPlanWeekNumber(new Date(planMeta.createdAt), today),
      planMeta.durationWeeks || 12
    );
    const ph = resolvePhaseWeekNumber(
      workoutDays.map((d) => d.weekNumber),
      pw
    );
    const unique = [...new Set(workoutDays.map((d) => d.weekNumber))].sort(
      (a, b) => a - b
    );
    const phaseIndex = Math.max(0, unique.indexOf(ph)) + 1;
    return {
      planWeek: pw,
      phaseWeek: ph,
      phaseLabel: `Faz ${phaseIndex}`,
    };
  }, [planMeta, workoutDays, today]);

  const weekSessions = useMemo(() => {
    const monday = new Date(today);
    const diff = todayDow === 7 ? -6 : 1 - todayDow;
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    return DAY_META.map((day) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + (day.dayOfWeek - 1));
      date.setHours(0, 0, 0, 0);

      const planDay =
        workoutDays.find(
          (d) => d.dayOfWeek === day.dayOfWeek && d.weekNumber === phaseWeek
        ) || null;

      const isTodaySession = day.dayOfWeek === todayDow;
      const isPast = date.getTime() < today.getTime();

      return {
        ...day,
        date,
        planDay,
        isToday: isTodaySession,
        isPast,
        canTrain: isTodaySession && !!planDay && !planDay.isRestDay,
      };
    });
  }, [workoutDays, today, todayDow, phaseWeek]);

  const selected = weekSessions.find((s) => s.dayOfWeek === selectedDow) || weekSessions[0];
  const selectedDay = selected?.planDay;
  const isActiveSession = !!selected?.canTrain;
  const isPreview = !isActiveSession;

  const loadData = useCallback(async () => {
    try {
      const [planRes, todayRes] = await Promise.all([
        fetch("/api/plan/active"),
        fetch("/api/workout/today"),
      ]);

      if (planRes.ok) {
        const plan = await planRes.json();
        setWorkoutDays(plan.workoutDays || []);
        setPlanMeta({
          createdAt: plan.createdAt,
          durationWeeks: plan.durationWeeks || 12,
        });
      }

      if (todayRes.ok) {
        const data = await todayRes.json();
        if (data.workoutLog) {
          const completed = new Set<string>(
            (data.workoutLog.exerciseLogs || [])
              .filter((l: { isCompleted: boolean }) => l.isCompleted)
              .map((l: { exerciseId: string }) => l.exerciseId)
          );
          setCompletedExercises(completed);
          setWorkoutCompleted(!!data.workoutLog.isCompleted);
        }
      }
    } catch (err) {
      console.error("Workout fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedDay || selectedDay.isRestDay || !selectedDay.exercises.length) {
      setExpandedExercise(null);
      return;
    }
    const firstOpen =
      isActiveSession
        ? selectedDay.exercises.find((ex) => !completedExercises.has(ex.id))
        : selectedDay.exercises[0];
    setExpandedExercise(firstOpen?.id ?? selectedDay.exercises[0].id);
    // Only re-run when day changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDow, selectedDay?.id]);

  const toggleExercise = (exerciseId: string) => {
    if (!isActiveSession || workoutCompleted) return;
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  };

  const completeWorkout = async () => {
    if (!selectedDay || !isActiveSession) return;
    setSaving(true);

    try {
      const exerciseLogs = selectedDay.exercises.map((ex) => ({
        exerciseId: ex.id,
        setNumber: ex.sets,
        reps: parseInt(ex.reps) || 0,
        weight: null,
        isCompleted: completedExercises.has(ex.id),
      }));

      const res = await fetch("/api/workout/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutDayId: selectedDay.id,
          exerciseLogs,
        }),
      });

      if (res.ok) {
        setWorkoutCompleted(true);
        toast.success("Antrenman tamamlandı! Harika iş!");
      } else {
        toast.error("Kayıt sırasında hata oluştu");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  if (!workoutDays.length) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Plan Bulunamadı</h2>
        <p className="text-muted-foreground">Henüz bir antrenman planın yok.</p>
      </div>
    );
  }

  const todaySession = weekSessions.find((s) => s.isToday);
  const todayIsRest = !todaySession?.planDay || todaySession.planDay.isRestDay;
  const nextUpcoming = weekSessions.find((s) => !s.isPast && !s.isToday && s.planDay && !s.planDay.isRestDay);

  if (isActiveSession && workoutCompleted) {
    return (
      <div className="px-5 py-6">
        <div className="mx-auto max-w-lg space-y-5">
          <WeekPicker
            sessions={weekSessions}
            selectedDow={selectedDow}
            onSelect={setSelectedDow}
          />
          <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#FF6B35]/20">
              <Trophy className="h-10 w-10 text-[#FF6B35]" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Harika İş!</h2>
            <p className="text-muted-foreground">
              Bugünün antrenmanı tamamlandı. İstersen diğer günleri üstten önizle.
            </p>
            <div className="mt-4">
              <Badge variant="secondary" className="text-[#FF6B35]">
                {completedExercises.size} / {selectedDay?.exercises.length || 0} hareket
                tamamlandı
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6">
      <div className="mx-auto max-w-lg space-y-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-[#FF6B35]/20 text-[#FF6B35] hover:bg-[#FF6B35]/20">
              {phaseLabel}
            </Badge>
            <Badge variant="secondary">Hafta {planWeek}</Badge>
          </div>
          <h1 className="text-2xl font-bold">
            {todayIsRest ? "Antrenman Programı" : "Bugünün Antrenmanı"}
          </h1>
          <p className="mt-1 text-sm text-[#EAEAEA]/40">
            Haftanın diğer günlerini de görebilirsin; kayıt sadece bugün açılır.
          </p>
        </div>

        <WeekPicker
          sessions={weekSessions}
          selectedDow={selectedDow}
          onSelect={setSelectedDow}
        />

        {selected?.isToday && todayIsRest && (
          <Card>
            <CardContent className="py-6 text-center">
              <div className="mb-2 text-4xl">😌</div>
              <h2 className="mb-1 text-lg font-bold text-[#4ECDC4]">Dinlenme Günü</h2>
              <p className="text-sm text-[#EAEAEA]/50">
                Kasların toparlanıyor. İstersen yaklaşan antrenmanı üstten seçip önizle.
              </p>
              {nextUpcoming && (
                <p className="mt-3 text-xs text-[#FFE66D]">
                  Sıradaki: {nextUpcoming.full} · {formatShortDate(nextUpcoming.date)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {selectedDay && !selectedDay.isRestDay && (
          <>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#FF6B35]/15 px-3 py-1 text-sm font-medium text-[#FF6B35]">
                  {selected.full}
                </span>
                <span className="rounded-full bg-[#FF6B35]/15 px-3 py-1 text-sm font-medium text-[#FF6B35]">
                  {selectedDay.name}
                </span>
                <span className="flex items-center gap-1 text-sm text-[#EAEAEA]/40">
                  <Clock size={14} />
                  {selectedDay.exercises.length} hareket
                </span>
              </div>

              {isPreview && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#FFE66D]/20 bg-[#FFE66D]/10 px-3 py-2 text-xs text-[#FFE66D]">
                  <Lock size={14} className="mt-0.5 shrink-0" />
                  <span>
                    {selected.isPast
                      ? "Geçmiş gün önizlemesi. Kayıt yalnızca bugünün antrenmanında açılır."
                      : `Bu gün için önizleme. Antrenmanı işaretlemek ${selected.full} günü geldiğinde açılır.`}
                  </span>
                </div>
              )}

              {isActiveSession && (
                <Progress
                  value={
                    selectedDay.exercises.length
                      ? (completedExercises.size / selectedDay.exercises.length) * 100
                      : 0
                  }
                  className="mt-3 h-2.5"
                />
              )}
            </div>

            <div className="space-y-3">
              {selectedDay.exercises.map((exercise, idx) => {
                const isCompleted = isActiveSession && completedExercises.has(exercise.id);
                const isExpanded = expandedExercise === exercise.id;

                return (
                  <Card
                    key={exercise.id}
                    className={`overflow-hidden transition-all ${
                      isCompleted ? "border-[#FF6B35]/30 bg-[#FF6B35]/10" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {isActiveSession ? (
                          <button
                            type="button"
                            onClick={() => toggleExercise(exercise.id)}
                            className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                              isCompleted
                                ? "border-[#FF6B35] bg-[#FF6B35] text-white"
                                : "border-[#EAEAEA]/30"
                            }`}
                          >
                            {isCompleted && <Check className="h-4 w-4" />}
                          </button>
                        ) : (
                          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#EAEAEA]/15 text-[11px] font-bold text-[#EAEAEA]/40">
                            {idx + 1}
                          </div>
                        )}

                        <ExerciseIllustration
                          nameEn={exercise.nameEn}
                          name={exercise.name}
                          alt={exercise.name}
                          className="h-16 w-16 rounded-xl"
                        />

                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            className="flex w-full items-start justify-between gap-2 text-left"
                            onClick={() =>
                              setExpandedExercise(isExpanded ? null : exercise.id)
                            }
                          >
                            <div>
                              <h3
                                className={`font-semibold ${
                                  isCompleted ? "text-[#FF6B35] line-through" : ""
                                }`}
                              >
                                {exercise.name}
                              </h3>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                <Badge variant="secondary" className="text-xs">
                                  {exercise.sets} set × {exercise.reps}
                                </Badge>
                                {exercise.weight && (
                                  <Badge variant="outline" className="text-xs">
                                    {exercise.weight}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  <Coffee className="mr-1 h-3 w-3" />
                                  {exercise.restSeconds}s dinlenme
                                </Badge>
                              </div>
                            </div>
                            <span className="mt-1 text-[#EAEAEA]/40">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </span>
                          </button>

                          {isExpanded && <ExerciseDetails exercise={exercise} />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {isActiveSession && (
              <Button
                className="h-14 w-full rounded-xl bg-[#FF6B35] text-lg font-semibold shadow-lg shadow-[#FF6B35]/25 hover:bg-[#E55A25]"
                onClick={completeWorkout}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Antrenmanı Tamamla
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {selectedDay?.isRestDay && !selected.isToday && (
          <Card>
            <CardContent className="py-6 text-center">
              <div className="mb-2 text-4xl">😴</div>
              <h2 className="mb-1 text-lg font-bold text-[#4ECDC4]">
                {selected.full} — Dinlenme
              </h2>
              <p className="text-sm text-[#EAEAEA]/50">
                Bu günde antrenman yok. Başka bir gün seçerek programını inceleyebilirsin.
              </p>
            </CardContent>
          </Card>
        )}

        {!selectedDay && (
          <Card>
            <CardContent className="py-6 text-center text-sm text-[#EAEAEA]/50">
              Bu gün için planlanmış antrenman yok.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function WeekPicker({
  sessions,
  selectedDow,
  onSelect,
}: {
  sessions: Array<{
    dayOfWeek: number;
    short: string;
    date: Date;
    isToday: boolean;
    isPast: boolean;
    planDay: WorkoutDay | null;
  }>;
  selectedDow: number;
  onSelect: (dow: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#16213E] p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#EAEAEA]/35">
        <CalendarDays size={14} />
        Bu haftanın antrenmanları
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {sessions.map((session) => {
          const active = selectedDow === session.dayOfWeek;
          const hasWorkout = !!session.planDay && !session.planDay.isRestDay;
          return (
            <button
              key={session.dayOfWeek}
              type="button"
              onClick={() => onSelect(session.dayOfWeek)}
              className="rounded-xl px-1.5 py-3 text-center transition"
              style={{
                backgroundColor: active ? "#FF6B3522" : "#1A1A2E",
                border: active ? "1px solid #FF6B35" : "1px solid #EAEAEA11",
              }}
            >
              <p
                className="text-sm font-bold"
                style={{ color: active ? "#FF6B35" : "#EAEAEA" }}
              >
                {session.short}
              </p>
              <p className="mt-0.5 text-[10px] text-[#EAEAEA]/35">
                {formatShortDate(session.date)}
              </p>
              {session.isToday ? (
                <p className="mt-1 text-[10px] font-semibold text-[#4ECDC4]">Bugün</p>
              ) : session.isPast ? (
                <p className="mt-1 text-[10px] text-[#EAEAEA]/25">Geçti</p>
              ) : hasWorkout ? (
                <p className="mt-1 text-[10px] text-[#FFE66D]">Yaklaşan</p>
              ) : (
                <p className="mt-1 text-[10px] text-[#EAEAEA]/25">Dinlenme</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-full bg-[#1A1A2E] ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: "linear-gradient(90deg, #FF6B35, #FFE66D)",
        }}
      />
    </div>
  );
}

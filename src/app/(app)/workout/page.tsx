"use client";

import { useEffect, useState } from "react";
import {
  Dumbbell,
  Check,
  Clock,
  Loader2,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

interface WorkoutData {
  id: string;
  isRestDay: boolean;
  name: string;
  exercises: Exercise[];
  workoutLog?: {
    isCompleted: boolean;
    exerciseLogs: Array<{
      exerciseId: string;
      isCompleted: boolean;
    }>;
  } | null;
}

export default function WorkoutPage() {
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set()
  );
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  useEffect(() => {
    async function fetchWorkout() {
      try {
        const res = await fetch("/api/workout/today");
        if (res.ok) {
          const data = await res.json();
          setWorkout(data);

          // Restore completed exercises from log
          if (data.workoutLog?.exerciseLogs) {
            const completed = new Set<string>(
              data.workoutLog.exerciseLogs
                .filter((l: { isCompleted: boolean }) => l.isCompleted)
                .map((l: { exerciseId: string }) => l.exerciseId)
            );
            setCompletedExercises(completed);
          }
          if (data.workoutLog?.isCompleted) {
            setWorkoutCompleted(true);
          }
        }
      } catch (err) {
        console.error("Workout fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkout();
  }, []);

  const toggleExercise = (exerciseId: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const completeWorkout = async () => {
    if (!workout) return;
    setSaving(true);

    try {
      const exerciseLogs = workout.exercises.map((ex) => ({
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
          workoutDayId: workout.id,
          exerciseLogs,
        }),
      });

      if (res.ok) {
        setWorkoutCompleted(true);
        toast.success("Antrenman tamamlandi! Harika is!");
      } else {
        toast.error("Kayit sirasinda hata olustu");
      }
    } catch {
      toast.error("Bir hata olustu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Plan Bulunamadi</h2>
        <p className="text-muted-foreground">
          Henuz bir antrenman planin yok.
        </p>
      </div>
    );
  }

  if (workout.isRestDay) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-6xl">😴</div>
        <h2 className="text-xl font-bold">Dinlenme Gunu</h2>
        <p className="text-muted-foreground">
          Bugun dinlenme gunu. Kaslarinin toparlanmasina izin ver, bol su ic
          ve iyi uyu!
        </p>
      </div>
    );
  }

  if (workoutCompleted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <Trophy className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="mb-2 text-xl font-bold">Harika Is!</h2>
        <p className="text-muted-foreground">
          Bugunun antrenmani tamamlandi. Kendini harika hissetmelisin!
        </p>
        <div className="mt-4">
          <Badge variant="secondary" className="text-green-600">
            {completedExercises.size} / {workout.exercises.length} hareket
            tamamlandi
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{workout.name}</h1>
          <p className="text-muted-foreground">
            {workout.exercises.length} hareket - {completedExercises.size}{" "}
            tamamlandi
          </p>
          <Progress
            value={
              (completedExercises.size / workout.exercises.length) * 100
            }
            className="mt-2 h-2"
          />
        </div>

        {/* Exercise List */}
        <div className="space-y-3">
          {workout.exercises.map((exercise, idx) => {
            const isCompleted = completedExercises.has(exercise.id);
            const isExpanded = expandedExercise === exercise.id;

            return (
              <Card
                key={exercise.id}
                className={`transition-all ${
                  isCompleted
                    ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/10"
                    : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleExercise(exercise.id)}
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isCompleted
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isCompleted && <Check className="h-4 w-4" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3
                            className={`font-semibold ${
                              isCompleted
                                ? "text-green-700 line-through dark:text-green-400"
                                : ""
                            }`}
                          >
                            {idx + 1}. {exercise.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {exercise.sets} set x {exercise.reps}
                            </Badge>
                            {exercise.weight && (
                              <Badge variant="outline" className="text-xs">
                                {exercise.weight}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              <Clock className="mr-1 h-3 w-3" />
                              {exercise.restSeconds}s dinlenme
                            </Badge>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setExpandedExercise(
                              isExpanded ? null : exercise.id
                            )
                          }
                          className="text-muted-foreground"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      {/* Expanded Description */}
                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {exercise.gifUrl && (
                            <img
                              src={exercise.gifUrl}
                              alt={exercise.name}
                              className="w-full rounded-lg"
                              loading="lazy"
                            />
                          )}
                          <p className="text-sm text-muted-foreground">
                            {exercise.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Complete Button */}
        <div className="mt-6">
          <Button
            className="w-full h-14 rounded-xl bg-green-600 hover:bg-green-700 text-lg font-semibold"
            onClick={completeWorkout}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Antrenmani Tamamla
              </>
            )}
          </Button>
        </div>
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
    <div className={`overflow-hidden rounded-full bg-muted ${className}`}>
      <div
        className="h-full rounded-full bg-green-600 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

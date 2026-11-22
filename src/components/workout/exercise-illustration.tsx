"use client";

const PHOTO_BY_KEY: Record<string, string> = {
  curl: "/exercises/curl.jpg",
  press: "/exercises/press.jpg",
  row: "/exercises/row.jpg",
  fly: "/exercises/fly.jpg",
  lateral_raise: "/exercises/lateral.jpg",
  tricep: "/exercises/tricep.jpg",
  pullover: "/exercises/pullover.jpg",
  pushup: "/exercises/pushup.jpg",
  wall_pushup: "/exercises/wall-pushup.jpg",
  squat: "/exercises/squat.jpg",
  goblet: "/exercises/goblet.jpg",
  bridge: "/exercises/bridge.jpg",
  calf: "/exercises/calf.jpg",
  plank: "/exercises/plank.jpg",
  dead_bug: "/exercises/deadbug.jpg",
  rdl: "/exercises/rdl.jpg",
  step_up: "/exercises/stepup.jpg",
  wall_sit: "/exercises/wallsit.jpg",
  climber: "/exercises/climber.jpg",
  crunch: "/exercises/crunch.jpg",
  twist: "/exercises/twist.jpg",
  stretch: "/exercises/stretch.jpg",
  neck: "/exercises/neck.jpg",
  shoulder: "/exercises/shoulder.jpg",
  default: "/exercises/default.jpg",
};

/** Keyword → illustration key (matched against nameEn + name, lowercased) */
const KEYWORD_RULES: Array<{ key: string; patterns: RegExp[] }> = [
  { key: "curl", patterns: [/curl/, /bicep/, /biceps/, /paz[ıi]/] },
  { key: "press", patterns: [/bench\s*press/, /overhead\s*press/, /shoulder\s*press/, /arnold/, /military\s*press/, /göğüs\s*pres/, /omuz\s*pres/, /dumbbell\s*press/, /barbell\s*press/] },
  { key: "row", patterns: [/row/, /çekiş/, /çekis/, /renegade/] },
  { key: "fly", patterns: [/fly/, /flye/, /pec\s*deck/, /açış/, /acis/] },
  { key: "lateral_raise", patterns: [/lateral\s*raise/, /side\s*raise/, /yan\s*aç/] },
  { key: "tricep", patterns: [/tricep/, /triceps/, /skull\s*crush/, /pushdown/, /extension/, /üç\s*baş/, /uc\s*bas/] },
  { key: "pullover", patterns: [/pullover/] },
  { key: "wall_pushup", patterns: [/wall\s*push/] },
  { key: "pushup", patterns: [/push[\s-]?up/, /şınav/, /sinav/] },
  { key: "goblet", patterns: [/goblet/] },
  { key: "squat", patterns: [/squat/, /squat/, /çömelme/, /comelme/, /squat/] },
  { key: "bridge", patterns: [/bridge/, /hip\s*thrust/, /kalça\s*köprü/, /glute/] },
  { key: "calf", patterns: [/calf/, /baldır/, /baldir/] },
  { key: "plank", patterns: [/plank/, /plank/, /direnç\s*plank/] },
  { key: "dead_bug", patterns: [/dead\s*bug/, /ölü\s*böcek/, /olu\s*bocek/] },
  { key: "rdl", patterns: [/romanian/, /\brdl\b/, /deadlift/, /dead\s*lift/, /romanya/] },
  { key: "step_up", patterns: [/step[\s-]?up/, /step\s*up/, /basamak/] },
  { key: "wall_sit", patterns: [/wall\s*sit/, /duvar\s*otur/] },
  { key: "climber", patterns: [/mountain\s*climber/, /dağ\s*tırman/, /dag\s*tirman/] },
  { key: "crunch", patterns: [/crunch/, /sit[\s-]?up/, /mekik/, /bicycle/] },
  { key: "twist", patterns: [/russian\s*twist/, /twist/, /dönüş/, /donus/] },
  { key: "neck", patterns: [/neck/, /boyun/] },
  { key: "shoulder", patterns: [/shoulder\s*circle/, /omuz\s*çevr/, /omuz\s*daire/] },
  { key: "stretch", patterns: [/stretch/, /mobility/, /warmup/, /warm[\s-]?up/, /cooldown/, /esneme/, /mobilite/, /ısınma/, /isinma/] },
];

export function getExerciseIllustrationKey(nameEn?: string | null, name?: string | null): string {
  const haystack = `${nameEn || ""} ${name || ""}`.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((re) => re.test(haystack))) return rule.key;
  }
  return "default";
}

export function getExercisePhoto(nameEn?: string | null, name?: string | null): string {
  const key = getExerciseIllustrationKey(nameEn, name);
  return PHOTO_BY_KEY[key] || PHOTO_BY_KEY.default;
}

export function splitHowTo(description?: string | null): string[] {
  if (!description?.trim()) return [];
  return description
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

export function ExerciseIllustration({
  nameEn,
  name,
  className = "h-24 w-24",
  alt,
}: {
  nameEn?: string | null;
  name?: string | null;
  className?: string;
  alt?: string;
}) {
  const src = getExercisePhoto(nameEn, name);

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A2E] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || name || "Egzersiz örneği"}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-center"
        draggable={false}
      />
    </div>
  );
}

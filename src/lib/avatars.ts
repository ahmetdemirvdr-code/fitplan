export type StriveAvatar = {
  id: string;
  label: string;
  src: string;
};

export const STRIVE_AVATARS: StriveAvatar[] = [
  { id: "spark", label: "Kıvılcım", src: "/avatars/spark.svg" },
  { id: "iron", label: "Demir", src: "/avatars/iron.svg" },
  { id: "pulse", label: "Nabız", src: "/avatars/pulse.svg" },
  { id: "stride", label: "Adım", src: "/avatars/stride.svg" },
  { id: "flow", label: "Akış", src: "/avatars/flow.svg" },
  { id: "tide", label: "Dalga", src: "/avatars/tide.svg" },
  { id: "climb", label: "Zirve", src: "/avatars/climb.svg" },
  { id: "ring", label: "Ring", src: "/avatars/ring.svg" },
  { id: "cycle", label: "Tur", src: "/avatars/cycle.svg" },
  { id: "kettle", label: "Kettle", src: "/avatars/kettle.svg" },
  { id: "focus", label: "Odak", src: "/avatars/focus.svg" },
  { id: "crown", label: "Zafer", src: "/avatars/crown.svg" },
];

export const DEFAULT_AVATAR_ID = "spark";

export function getAvatarById(id?: string | null): StriveAvatar {
  return STRIVE_AVATARS.find((a) => a.id === id) ?? STRIVE_AVATARS[0];
}

export function isValidAvatarId(id: string): boolean {
  return STRIVE_AVATARS.some((a) => a.id === id);
}

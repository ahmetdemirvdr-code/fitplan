export type StriveAvatar = {
  id: string;
  label: string;
  color: string;
};

export const STRIVE_AVATARS: StriveAvatar[] = [
  { id: "spark", label: "Kıvılcım", color: "#FF6B35" },
  { id: "iron", label: "Demir", color: "#E85D04" },
  { id: "pulse", label: "Nabız", color: "#E63946" },
  { id: "stride", label: "Adım", color: "#2A9D8F" },
  { id: "flow", label: "Akış", color: "#7B2CBF" },
  { id: "tide", label: "Dalga", color: "#0077B6" },
  { id: "climb", label: "Zirve", color: "#6D4C41" },
  { id: "ring", label: "Ring", color: "#415A77" },
  { id: "cycle", label: "Tur", color: "#52B788" },
  { id: "kettle", label: "Kettle", color: "#BB3E03" },
  { id: "focus", label: "Odak", color: "#5A189A" },
  { id: "crown", label: "Zafer", color: "#EE9B00" },
];

export const DEFAULT_AVATAR_ID = "spark";

export function getAvatarById(id?: string | null): StriveAvatar {
  return STRIVE_AVATARS.find((a) => a.id === id) ?? STRIVE_AVATARS[0];
}

export function isValidAvatarId(id: string): boolean {
  return STRIVE_AVATARS.some((a) => a.id === id);
}

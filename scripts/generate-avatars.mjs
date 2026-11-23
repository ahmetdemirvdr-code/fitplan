import fs from "fs";
import path from "path";

const dir = "public/avatars";
fs.mkdirSync(dir, { recursive: true });

const avatars = [
  { id: "spark", label: "Kıvılcım", bg: ["#FF6B35", "#ff8c5a"], icon: "bolt" },
  { id: "iron", label: "Demir", bg: ["#E85D04", "#F48C06"], icon: "dumbbell" },
  { id: "pulse", label: "Nabız", bg: ["#E63946", "#F77F00"], icon: "heart" },
  { id: "stride", label: "Adım", bg: ["#2A9D8F", "#4ECDC4"], icon: "run" },
  { id: "flow", label: "Akış", bg: ["#7B2CBF", "#C77DFF"], icon: "yoga" },
  { id: "tide", label: "Dalga", bg: ["#0077B6", "#00B4D8"], icon: "swim" },
  { id: "climb", label: "Zirve", bg: ["#6D4C41", "#A1887F"], icon: "climb" },
  { id: "ring", label: "Ring", bg: ["#1B263B", "#415A77"], icon: "box" },
  { id: "cycle", label: "Tur", bg: ["#2D6A4F", "#52B788"], icon: "bike" },
  { id: "kettle", label: "Kettle", bg: ["#9B2226", "#BB3E03"], icon: "kettle" },
  { id: "focus", label: "Odak", bg: ["#240046", "#5A189A"], icon: "target" },
  { id: "crown", label: "Zafer", bg: ["#CA6702", "#EE9B00"], icon: "trophy" },
];

function iconPath(kind) {
  switch (kind) {
    case "bolt":
      return '<path d="M70 28 L48 70 H66 L54 108 L86 58 H68 Z" fill="white"/>';
    case "dumbbell":
      return '<g fill="white"><rect x="34" y="62" width="68" height="12" rx="4"/><rect x="28" y="48" width="14" height="40" rx="4"/><rect x="94" y="48" width="14" height="40" rx="4"/><rect x="20" y="54" width="10" height="28" rx="3"/><rect x="106" y="54" width="10" height="28" rx="3"/></g>';
    case "heart":
      return '<path d="M68 104 C68 104 28 78 28 52 C28 38 38 30 50 30 C58 30 64 34 68 40 C72 34 78 30 86 30 C98 30 108 38 108 52 C108 78 68 104 68 104Z" fill="white"/>';
    case "run":
      return '<g fill="white"><circle cx="78" cy="36" r="10"/><path d="M70 50 L58 68 L42 66 L38 76 L60 80 L70 98 L82 94 L74 78 L90 70 L98 88 L108 82 L96 58 Z"/><path d="M58 68 L48 98 L58 102 L72 74Z"/></g>';
    case "yoga":
      return '<g fill="white"><circle cx="68" cy="34" r="10"/><path d="M68 46 C68 46 48 70 36 96 L48 100 C56 80 62 68 68 62 C74 68 80 80 88 100 L100 96 C88 70 68 46 68 46Z"/><path d="M48 62 L28 58 L30 48 L54 56Z"/><path d="M88 62 L108 58 L106 48 L82 56Z"/></g>';
    case "swim":
      return '<g fill="white"><circle cx="86" cy="40" r="9"/><path d="M78 50 L58 62 L42 58 L40 68 L60 74 L70 92 L82 88 L74 72 L92 64 Z"/><path d="M28 96 Q48 84 68 96 Q88 108 108 96" fill="none" stroke="white" stroke-width="6" stroke-linecap="round"/><path d="M28 110 Q48 98 68 110 Q88 122 108 110" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" opacity="0.7"/></g>';
    case "climb":
      return '<g fill="white"><circle cx="74" cy="34" r="9"/><path d="M66 46 L54 70 L40 66 L36 76 L56 84 L52 108 L64 110 L70 88 L86 78 L96 96 L108 90 L92 64 Z"/><path d="M42 96 L28 108 L36 114 L52 100Z"/></g>';
    case "box":
      return '<g fill="white"><circle cx="68" cy="36" r="10"/><path d="M48 48 H88 V62 H80 V100 H56 V62 H48 Z"/><rect x="34" y="58" width="16" height="22" rx="6"/><rect x="86" y="58" width="16" height="22" rx="6"/></g>';
    case "bike":
      return '<g fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="88" r="18"/><circle cx="96" cy="88" r="18"/><path d="M40 88 L62 56 H86 L96 88"/><path d="M62 56 L52 40"/><circle cx="50" cy="34" r="6" fill="white" stroke="none"/><path d="M86 56 H70"/></g>';
    case "kettle":
      return '<g fill="white"><path d="M48 58 H88 V66 C102 70 110 84 110 98 C110 114 98 122 68 122 C38 122 26 114 26 98 C26 84 34 70 48 66 Z"/><rect x="52" y="40" width="32" height="18" rx="8"/></g>';
    case "target":
      return '<g fill="none" stroke="white" stroke-width="7"><circle cx="68" cy="68" r="36"/><circle cx="68" cy="68" r="22"/><circle cx="68" cy="68" r="8" fill="white" stroke="none"/></g>';
    case "trophy":
      return '<g fill="white"><path d="M44 36 H92 V58 C92 78 80 90 68 90 C56 90 44 78 44 58 Z"/><path d="M44 42 H32 C28 42 26 50 30 56 C34 62 44 64 44 64"/><path d="M92 42 H104 C108 42 110 50 106 56 C102 62 92 64 92 64"/><rect x="60" y="90" width="16" height="12"/><rect x="48" y="102" width="40" height="10" rx="3"/></g>';
    default:
      return "";
  }
}

for (const a of avatars) {
  const [c1, c2] = a.bg;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136 136" width="136" height="136" role="img" aria-label="${a.label}">
  <defs>
    <linearGradient id="g" x1="20" y1="12" x2="116" y2="124" gradientUnits="userSpaceOnUse">
      <stop stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <circle cx="68" cy="68" r="68" fill="url(#g)"/>
  <circle cx="68" cy="68" r="60" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="3"/>
  ${iconPath(a.icon)}
</svg>`;
  fs.writeFileSync(path.join(dir, `${a.id}.svg`), svg);
}

const catalogBody = avatars
  .map(
    (a) =>
      `  { id: "${a.id}", label: "${a.label}", src: "/avatars/${a.id}.svg" },`
  )
  .join("\n");

fs.writeFileSync(
  "src/lib/avatars.ts",
  `export type StriveAvatar = {
  id: string;
  label: string;
  src: string;
};

export const STRIVE_AVATARS: StriveAvatar[] = [
${catalogBody}
];

export const DEFAULT_AVATAR_ID = "spark";

export function getAvatarById(id?: string | null): StriveAvatar {
  return STRIVE_AVATARS.find((a) => a.id === id) ?? STRIVE_AVATARS[0];
}

export function isValidAvatarId(id: string): boolean {
  return STRIVE_AVATARS.some((a) => a.id === id);
}
`
);

console.log(`created ${avatars.length} avatars`);

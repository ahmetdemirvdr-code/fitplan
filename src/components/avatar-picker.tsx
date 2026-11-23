"use client";

import { STRIVE_AVATARS } from "@/lib/avatars";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

type AvatarPickerProps = {
  value: string;
  onChange: (avatarId: string) => void;
  disabled?: boolean;
};

export function AvatarPicker({ value, onChange, disabled }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {STRIVE_AVATARS.map((avatar) => {
        const selected = value === avatar.id;
        return (
          <button
            key={avatar.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(avatar.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl p-2 transition",
              selected
                ? "bg-[#FF6B35]/15 ring-2 ring-[#FF6B35]"
                : "bg-[#16213E]/60 hover:bg-[#16213E]",
              disabled && "opacity-50"
            )}
            aria-pressed={selected}
            aria-label={avatar.label}
          >
            <UserAvatar avatarId={avatar.id} size={56} alt={avatar.label} />
            <span className="text-[10px] font-medium text-[#EAEAEA]/70">
              {avatar.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

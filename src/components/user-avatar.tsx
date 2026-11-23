"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getAvatarById } from "@/lib/avatars";

type UserAvatarProps = {
  avatarId?: string | null;
  size?: number;
  className?: string;
  alt?: string;
};

export function UserAvatar({
  avatarId,
  size = 80,
  className,
  alt = "Avatar",
}: UserAvatarProps) {
  const avatar = getAvatarById(avatarId);

  return (
    <Image
      src={avatar.src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={cn("rounded-full object-cover ring-2 ring-[#FF6B35]/30", className)}
      style={{ width: size, height: size }}
    />
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** Image height in px */
  height?: number;
  priority?: boolean;
  /** Show wordmark only via image (logo includes text) */
  alt?: string;
};

export function BrandLogo({
  className,
  height = 40,
  priority = false,
  alt = "Strive",
}: BrandLogoProps) {
  // Logo is a wide wordmark (~1024x395). Serve directly so Coolify/proxy
  // never blocks /_next/image optimization of public assets.
  const width = Math.round(height * (1024 / 395));

  return (
    <Image
      src="/strive-logo.png"
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      unoptimized
      className={cn("h-auto w-auto max-w-full object-contain", className)}
      style={{ height, width: "auto" }}
    />
  );
}

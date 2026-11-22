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
  return (
    <Image
      src="/strive-logo.png"
      alt={alt}
      width={Math.round(height * 3.4)}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height, width: "auto" }}
    />
  );
}

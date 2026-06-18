import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Forge logo — the indigo "F + arrow" mark from /public/logo.png (transparent).
 * Colored artwork, so it stands on its own without a background chip.
 */
export function ForgeLogo({
  size = 32,
  className,
  src = "/logo.png",
  priority = false,
}: {
  size?: number;
  className?: string;
  src?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt="Forge"
      width={size}
      height={size}
      priority={priority}
      className={cn("object-contain", className)}
    />
  );
}

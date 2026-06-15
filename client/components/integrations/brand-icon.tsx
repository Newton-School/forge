import Image from "next/image";

const SRC: Record<string, string> = {
  github: "/github.svg",
  discord: "/discord.png",
  calendar: "/google_calendar.png",
};

/** Brand logos served from /public (GitHub, Discord, Google Calendar). */
export function BrandIcon({
  name, size = 20, className,
}: {
  name: "github" | "discord" | "calendar";
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={SRC[name]}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

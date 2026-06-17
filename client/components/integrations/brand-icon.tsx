import Image from "next/image";

const SRC: Record<string, string> = {
  github: "/github.svg",
  discord: "/discord.png",
  calendar: "/google_calendar.png",
  email: "/email.svg",
  groq: "/groq.svg",
};

/** Brand logos served from /public (GitHub, Discord, Google Calendar, Email, Groq). */
export function BrandIcon({
  name, size = 20, className,
}: {
  name: "github" | "discord" | "calendar" | "email" | "groq";
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

import Image from "next/image";

const SRC: Record<string, string> = {
  github: "/github.svg",
  discord: "/discord.png",
  calendar: "/google_calendar.png",
  email: "/gmail.webp",
  groq: "/logo.png", // Forge AI (publicly branded; powered by Groq under the hood)
};

const LABEL: Record<string, string> = {
  github: "GitHub",
  discord: "Discord",
  calendar: "Google Calendar",
  email: "Email",
  groq: "Forge AI",
};

/** Brand logos served from /public (GitHub, Discord, Google Calendar, Email, Forge AI). */
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
      alt={`${LABEL[name] ?? name} logo`}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

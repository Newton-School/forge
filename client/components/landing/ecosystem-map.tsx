"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import type { IntegrationKey } from "@/lib/landing";
import { Section, Eyebrow, SectionHeading } from "./section";
import { Reveal } from "./reveal";

const CX = 460;
const CY = 280;

type MapNode = {
  key: IntegrationKey;
  label: string;
  x: number;
  y: number;
  logo?: string;
  glyph?: string;
};

// Five integrations evenly around the central Portal (radius 200, from top).
const NODES: MapNode[] = [
  { key: "github", label: "GitHub", x: 460, y: 80, logo: "/github.svg" },
  { key: "discord", label: "Discord", x: 650, y: 218, logo: "/discord.png" },
  { key: "calendar", label: "Calendar", x: 578, y: 442, logo: "/google_calendar.png" },
  { key: "email", label: "Email", x: 342, y: 442, logo: "/email.svg" },
  { key: "groq", label: "Groq AI", x: 270, y: 218, logo: "/groq.svg" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function EcosystemMap() {
  const ref = useRef<SVGSVGElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const show = inView || reduce;

  return (
    <Section id="ecosystem-map" className="relative overflow-hidden">
      <div aria-hidden className="mkt-aurora pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative">
        <Reveal>
          <Eyebrow>The unified ecosystem</Eyebrow>
        </Reveal>
        <Reveal delay={0.06}>
          <SectionHeading
            className="mt-5"
            title="Forge is the intelligence at the center."
            lead="Every system connects through one portal. Activity flows in from GitHub, Discord, Calendar, Email, and Groq AI — and flows back out as insight, review, and analytics."
            align="center"
          />
        </Reveal>

        <div className="mx-auto mt-12 max-w-4xl">
          <svg
            ref={ref}
            viewBox="0 0 920 560"
            className="h-auto w-full"
            role="img"
            aria-label="Forge portal connected to GitHub, Discord, Calendar, Email, and Groq AI"
          >
            <defs>
              <linearGradient id="mkt-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#7c6cf5" stopOpacity="0.35" />
              </linearGradient>
            </defs>

            {/* connection lines (draw in on scroll) */}
            {NODES.map((n, i) => (
              <motion.path
                key={`line-${n.key}`}
                d={`M${CX} ${CY} L${n.x} ${n.y}`}
                stroke="url(#mkt-line)"
                strokeWidth={2}
                fill="none"
                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                animate={show ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.12 }}
              />
            ))}

            {/* traveling packets (skip under reduced motion) */}
            {!reduce &&
              show &&
              NODES.map((n, i) => (
                <motion.circle
                  key={`packet-${n.key}`}
                  r={3.5}
                  fill="#4f46e5"
                  initial={{ cx: CX, cy: CY, opacity: 0 }}
                  animate={{
                    cx: [CX, n.x],
                    cy: [CY, n.y],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 2.2,
                    ease: "linear",
                    repeat: Infinity,
                    delay: 1 + i * 0.4,
                    repeatDelay: 0.6,
                  }}
                />
              ))}

            {/* integration nodes */}
            {NODES.map((n, i) => (
              <motion.g
                key={`node-${n.key}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                animate={show ? { opacity: 1, scale: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.3 + i * 0.12 }}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}
              >
                <circle cx={n.x} cy={n.y} r={34} fill="#fff" stroke="#e4e4e7" strokeWidth={1.5} />
                {n.logo ? (
                  <image href={n.logo} x={n.x - 15} y={n.y - 15} width={30} height={30} />
                ) : (
                  <text
                    x={n.x}
                    y={n.y + 7}
                    textAnchor="middle"
                    fontSize={22}
                    fill="#4f46e5"
                  >
                    {n.glyph}
                  </text>
                )}
                <text
                  x={n.x}
                  y={n.y + 54}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={600}
                  fill="#18181b"
                >
                  {n.label}
                </text>
              </motion.g>
            ))}

            {/* central Portal */}
            <motion.g
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
              animate={show ? { opacity: 1, scale: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
            >
              <circle
                cx={CX}
                cy={CY}
                r={62}
                fill="#4f46e5"
                className="mkt-ring-pulse"
                opacity={0.12}
              />
              <rect x={CX - 70} y={CY - 34} width={140} height={68} rx={18} fill="#0b0b12" />
              <text x={CX} y={CY - 4} textAnchor="middle" fontSize={20} fontWeight={700} fill="#fff">
                Forge
              </text>
              <text
                x={CX}
                y={CY + 16}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="#7c6cf5"
                letterSpacing="0.12em"
              >
                THE PORTAL
              </text>
            </motion.g>
          </svg>
        </div>
      </div>
    </Section>
  );
}

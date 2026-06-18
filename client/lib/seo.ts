/**
 * Central SEO config + structured-data builders. One source of truth for the
 * canonical URL, titles, descriptions, and JSON-LD used across metadata, the
 * sitemap, robots, and the OG image.
 */
export const SITE = {
  name: "Forge",
  /** Public production origin (override per-env with NEXT_PUBLIC_SITE_URL). */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge.taj.works").replace(/\/$/, ""),
  /** The public marketing page (signed-out root redirects here). */
  landingPath: "/landing",
  title: "Forge — Build. Learn. Contribute.",
  description:
    "Forge is the Profile Building Drive platform by the Learner Career Council at Newton School of Technology. Students build on real GitHub repositories, mentors review and guide, teachers track progress, and learning becomes measurable.",
  org: "Learner Career Council",
  orgShort: "LCC",
  school: "Newton School of Technology",
  schoolShort: "NST",
  locale: "en_US",
  keywords: [
    "Forge",
    "Newton School of Technology",
    "NST",
    "Learner Career Council",
    "Profile Building Drive",
    "student projects platform",
    "mentorship platform",
    "GitHub contribution tracking",
    "engineering education",
    "AI ML SDSE",
  ],
} as const;

export const LANDING_URL = `${SITE.url}${SITE.landingPath}`;

/** Private app sections that must never be indexed (auth-gated; no public value). */
export const PRIVATE_PATHS = [
  "/admin",
  "/lcc",
  "/teacher",
  "/mentor",
  "/mentee",
  "/login",
  "/calendar",
  "/connections",
  "/notifications",
  "/profile",
  "/concerns",
];

/** Crawlers we explicitly welcome on the public marketing page — search engines
 *  and the major AI/LLM crawlers (so Forge can be cited and surfaced by them). */
export const AI_AND_SEARCH_BOTS = [
  "Googlebot",
  "Bingbot",
  "DuckDuckBot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "cohere-ai",
  "YouBot",
];

/** JSON-LD: the org + product + site, so search engines and AI crawlers understand
 *  the entity behind Forge. */
export function structuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/logo.png`,
      description: SITE.description,
      parentOrganization: {
        "@type": "EducationalOrganization",
        name: SITE.school,
        alternateName: SITE.schoolShort,
      },
      brand: { "@type": "Brand", name: SITE.name },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE.name,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: SITE.description,
      url: LANDING_URL,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@type": "Organization", name: `${SITE.org} (${SITE.orgShort}), ${SITE.school}` },
    },
  ];
}

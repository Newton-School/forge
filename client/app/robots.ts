import type { MetadataRoute } from "next";
import { SITE, PRIVATE_PATHS, AI_AND_SEARCH_BOTS } from "@/lib/seo";

/**
 * robots.txt — welcomes search + AI/LLM crawlers on the public marketing page,
 * and keeps the auth-gated app sections out of every index. To opt OUT of AI
 * training/crawling later, change the AI bots' rule to `disallow: "/"`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      // Explicitly welcome the major search + AI crawlers (same private exclusions).
      { userAgent: AI_AND_SEARCH_BOTS as unknown as string[], allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}

import type { MetadataRoute } from "next";
import { LANDING_URL } from "@/lib/seo";

/** Sitemap — only the public marketing page (everything else is auth-gated). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: LANDING_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}

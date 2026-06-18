import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — Profile Building Drive`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    icons: [
      { src: "/logo.png", sizes: "any", type: "image/png" },
      { src: "/forge_app_chip.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}

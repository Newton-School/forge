import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MarketingNav } from "@/components/landing/marketing-nav";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { SITE, LANDING_URL, structuredData } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: SITE.title },
  description: SITE.description,
  alternates: { canonical: SITE.landingPath },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: LANDING_URL,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div id="top" className="mkt min-h-screen">
      {/* Structured data for search engines + AI crawlers (Organization · WebSite · App). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
      />
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MarketingNav } from "@/components/landing/marketing-nav";
import { MarketingFooter } from "@/components/landing/marketing-footer";

export const metadata: Metadata = {
  title: "Forge — Build. Learn. Contribute.",
  description:
    "Forge is the Profile Building Drive platform by the Learner Career Council at Newton School of Technology — where students build on real repositories, mentors guide and review, teachers track progress, and learning becomes measurable.",
  openGraph: {
    title: "Forge — Build. Learn. Contribute.",
    description:
      "A complete learning, contribution, mentoring, and evaluation ecosystem for the NST Profile Building Drive.",
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div id="top" className="mkt min-h-screen">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

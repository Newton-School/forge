import { Hero } from "@/components/landing/hero";
import { Why } from "@/components/landing/why";
import { EcosystemFlow } from "@/components/landing/ecosystem-flow";
import { Lifecycle } from "@/components/landing/lifecycle";
import { RoleExperiences } from "@/components/landing/role-experiences";
import { EcosystemMap } from "@/components/landing/ecosystem-map";
import { IntegrationShowcase } from "@/components/landing/integration-showcase";
import { LearningBuilding } from "@/components/landing/learning-building";
import { Analytics } from "@/components/landing/analytics";
import { Security } from "@/components/landing/security";
import { Architecture } from "@/components/landing/architecture";
import { Cta } from "@/components/landing/cta";

/**
 * Forge marketing landing page — the public showcase of the Profile Building
 * Drive ecosystem. Server Component that composes presentational section
 * components; interactivity lives in small "use client" islands within them.
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Why />
      <EcosystemFlow />
      <Lifecycle />
      <RoleExperiences />
      <EcosystemMap />
      <IntegrationShowcase />
      <LearningBuilding />
      <Analytics />
      <Security />
      <Architecture />
      <Cta />
    </>
  );
}

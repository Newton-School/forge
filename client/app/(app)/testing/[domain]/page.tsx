import { notFound } from "next/navigation";
import { DomainRunner } from "@/components/testing/domain-runner";
import { DOMAIN_KEYS, type DomainKey } from "@/lib/mock/testing";

export default async function DomainTestingPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const key = domain.toUpperCase() as DomainKey;
  if (!DOMAIN_KEYS.includes(key)) notFound();
  return <DomainRunner domain={key} />;
}

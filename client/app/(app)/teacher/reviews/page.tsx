import { parseDomains } from "@/lib/domains";
import { getCurrentUser } from "@/lib/session";
import { api } from "@/lib/api";
import { ReviewsClient } from "./reviews-client";

export default async function TeacherReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const user = await getCurrentUser();
  const myDomains = user.domainKeys ?? [];
  const sp = await searchParams;
  const picked = parseDomains(sp.domain);
  const active = picked.length ? picked.filter((d) => myDomains.includes(d)) : myDomains;

  const reviews = (await api.weeklyReviews()).filter((r) => active.includes(r.domainKey));

  return <ReviewsClient reviews={reviews} domains={myDomains} />;
}

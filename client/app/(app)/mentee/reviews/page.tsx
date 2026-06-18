import { PageHeader } from "@/components/dashboard/page-header";
import { MenteeReviewsClient } from "@/components/reviews/mentee-reviews-client";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

export default async function MenteeReviewsPage() {
  // The server scopes updates/reviews to the signed-in mentee (SELF); the name filter keeps
  // the presentation fixtures focused on the active demo mentee too.
  const user = await getCurrentUser();
  const [allUpdates, allReviews] = await Promise.all([api.updates(), api.weeklyReviews()]);
  const updates = allUpdates.filter((u) => u.mentee === user.fullName);
  const reviews = allReviews.filter((w) => w.mentee === user.fullName);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reviews & Updates" description="Submit your bi-daily progress and track weekly faculty reviews." />
      <MenteeReviewsClient updates={updates} reviews={reviews} />
    </div>
  );
}

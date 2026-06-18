import { EmailCenterClient } from "@/components/email/email-center-client";
import { api } from "@/lib/api";

export default async function EmailCenterPage() {
  const [domains, teams, templates] = await Promise.all([api.domains(), api.teams(), api.emailTemplates()]);
  return <EmailCenterClient domains={domains} teams={teams} templates={templates} />;
}

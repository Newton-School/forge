import { getCurrentUser, getActiveDomain } from "@/lib/session";
import { isPresentationMode } from "@/lib/config";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/topnav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const domain = await getActiveDomain();
  const presentation = isPresentationMode();
  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <Sidebar user={user} domain={domain} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav user={user} domain={domain} presentation={presentation} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

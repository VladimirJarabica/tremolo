import { Suspense } from "react";
import { getLists } from "@/app/actions/get-lists";
import { getUser } from "@/app/actions/auth";
import { AppShell } from "@/app/components/app-shell";
import { SidebarProvider } from "@/app/components/sidebar-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const [listsResult, userData] = await Promise.all([
    getLists(),
    getUser(),
  ]);

  const lists = listsResult.success ? listsResult.data : [];
  const user = userData ? { email: userData.email ?? "" } : null;

  return (
    <SidebarProvider>
      <AppShell lists={lists} user={user}>
        <Suspense
          fallback={<div className="flex h-full items-center justify-center">Loading...</div>}
        >
          {children}
        </Suspense>
      </AppShell>
    </SidebarProvider>
  );
}

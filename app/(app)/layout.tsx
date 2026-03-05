import { Suspense } from "react";
import { getSheets } from "@/app/actions/get-sheets";
import { getLists } from "@/app/actions/get-lists";
import { getUser } from "@/app/actions/auth";
import { AppShell } from "@/app/components/app-shell";
import { SidebarProvider } from "@/app/components/sidebar-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const [sheetsResult, listsResult, userData] = await Promise.all([
    getSheets(),
    getLists(),
    getUser(),
  ]);

  const sheets = sheetsResult.success ? sheetsResult.data : [];
  const lists = listsResult.success ? listsResult.data : [];
  const user = userData ? { email: userData.email ?? "" } : null;

  return (
    <SidebarProvider>
      <AppShell sheets={sheets} lists={lists} user={user}>
        <Suspense
          fallback={<div className="flex h-full items-center justify-center">Loading...</div>}
        >
          {children}
        </Suspense>
      </AppShell>
    </SidebarProvider>
  );
}

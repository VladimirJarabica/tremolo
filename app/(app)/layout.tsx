import { Suspense } from "react";
import { getSheets } from "@/app/actions/get-sheets";
import { getUser } from "@/app/actions/auth";
import { AppShell } from "@/app/components/app-shell";
import { SidebarProvider } from "@/app/components/sidebar-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const [sheetsResult, userData] = await Promise.all([
    getSheets(),
    getUser(),
  ]);

  const sheets = sheetsResult.success ? sheetsResult.data : [];
  const user = userData ? { email: userData.email ?? "" } : null;

  return (
    <SidebarProvider>
      <AppShell sheets={sheets} user={user}>
        <Suspense
          fallback={<div className="flex h-full items-center justify-center">Loading...</div>}
        >
          {children}
        </Suspense>
      </AppShell>
    </SidebarProvider>
  );
}

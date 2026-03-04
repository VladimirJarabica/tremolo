import { Suspense } from "react";
import { getSheets } from "@/app/actions/get-sheets";
import { SheetList } from "@/app/components/sheet-list";
import { Header } from "@/app/components/header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const sheetsResult = await getSheets();

  const sheets = sheetsResult.success ? sheetsResult.data : [];

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-zinc-200">
          <Suspense fallback={<div className="p-4">Loading...</div>}>
            <SheetList sheets={sheets} />
          </Suspense>
        </aside>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

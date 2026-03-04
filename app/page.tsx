import { Suspense } from "react";
import { getSheets } from "@/app/actions/get-sheets";
import { getSheet } from "@/app/actions/get-sheet";
import { getTags } from "@/app/actions/get-tags";
import { SheetList } from "@/app/components/sheet-list";
import { SheetDetail, EmptyState } from "@/app/components/sheet-detail";
import { Header } from "./components/header";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sheetId?: string }>;
}): Promise<React.JSX.Element> {
  const { sheetId } = await searchParams;

  const [sheetsResult, tagsResult] = await Promise.all([
    getSheets(),
    getTags(),
  ]);

  const sheets = sheetsResult.success ? sheetsResult.data : [];
  const allTags = tagsResult.success ? tagsResult.data : [];

  let selectedSheet = null;
  let selectedTags: { id: string; name: string }[] = [];

  if (sheetId) {
    const sheetResult = await getSheet({ sheetId });
    if (sheetResult.success) {
      selectedSheet = sheetResult.data;
      selectedTags = sheetResult.data.tags;
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-zinc-200">
          <Suspense fallback={<div className="p-4">Loading...</div>}>
            <SheetList sheets={sheets} selectedId={sheetId} />
          </Suspense>
        </aside>

        {/* Main panel */}
        <main className="flex-1 overflow-hidden">
          {selectedSheet ? (
            <SheetDetail
              sheet={selectedSheet}
              tags={selectedTags}
              allTags={allTags}
            />
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { getListWithSheets } from "@/app/actions/get-list-with-sheets";
import { MultiAbcViewer } from "@/app/components/multi-abc-viewer";
import { Button } from "@/components/ui/button";

export default async function ListAllPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}): Promise<React.JSX.Element> {
  const { listId } = await params;
  const result = await getListWithSheets(listId);

  if (!result.success) {
    redirect("/");
  }

  const list = result.data;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/list/${listId}`}>← Back to list</Link>
          </Button>
          <h1 className="text-lg font-semibold text-zinc-900">{list.name}</h1>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto">
          <MultiAbcViewer items={list.items} />
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { getDeletedSheets } from "@/app/actions/get-deleted-sheets";
import { restoreSheet } from "@/app/actions/restore-sheet";
import { hardDeleteSheet } from "@/app/actions/hard-delete-sheet";

export default async function TrashPage(): Promise<React.JSX.Element> {
  const result = await getDeletedSheets();
  const sheets = result.success ? result.data : [];

  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-4">
        <h1 className="text-xl font-semibold">Trash</h1>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Back to Sheets
        </Link>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {sheets.length === 0 ? (
          <div className="text-center text-zinc-500">
            <p>Trash is empty</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sheets.map((sheet) => (
              <TrashItem
                key={sheet.id}
                id={sheet.id}
                content={sheet.content}
                deletedAt={sheet.deletedAt!}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function TrashItem({
  id,
  content,
  deletedAt,
}: {
  id: string;
  content: string;
  deletedAt: Date;
}): React.JSX.Element {
  const title = getPreviewTitle(content);

  return (
    <li className="flex items-center justify-between rounded-lg border border-zinc-200 p-4">
      <div>
        <div className="font-medium">{title || "Untitled"}</div>
        <div className="text-sm text-zinc-500">
          Deleted {deletedAt.toLocaleDateString()}
        </div>
      </div>
      <div className="flex gap-2">
        <RestoreButton sheetId={id} />
        <HardDeleteButton sheetId={id} />
      </div>
    </li>
  );
}

function getPreviewTitle(content: string): string {
  const titleMatch = content.match(/^T:\s*(.+)$/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  return content.split("\n")[0]?.slice(0, 50) ?? "Untitled";
}

function RestoreButton({ sheetId }: { sheetId: string }): React.JSX.Element {
  return (
    <form
      action={async () => {
        "use server";
        await restoreSheet({ sheetId });
      }}
    >
      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Restore
      </button>
    </form>
  );
}

function HardDeleteButton({ sheetId }: { sheetId: string }): React.JSX.Element {
  return (
    <form
      action={async () => {
        "use server";
        await hardDeleteSheet({ sheetId });
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        Delete Forever
      </button>
    </form>
  );
}

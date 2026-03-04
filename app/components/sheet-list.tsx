import Link from "next/link";
import { cn } from "@/lib/utils";

export function SheetList({
  sheets,
  selectedId,
}: {
  sheets: { id: string; title: string; createdAt: Date }[];
  selectedId?: string;
}): React.JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        {sheets.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-500">
            No sheets yet. Click &quot;New&quot; to create one.
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {sheets.map((sheet) => (
              <SheetListItem
                key={sheet.id}
                id={sheet.id}
                title={sheet.title}
                createdAt={sheet.createdAt}
                isActive={sheet.id === selectedId}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SheetListItem({
  id,
  title,
  createdAt,
  isActive,
}: {
  id: string;
  title: string;
  createdAt: Date;
  isActive: boolean;
}): React.JSX.Element {
  return (
    <li>
      <Link
        href={`/?sheetId=${id}`}
        className={cn(
          "block rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-zinc-100 text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-50"
        )}
      >
        <div className="truncate font-medium">{title || "Untitled"}</div>
        <div className="text-xs text-zinc-400">
          {createdAt.toLocaleDateString()}
        </div>
      </Link>
    </li>
  );
}

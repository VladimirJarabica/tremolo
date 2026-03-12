import Link from "next/link";
import { format } from "date-fns";
import { getPublicSheets } from "@/app/actions/get-public-sheets";
import { getTags } from "@/app/actions/get-tags";
import type { GetPublicSheetsInput } from "@/be/sheet/validation-schema";
import { HomeFilters } from "./filters";
import { Pagination } from "./pagination";

type SheetGridProps = {
  page?: number;
  orderBy?: "createdAt" | "title";
  order?: "asc" | "desc";
  meter?: GetPublicSheetsInput["meter"];
  tempoRange?: GetPublicSheetsInput["tempoRange"];
  scale?: GetPublicSheetsInput["scale"];
  search?: string;
  tagIds?: string[];
};

export async function SheetGrid(
  props: SheetGridProps,
): Promise<React.JSX.Element> {
  const input: GetPublicSheetsInput = {
    page: props.page ?? 1,
    orderBy: props.orderBy ?? "createdAt",
    meter: props.meter,
    tempoRange: props.tempoRange,
    scale: props.scale,
    search: props.search,
    tagIds: props.tagIds,
  };

  const [result, tagsResult] = await Promise.all([
    getPublicSheets(input),
    getTags(),
  ]);

  if (!result.success) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        Error loading sheets
      </div>
    );
  }

  const { items, total } = result.data;
  const tags = tagsResult.success ? tagsResult.data : [];

  return (
    <div className="flex h-full flex-col">
      <HomeFilters currentFilters={input} total={total} tags={tags} />
      <div className="overflow-auto">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-zinc-400">
            No sheets found
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {items.map((sheet) => (
              <SheetListItem key={sheet.id} sheet={sheet} />
            ))}
          </ul>
        )}
      </div>
      <Pagination
        currentPage={input.page ?? 1}
        total={total}
        itemsPerPage={10}
      />
    </div>
  );
}

function SheetListItem({
  sheet,
}: {
  sheet: {
    id: string;
    slug: string;
    title: string;
    author: string | null;
    meter: string;
    tempo: number;
    scale: string;
    tags: { id: string; name: string }[];
    createdAt: Date;
  };
}): React.JSX.Element {
  return (
    <li>
      <Link
        href={`/sheet/${sheet.slug}`}
        className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-50"
      >
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-zinc-900">
            {sheet.title || "Untitled"}
          </h3>
          {sheet.author && (
            <p className="mt-0.5 truncate text-sm text-zinc-500">
              {sheet.author}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-400">
          <span>{formatMeter(sheet.meter)}</span>
          <span>{sheet.tempo} BPM</span>
          <span>{formatScale(sheet.scale)}</span>
        </div>
        {sheet.tags.length > 0 && (
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {sheet.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
              >
                {tag.name}
              </span>
            ))}
            {sheet.tags.length > 2 && (
              <span className="text-xs text-zinc-400">
                +{sheet.tags.length - 2}
              </span>
            )}
          </div>
        )}
        <span className="shrink-0 text-xs text-zinc-400">
          {format(sheet.createdAt, "d. MMM yyyy")}
        </span>
      </Link>
    </li>
  );
}

function formatMeter(meter: string): string {
  return meter.replace("m_", "").replace("_", "/");
}

function formatScale(scale: string): string {
  const replacements: Record<string, string> = {
    Fs: "F#",
    Cs: "C#",
    Fsm: "F#m",
    Csm: "C#m",
    Gsm: "G#m",
    Dsm: "D#m",
    Asm: "A#m",
    Bb: "Bb",
    Eb: "Eb",
    Ab: "Ab",
    Db: "Db",
    Gb: "Gb",
    Cb: "Cb",
    Bbm: "Bbm",
    Ebm: "Ebm",
    Abm: "Abm",
  };
  return replacements[scale] ?? scale;
}

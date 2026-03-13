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
      <div className="flex h-full items-center justify-center text-[oklch(0.577_0.245_27.325)]">
        Error loading sheets
      </div>
    );
  }

  const { items, total } = result.data;
  const tags = tagsResult.success ? tagsResult.data : [];

  return (
    <div className="flex h-full flex-col">
      <HomeFilters currentFilters={input} total={total} tags={tags} />
      <div className="overflow-auto p-4">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[oklch(0.5_0.03_160)]">
            No sheets found
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((sheet) => (
              <SheetListItem key={sheet.id} sheet={sheet} />
            ))}
          </div>
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
    <Link
      href={`/sheet/${sheet.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-[oklch(0.92_0.02_160)] bg-white/80 backdrop-blur-sm px-5 py-4 shadow-sm transition-all hover:shadow-lg hover:shadow-[oklch(0.55_0.12_160/0.1)] hover:border-[oklch(0.85_0.04_160)] hover:bg-white"
    >
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-[oklch(0.25_0.03_160)] group-hover:text-[oklch(0.45_0.18_160)] transition-colors">
          {sheet.title || "Untitled"}
        </h3>
        {sheet.author && (
          <p className="mt-0.5 truncate text-sm text-[oklch(0.5_0.04_160)]">
            {sheet.author}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-[oklch(0.45_0.04_160)] font-medium">
        <span className="px-2 py-1 rounded-lg bg-[oklch(0.96_0.02_160)]">{formatMeter(sheet.meter)}</span>
        <span className="px-2 py-1 rounded-lg bg-[oklch(0.96_0.02_160)]">{sheet.tempo} BPM</span>
        <span className="px-2 py-1 rounded-lg bg-[oklch(0.96_0.02_160)]">{formatScale(sheet.scale)}</span>
      </div>
      {sheet.tags.length > 0 && (
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {sheet.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[oklch(0.94_0.04_160)] to-[oklch(0.94_0.04_150)] px-2.5 py-0.5 text-xs font-medium text-[oklch(0.4_0.08_160)]"
            >
              {tag.name}
            </span>
          ))}
          {sheet.tags.length > 2 && (
            <span className="text-xs text-[oklch(0.5_0.03_160)]">
              +{sheet.tags.length - 2}
            </span>
          )}
        </div>
      )}
      <span className="shrink-0 text-xs text-[oklch(0.5_0.03_160)]">
        {format(sheet.createdAt, "d. MMM yyyy")}
      </span>
    </Link>
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

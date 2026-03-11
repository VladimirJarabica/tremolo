import type { Meter, Scale } from "@/be/db/enums";
import { SheetGrid } from "../components/home/sheet-grid";

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    orderBy?: "createdAt" | "title";
    order?: "asc" | "desc";
    meter?: string;
    tempoRange?: "slow" | "medium" | "fast";
    scale?: string;
    search?: string;
    tagIds?: string | string[];
  }>;
}): Promise<React.JSX.Element> {
  const params = await searchParams;

  const tagIds = params.tagIds
    ? Array.isArray(params.tagIds)
      ? params.tagIds
      : [params.tagIds]
    : undefined;

  return (
    <SheetGrid
      page={params.page ? parseInt(params.page, 10) : undefined}
      orderBy={params.orderBy}
      order={params.order}
      meter={params.meter as Meter | undefined}
      tempoRange={params.tempoRange}
      scale={params.scale as Scale | undefined}
      search={params.search}
      tagIds={tagIds}
    />
  );
}

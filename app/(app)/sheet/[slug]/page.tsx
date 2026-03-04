import { notFound } from "next/navigation";
import { getSheetBySlug } from "@/app/actions/get-sheet-by-slug";
import { getTags } from "@/app/actions/get-tags";
import { getUser } from "@/app/actions/auth";
import { SheetDetail } from "@/app/components/sheet-detail";

export default async function SheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.JSX.Element> {
  const { slug } = await params;

  const [sheetResult, tagsResult, user] = await Promise.all([
    getSheetBySlug({ slug }),
    getTags(),
    getUser(),
  ]);

  if (!sheetResult.success) {
    notFound();
  }

  const sheet = sheetResult.data;
  const allTags = tagsResult.success ? tagsResult.data : [];
  const currentUserId = user?.id ?? null;

  return (
    <SheetDetail
      sheet={sheet}
      allTags={allTags}
      currentUserId={currentUserId}
    />
  );
}

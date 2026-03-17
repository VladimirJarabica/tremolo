import { notFound } from "next/navigation";
import { getSheetBySlug } from "@/app/actions/get-sheet-by-slug";
import { getTags } from "@/app/actions/get-tags";
import { getLists } from "@/app/actions/get-lists";
import { getUser } from "@/app/actions/auth";
import { SheetDetail } from "@/app/components/sheet-detail";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const sheetResult = await getSheetBySlug({ slug });

  if (!sheetResult.success) {
    return { title: "Sheet not found" };
  }

  const sheet = sheetResult.data;

  return {
    title: `${sheet.title} • Tremolo`,
    description: `View the sheet "${sheet.title}" on Tremolo. Play it in any key, transpose it, and share it with others!`,
  };
};

export default async function SheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.JSX.Element> {
  const { slug } = await params;

  const [sheetResult, tagsResult, listsResult, user] = await Promise.all([
    getSheetBySlug({ slug }),
    getTags(),
    getLists(),
    getUser(),
  ]);

  if (!sheetResult.success) {
    notFound();
  }

  const sheet = sheetResult.data;
  const allTags = tagsResult.success ? tagsResult.data : [];
  const lists = listsResult.success ? listsResult.data : [];
  const currentUserId = user?.id ?? null;

  return (
    <SheetDetail
      sheet={sheet}
      allTags={allTags}
      lists={lists}
      currentUserId={currentUserId}
    />
  );
}

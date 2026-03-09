import { redirect } from "next/navigation";
import { getList } from "@/app/actions/get-list";
import { ListDetail } from "@/app/components/list-detail";

export default async function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}): Promise<React.JSX.Element> {
  const { listId } = await params;
  const result = await getList(listId);

  if (!result.success) {
    redirect("/");
  }

  return <ListDetail initialList={result.data} />;
}

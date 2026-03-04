import Link from "next/link";
import { getUser } from "@/app/actions/auth";
import { UserMenu } from "./user-menu";
import { NewSheetButton } from "./sheet-editor";

export async function Header(): Promise<React.JSX.Element> {
  const user = await getUser();

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-4">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold">Tremolo</h1>
        <Link
          href="/trash"
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          Trash
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {user && <NewSheetButton />}
        <UserMenu user={user ? { email: user.email ?? "" } : null} />
      </div>
    </header>
  );
}

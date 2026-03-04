import { getUser } from "@/app/actions/auth";
import { NewSheetButton } from "./sheet-editor";
import { UserMenu } from "./user-menu";

export async function Header(): Promise<React.JSX.Element> {
  const user = await getUser();

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-4">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold">Tremolo</h1>
      </div>
      <div className="flex items-center gap-3">
        {user && <NewSheetButton />}
        <UserMenu user={user ? { email: user.email ?? "" } : null} />
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditListDialog } from "./list-dialogs";
import { deleteList } from "@/app/actions/delete-list";

export function ListActionsMenu({
  list,
}: {
  list: { id: string; name: string };
}): React.JSX.Element {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (): Promise<void> => {
    if (!confirm(`Delete "${list.name}"? This will remove all sheets from this list.`)) {
      return;
    }

    setError(null);
    const result = await deleteList({ listId: list.id });
    if (result.success) {
      router.push("/");
    } else {
      setError("Failed to delete list");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit name
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {error && <span className="text-sm text-red-500">{error}</span>}

      <EditListDialog
        list={list}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

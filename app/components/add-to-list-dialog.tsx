"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSheetToList } from "@/app/actions/add-sheet-to-list";
import { removeSheetFromList } from "@/app/actions/remove-sheet-from-list";
import type { GetListsData } from "@/be/list/get-lists";

export function AddToListDialog({
  sheetId,
  sheetTitle,
  lists,
  open,
  onOpenChange,
  onSuccess,
}: {
  sheetId: string;
  sheetTitle: string;
  lists: GetListsData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}): React.JSX.Element {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [transpose, setTranspose] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean): void => {
    if (!newOpen) {
      setSelectedListId(null);
      setTranspose(0);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  // Find if sheet is already in any list
  const listsWithMembership = lists.map((list) => {
    const item = list.items.find((i) => i.sheetId === sheetId);
    return {
      ...list,
      isMember: item !== undefined,
      currentTranspose: item?.transpose ?? 0,
    };
  });

  const handleToggle = async (
    listId: string,
    isCurrentlyMember: boolean,
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    if (isCurrentlyMember) {
      const result = await removeSheetFromList({ listId, sheetId });
      if (result.success) {
        onSuccess?.();
      } else {
        setError("Failed to remove from list");
      }
    } else {
      setSelectedListId(listId);
    }
    setIsLoading(false);
  };

  const handleAdd = async (): Promise<void> => {
    if (!selectedListId) return;

    setIsLoading(true);
    setError(null);

    const result = await addSheetToList({
      listId: selectedListId,
      sheetId,
      transpose,
    });

    if (result.success) {
      setSelectedListId(null);
      setTranspose(0);
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError("Failed to add to list");
    }
    setIsLoading(false);
  };

  const handleClose = (): void => {
    setSelectedListId(null);
    setTranspose(0);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
          <DialogDescription>
            Add &quot;{sheetTitle}&quot; to one of your lists
          </DialogDescription>
        </DialogHeader>

        {lists.length === 0 ? (
          <div className="py-4 text-center text-sm text-zinc-500">
            No lists yet. Create a list first.
          </div>
        ) : selectedListId ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transpose">Transposition</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTranspose((t) => t - 1)}
                >
                  -
                </Button>
                <Input
                  id="transpose"
                  type="number"
                  value={transpose}
                  onChange={(e) => setTranspose(parseInt(e.target.value) || 0)}
                  className="w-20 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTranspose((t) => t + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedListId(null)}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button type="button" onClick={handleAdd} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-2">
            <ul className="max-h-64 space-y-1 overflow-auto">
              {listsWithMembership.map((list) => (
                <li key={list.id}>
                  <button
                    type="button"
                    onClick={() => handleToggle(list.id, list.isMember)}
                    disabled={isLoading}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 disabled:opacity-50"
                  >
                    <span>{list.name}</span>
                    {list.isMember ? (
                      <span className="text-xs text-zinc-500">
                        {list.currentTranspose !== 0
                          ? `(${list.currentTranspose > 0 ? "+" : ""}${list.currentTranspose})`
                          : "✓"}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

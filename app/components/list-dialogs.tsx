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
import { createList } from "@/app/actions/create-list";
import { updateList } from "@/app/actions/update-list";
import { deleteList } from "@/app/actions/delete-list";

export function CreateListDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}): React.JSX.Element {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await createList({ name });
    if (result.success) {
      setName("");
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError("Failed to create list");
    }
    setIsLoading(false);
  };

  const handleClose = (): void => {
    setName("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
          <DialogDescription>Give your list a name</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="list-name">Name</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Practice Setlist"
              required
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditListDialog({
  list,
  open,
  onOpenChange,
  onSuccess,
}: {
  list: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}): React.JSX.Element {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset name when list changes
  useState(() => {
    if (list) {
      setName(list.name);
    }
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!list) return;

    setIsLoading(true);
    setError(null);

    const result = await updateList({ listId: list.id, name });
    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError("Failed to update list");
    }
    setIsLoading(false);
  };

  const handleDelete = async (): Promise<void> => {
    if (!list) return;
    if (!confirm(`Delete "${list.name}"? This will remove all sheets from this list.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await deleteList({ listId: list.id });
    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError("Failed to delete list");
    }
    setIsLoading(false);
  };

  const handleClose = (): void => {
    setError(null);
    onOpenChange(false);
  };

  // Update name when list prop changes
  if (list && name !== list.name && !isLoading) {
    setName(list.name);
  }

  if (!list) return <></>;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
          <DialogDescription>Rename or delete this list</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-list-name">Name</Label>
            <Input
              id="edit-list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
            <div className="flex gap-2 sm:ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

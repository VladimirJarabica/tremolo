import { z } from "zod";

// List schemas
export const createListSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

export type CreateListInput = z.infer<typeof createListSchema>;

export const updateListSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

export type UpdateListInput = z.infer<typeof updateListSchema>;

export const deleteListSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
});

export type DeleteListInput = z.infer<typeof deleteListSchema>;

export const getListSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
});

export type GetListInput = z.infer<typeof getListSchema>;

// List item schemas
export const addSheetToListSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  sheetId: z.string().min(1, "Sheet ID is required"),
  transpose: z.number().int().default(0),
});

export type AddSheetToListInput = z.infer<typeof addSheetToListSchema>;

export const removeSheetFromListSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  sheetId: z.string().min(1, "Sheet ID is required"),
});

export type RemoveSheetFromListInput = z.infer<
  typeof removeSheetFromListSchema
>;

export const updateListItemTransposeSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  sheetId: z.string().min(1, "Sheet ID is required"),
  transpose: z.number().int(),
});

export type UpdateListItemTransposeInput = z.infer<
  typeof updateListItemTransposeSchema
>;

export const reorderListItemSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  sheetId: z.string().min(1, "Sheet ID is required"),
  direction: z.enum(["up", "down"]),
});

export type ReorderListItemInput = z.infer<typeof reorderListItemSchema>;

export const updateListOrderSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  sheetIdsOrder: z.array(z.string().min(1)),
});

export type UpdateListOrderInput = z.infer<typeof updateListOrderSchema>;

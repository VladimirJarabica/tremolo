import { z } from "zod";

export const createSheetSchema = z.object({
  content: z.string().min(1, "Content is required"),
  tagIds: z.array(z.string()).optional(),
});

export type CreateSheetInput = z.infer<typeof createSheetSchema>;

export const updateSheetSchema = z.object({
  sheetId: z.string().min(1, "Sheet ID is required"),
  content: z.string().min(1, "Content is required").optional(),
  tagIds: z.array(z.string()).optional(),
});

export type UpdateSheetInput = z.infer<typeof updateSheetSchema>;

export const deleteSheetSchema = z.object({
  sheetId: z.string().min(1, "Sheet ID is required"),
});

export type DeleteSheetInput = z.infer<typeof deleteSheetSchema>;

export const getSheetSchema = z.object({
  sheetId: z.string().min(1, "Sheet ID is required"),
});

export type GetSheetInput = z.infer<typeof getSheetSchema>;

export const getSheetsSchema = z.object({
  tagId: z.string().optional(),
});

export type GetSheetsInput = z.infer<typeof getSheetsSchema>;

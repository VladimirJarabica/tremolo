import { z } from "zod";
import { Meter, Scale } from "@/be/db/enums";

export const createSheetSchema = z.object({
  content: z.string().min(1, "Content is required"),
  title: z.string().optional(),
  author: z.string().max(200).optional(),
  source: z.string().max(500).optional(),
  meter: z.enum(Meter),
  tempo: z.number().int().positive(),
  scale: z.enum(Scale),
  tagIds: z.array(z.string()).optional(),
});

export type CreateSheetInput = z.infer<typeof createSheetSchema>;

export const updateSheetSchema = z.object({
  sheetId: z.string().min(1, "Sheet ID is required"),
  content: z.string().min(1, "Content is required").optional(),
  title: z.string().optional(),
  author: z.string().max(200).optional(),
  source: z.string().max(500).optional(),
  meter: z.enum(Meter).optional(),
  tempo: z.number().int().positive().optional(),
  scale: z.enum(Scale).optional(),
  tagIds: z.array(z.string()).optional(),
});

export type UpdateSheetInput = z.infer<typeof updateSheetSchema>;

export const deleteSheetSchema = z.object({
  sheetId: z.string().min(1, "Sheet ID is required"),
});

export type DeleteSheetInput = z.infer<typeof deleteSheetSchema>;

export const restoreSheetSchema = z.object({
  sheetId: z.string().min(1, "Sheet ID is required"),
});

export type RestoreSheetInput = z.infer<typeof restoreSheetSchema>;

export const getSheetSchema = z.object({
  sheetId: z.string().min(1, "Sheet ID is required"),
});

export type GetSheetInput = z.infer<typeof getSheetSchema>;

export const getSheetBySlugSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

export type GetSheetBySlugInput = z.infer<typeof getSheetBySlugSchema>;

export const getSheetsSchema = z.object({
  tagId: z.string().optional(),
});

export type GetSheetsInput = z.infer<typeof getSheetsSchema>;

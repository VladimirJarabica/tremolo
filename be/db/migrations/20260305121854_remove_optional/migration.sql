/*
  Warnings:

  - Made the column `meter` on table `Sheet` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tempo` on table `Sheet` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Sheet" ALTER COLUMN "meter" SET NOT NULL,
ALTER COLUMN "tempo" SET NOT NULL;

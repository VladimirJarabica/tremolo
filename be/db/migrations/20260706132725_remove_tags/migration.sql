/*
  Warnings:

  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SheetToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_SheetToTag" DROP CONSTRAINT "_SheetToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_SheetToTag" DROP CONSTRAINT "_SheetToTag_B_fkey";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "_SheetToTag";

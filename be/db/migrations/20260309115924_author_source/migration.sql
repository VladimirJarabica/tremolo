-- AlterTable
ALTER TABLE "List" ALTER COLUMN "sheetIdsOrder" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Sheet" ADD COLUMN     "author" TEXT,
ADD COLUMN     "source" TEXT;

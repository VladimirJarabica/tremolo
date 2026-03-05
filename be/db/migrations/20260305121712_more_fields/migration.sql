-- CreateEnum
CREATE TYPE "Meter" AS ENUM ('m_4_4', 'm_3_4', 'm_2_4', 'm_6_8', 'm_3_8', 'm_2_2');

-- AlterTable
ALTER TABLE "Sheet" ADD COLUMN     "meter" "Meter",
ADD COLUMN     "tempo" INTEGER;

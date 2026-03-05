-- CreateEnum
CREATE TYPE "Scale" AS ENUM ('C', 'G', 'D', 'A', 'E', 'B', 'Fs', 'Cs', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb');

-- AlterTable
ALTER TABLE "Sheet" ADD COLUMN     "scale" "Scale";

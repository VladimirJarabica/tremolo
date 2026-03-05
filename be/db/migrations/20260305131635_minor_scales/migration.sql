-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Scale" ADD VALUE 'Am';
ALTER TYPE "Scale" ADD VALUE 'Em';
ALTER TYPE "Scale" ADD VALUE 'Bm';
ALTER TYPE "Scale" ADD VALUE 'Fsm';
ALTER TYPE "Scale" ADD VALUE 'Csm';
ALTER TYPE "Scale" ADD VALUE 'Gsm';
ALTER TYPE "Scale" ADD VALUE 'Dsm';
ALTER TYPE "Scale" ADD VALUE 'Asm';
ALTER TYPE "Scale" ADD VALUE 'Dm';
ALTER TYPE "Scale" ADD VALUE 'Gm';
ALTER TYPE "Scale" ADD VALUE 'Cm';
ALTER TYPE "Scale" ADD VALUE 'Fm';
ALTER TYPE "Scale" ADD VALUE 'Bbm';
ALTER TYPE "Scale" ADD VALUE 'Ebm';
ALTER TYPE "Scale" ADD VALUE 'Abm';

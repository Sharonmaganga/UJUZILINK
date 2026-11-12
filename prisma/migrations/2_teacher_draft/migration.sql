-- CreateTable
CREATE TABLE "TeacherDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "idPhotoUrl" TEXT,
    "profilePhotoUrl" TEXT,
    "premisesPhotoUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherDraft_userId_key" ON "TeacherDraft"("userId");

-- AddForeignKey
ALTER TABLE "TeacherDraft" ADD CONSTRAINT "TeacherDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


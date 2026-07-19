-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('OPEN', 'CLOSED', 'AWARDED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'SHORTLISTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "sponsor_grants" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deadline" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "requirements" TEXT,
    "maxApplicants" INTEGER NOT NULL DEFAULT 50,
    "status" "GrantStatus" NOT NULL DEFAULT 'OPEN',
    "sponsorName" TEXT NOT NULL,
    "sponsorLogo" TEXT,
    "sponsorWebsite" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsor_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grant_applications" (
    "id" TEXT NOT NULL,
    "pitch" TEXT NOT NULL,
    "projectUrl" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "grantId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "projectId" TEXT,

    CONSTRAINT "grant_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grant_applications_grantId_applicantId_key" ON "grant_applications"("grantId", "applicantId");

-- AddForeignKey
ALTER TABLE "grant_applications" ADD CONSTRAINT "grant_applications_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "sponsor_grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_applications" ADD CONSTRAINT "grant_applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_applications" ADD CONSTRAINT "grant_applications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

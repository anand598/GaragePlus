-- CreateTable
CREATE TABLE "InvoiceActivity" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "actorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceActivity_workshopId_createdAt_idx" ON "InvoiceActivity"("workshopId", "createdAt");

-- CreateIndex
CREATE INDEX "InvoiceActivity_invoiceId_createdAt_idx" ON "InvoiceActivity"("invoiceId", "createdAt");

-- AddForeignKey
ALTER TABLE "InvoiceActivity" ADD CONSTRAINT "InvoiceActivity_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceActivity" ADD CONSTRAINT "InvoiceActivity_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

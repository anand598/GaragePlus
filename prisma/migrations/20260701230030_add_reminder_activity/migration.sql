-- CreateTable
CREATE TABLE "ReminderActivity" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "workStatus" "WorkStatus" NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentByName" TEXT,

    CONSTRAINT "ReminderActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReminderActivity_workshopId_sentAt_idx" ON "ReminderActivity"("workshopId", "sentAt");

-- CreateIndex
CREATE INDEX "ReminderActivity_invoiceId_idx" ON "ReminderActivity"("invoiceId");

-- AddForeignKey
ALTER TABLE "ReminderActivity" ADD CONSTRAINT "ReminderActivity_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderActivity" ADD CONSTRAINT "ReminderActivity_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

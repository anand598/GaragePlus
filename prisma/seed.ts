import bcrypt from "bcryptjs";
import { PrismaClient, PricingTier, PaymentMode, PaymentStatus, Role, WorkStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.sparePart.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workshop.deleteMany();

  const workshop = await prisma.workshop.create({
    data: {
      name: "ABC Motors",
      phone: "+91 98765 43210",
      email: "hello@abc-motors.example",
      address: "Madhapur, Hyderabad, Telangana",
      gstNumber: "36ABCDE1234F1Z8",
      invoicePrefix: "INV-2026",
      taxPercentage: 18,
      businessHours: "Mon-Sat, 9:00 AM - 7:00 PM"
    }
  });

  await prisma.user.create({
    data: {
      workshopId: workshop.id,
      name: "Garage Owner",
      email: "owner@garagepro.app",
      passwordHash: await bcrypt.hash("password123", 10),
      role: Role.OWNER
    }
  });

  const [ramesh, kumar, suresh, mahesh] = await Promise.all([
    prisma.customer.create({
      data: {
        workshopId: workshop.id,
        name: "Ramesh",
        phone: "9876543210",
        email: "ramesh@example.com",
        address: "Kukatpally, Hyderabad"
      }
    }),
    prisma.customer.create({
      data: {
        workshopId: workshop.id,
        name: "Kumar",
        phone: "9876500001",
        email: "kumar@example.com",
        address: "Miyapur, Hyderabad"
      }
    }),
    prisma.customer.create({
      data: {
        workshopId: workshop.id,
        name: "Suresh",
        phone: "9876500002",
        email: "suresh@example.com"
      }
    }),
    prisma.customer.create({
      data: {
        workshopId: workshop.id,
        name: "Mahesh",
        phone: "9876500003",
        email: "mahesh@example.com"
      }
    })
  ]);

  const [v1, v2, v3, v4] = await Promise.all([
    prisma.vehicle.create({
      data: {
        customerId: ramesh.id,
        vehicleNumber: "TS09AB1234",
        brand: "Hyundai",
        model: "i20",
        year: 2022,
        fuelType: "Petrol",
        odometer: 28000
      }
    }),
    prisma.vehicle.create({
      data: {
        customerId: kumar.id,
        vehicleNumber: "TS08CD5678",
        brand: "Maruti Suzuki",
        model: "Baleno",
        year: 2020,
        fuelType: "Petrol",
        odometer: 42000
      }
    }),
    prisma.vehicle.create({
      data: {
        customerId: suresh.id,
        vehicleNumber: "TS07EF9999",
        brand: "Honda",
        model: "City",
        year: 2021,
        fuelType: "Petrol",
        odometer: 31500
      }
    }),
    prisma.vehicle.create({
      data: {
        customerId: mahesh.id,
        vehicleNumber: "TS10GH1111",
        brand: "Tata",
        model: "Nexon",
        year: 2023,
        fuelType: "Diesel",
        odometer: 13000
      }
    })
  ]);

  const services = await Promise.all([
    prisma.service.create({
      data: {
        workshopId: workshop.id,
        name: "Periodic Service",
        category: "Maintenance",
        description: "Comprehensive inspection, oil and filter change",
        estimatedTime: "4 hours",
        standardPrice: 2500,
        premiumPrice: 4200,
        luxuryPrice: 6500
      }
    }),
    prisma.service.create({
      data: {
        workshopId: workshop.id,
        name: "Brake Service",
        category: "Repair",
        description: "Brake pad inspection and replacement",
        estimatedTime: "2 hours",
        standardPrice: 1800,
        premiumPrice: 3200,
        luxuryPrice: 5200
      }
    })
  ]);

  const parts = await Promise.all([
    prisma.sparePart.create({
      data: {
        workshopId: workshop.id,
        name: "Engine Oil",
        category: "Lubricants",
        brand: "Castrol",
        partNumber: "EO-5W30",
        unit: "Litre",
        standardPrice: 850,
        premiumPrice: 1200,
        luxuryPrice: 1650,
        stockQuantity: 24
      }
    }),
    prisma.sparePart.create({
      data: {
        workshopId: workshop.id,
        name: "Oil Filter",
        category: "Filters",
        brand: "Bosch",
        partNumber: "OF-202",
        unit: "Piece",
        standardPrice: 350,
        premiumPrice: 480,
        luxuryPrice: 700,
        stockQuantity: 16
      }
    }),
    prisma.sparePart.create({
      data: {
        workshopId: workshop.id,
        name: "Brake Pads",
        category: "Brakes",
        brand: "TVS",
        partNumber: "BP-991",
        unit: "Set",
        standardPrice: 1800,
        premiumPrice: 2400,
        luxuryPrice: 3200,
        stockQuantity: null
      }
    })
  ]);

  const invoice = await prisma.invoice.create({
    data: {
      workshopId: workshop.id,
      customerId: ramesh.id,
      vehicleId: v1.id,
      invoiceNumber: "INV-2026-1001",
      pricingTier: PricingTier.STANDARD,
      paymentStatus: PaymentStatus.PAID,
      paymentMode: PaymentMode.UPI,
      workStatus: WorkStatus.READY_FOR_DELIVERY,
      subtotal: 3700,
      discount: 200,
      taxPercentage: 18,
      taxAmount: 630,
      grandTotal: 4130,
      amountPaid: 4130,
      dueDate: new Date()
    }
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice.id,
        itemType: "SERVICE",
        sourceId: services[0].id,
        name: services[0].name,
        category: services[0].category,
        quantity: 1,
        unitPrice: 2500,
        totalPrice: 2500
      },
      {
        invoiceId: invoice.id,
        itemType: "PART",
        sourceId: parts[0].id,
        name: parts[0].name,
        category: parts[0].category,
        quantity: 1,
        unitPrice: 850,
        totalPrice: 850
      },
      {
        invoiceId: invoice.id,
        itemType: "PART",
        sourceId: parts[1].id,
        name: parts[1].name,
        category: parts[1].category,
        quantity: 1,
        unitPrice: 350,
        totalPrice: 350
      }
    ]
  });

  await prisma.invoice.createMany({
    data: [
      {
        workshopId: workshop.id,
        customerId: kumar.id,
        vehicleId: v2.id,
        invoiceNumber: "INV-2026-1002",
        pricingTier: PricingTier.PREMIUM,
        paymentStatus: PaymentStatus.UNPAID,
        workStatus: WorkStatus.IN_SERVICE,
        subtotal: 6800,
        discount: 0,
        taxPercentage: 18,
        taxAmount: 1224,
        grandTotal: 8024,
        amountPaid: 0,
        dueDate: new Date()
      },
      {
        workshopId: workshop.id,
        customerId: suresh.id,
        vehicleId: v3.id,
        invoiceNumber: "INV-2026-1003",
        pricingTier: PricingTier.STANDARD,
        paymentStatus: PaymentStatus.PAID,
        paymentMode: PaymentMode.CASH,
        workStatus: WorkStatus.DELIVERED,
        subtotal: 3450,
        discount: 0,
        taxPercentage: 18,
        taxAmount: 621,
        grandTotal: 4071,
        amountPaid: 4071,
        deliveredAt: new Date()
      },
      {
        workshopId: workshop.id,
        customerId: mahesh.id,
        vehicleId: v4.id,
        invoiceNumber: "INV-2026-1004",
        pricingTier: PricingTier.PREMIUM,
        paymentStatus: PaymentStatus.PAID,
        paymentMode: PaymentMode.CARD,
        workStatus: WorkStatus.IN_SERVICE,
        subtotal: 5600,
        discount: 0,
        taxPercentage: 18,
        taxAmount: 1008,
        grandTotal: 6608,
        amountPaid: 6608
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

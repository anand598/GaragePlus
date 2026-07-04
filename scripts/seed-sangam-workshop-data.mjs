import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const workshopEmail = "owner@sangamautomobiles.local";
const defaultStaffPassword = "password123";

const staffUsers = [
  { name: "Sangam Workshop Manager", email: "manager@sangamautomobiles.local", role: "MANAGER" },
  { name: "Sangam Service Advisor", email: "advisor@sangamautomobiles.local", role: "MANAGER" },
  { name: "Sangam Billing Desk", email: "cashier@sangamautomobiles.local", role: "CASHIER" },
  { name: "Sangam Floor Technician", email: "technician@sangamautomobiles.local", role: "STAFF" },
  { name: "Sangam Delivery Coordinator", email: "delivery@sangamautomobiles.local", role: "STAFF" }
];

const customers = [
  { name: "K. Raghavender", phone: "9849011201", email: "raghavender.k@sangamauto.in", address: "Sangeet Nagar, Kukatpally, Hyderabad" },
  { name: "M. Swathi", phone: "9849011202", email: "swathi.m@sangamauto.in", address: "Vivekananda Nagar, Kukatpally, Hyderabad" },
  { name: "P. Vinay Kumar", phone: "9849011203", email: "vinay.kumar@sangamauto.in", address: "Nizampet Road, Kukatpally, Hyderabad" },
  { name: "S. Harika", phone: "9849011204", email: "harika.s@sangamauto.in", address: "KPHB Phase 5, Hyderabad" },
  { name: "A. Mahender", phone: "9849011205", email: "mahender.a@sangamauto.in", address: "Madinaguda, Hyderabad" },
  { name: "N. Srujana", phone: "9849011206", email: "srujana.n@sangamauto.in", address: "Pragathi Nagar, Hyderabad" },
  { name: "T. Pradeep", phone: "9849011207", email: "pradeep.t@sangamauto.in", address: "Miyapur, Hyderabad" },
  { name: "G. Keerthi", phone: "9849011208", email: "keerthi.g@sangamauto.in", address: "Bachupally, Hyderabad" },
  { name: "R. Naveen", phone: "9849011209", email: "naveen.r@sangamauto.in", address: "Hafeezpet, Hyderabad" },
  { name: "D. Anusha", phone: "9849011210", email: "anusha.d@sangamauto.in", address: "Allwyn Colony, Hyderabad" },
  { name: "V. Bhaskar", phone: "9849011211", email: "bhaskar.v@sangamauto.in", address: "Moosapet, Hyderabad" },
  { name: "L. Tejaswini", phone: "9849011212", email: "tejaswini.l@sangamauto.in", address: "Chandanagar, Hyderabad" },
  { name: "Y. Karthik", phone: "9849011213", email: "karthik.y@sangamauto.in", address: "Ameenpur, Hyderabad" },
  { name: "P. Santhosh", phone: "9849011214", email: "santhosh.p@sangamauto.in", address: "Jagadgirigutta, Hyderabad" },
  { name: "C. Renuka", phone: "9849011215", email: "renuka.c@sangamauto.in", address: "Hydernagar, Hyderabad" },
  { name: "B. Suman", phone: "9849011216", email: "suman.b@sangamauto.in", address: "Kukatpally Housing Board, Hyderabad" }
];

const vehicles = [
  { customerPhone: "9849011201", vehicleNumber: "TS08HX1201", brand: "Hyundai", model: "i20", year: 2021, fuelType: "Petrol", odometer: 38210 },
  { customerPhone: "9849011201", vehicleNumber: "TS08HX1202", brand: "Maruti Suzuki", model: "Ertiga", year: 2019, fuelType: "Petrol", odometer: 61240 },
  { customerPhone: "9849011202", vehicleNumber: "TS09LA2201", brand: "Honda", model: "City", year: 2022, fuelType: "Petrol", odometer: 27400 },
  { customerPhone: "9849011203", vehicleNumber: "TS10MB3301", brand: "Toyota", model: "Innova Crysta", year: 2020, fuelType: "Diesel", odometer: 75880 },
  { customerPhone: "9849011204", vehicleNumber: "TS07QK4401", brand: "Kia", model: "Seltos", year: 2023, fuelType: "Petrol", odometer: 15840 },
  { customerPhone: "9849011205", vehicleNumber: "TS08PQ5501", brand: "Tata", model: "Nexon", year: 2021, fuelType: "Diesel", odometer: 46890 },
  { customerPhone: "9849011206", vehicleNumber: "TS09RS6601", brand: "Mahindra", model: "XUV300", year: 2022, fuelType: "Petrol", odometer: 24550 },
  { customerPhone: "9849011207", vehicleNumber: "TS10TU7701", brand: "Renault", model: "Kiger", year: 2023, fuelType: "Petrol", odometer: 13620 },
  { customerPhone: "9849011208", vehicleNumber: "TS11VW8801", brand: "Skoda", model: "Slavia", year: 2022, fuelType: "Petrol", odometer: 19210 },
  { customerPhone: "9849011209", vehicleNumber: "TS12YZ9901", brand: "Volkswagen", model: "Taigun", year: 2024, fuelType: "Petrol", odometer: 8940 },
  { customerPhone: "9849011210", vehicleNumber: "TS08AB1010", brand: "Hyundai", model: "Venue", year: 2021, fuelType: "Petrol", odometer: 41230 },
  { customerPhone: "9849011211", vehicleNumber: "TS09CD1111", brand: "Maruti Suzuki", model: "Baleno", year: 2020, fuelType: "Petrol", odometer: 52330 },
  { customerPhone: "9849011212", vehicleNumber: "TS10EF1212", brand: "Tata", model: "Altroz", year: 2023, fuelType: "Petrol", odometer: 11870 },
  { customerPhone: "9849011213", vehicleNumber: "TS11GH1313", brand: "Honda", model: "Amaze", year: 2019, fuelType: "Diesel", odometer: 68420 },
  { customerPhone: "9849011214", vehicleNumber: "TS12IJ1414", brand: "Toyota", model: "Glanza", year: 2022, fuelType: "Petrol", odometer: 22890 },
  { customerPhone: "9849011215", vehicleNumber: "TS13KL1515", brand: "Kia", model: "Carens", year: 2024, fuelType: "Diesel", odometer: 9720 },
  { customerPhone: "9849011216", vehicleNumber: "TS14MN1616", brand: "Mahindra", model: "Scorpio N", year: 2023, fuelType: "Diesel", odometer: 21140 },
  { customerPhone: "9849011206", vehicleNumber: "TS15OP1706", brand: "Hyundai", model: "Creta", year: 2022, fuelType: "Diesel", odometer: 30110 }
];

const services = [
  { name: "Periodic Service", category: "Maintenance", description: "Engine oil, oil filter, air filter check, fluid top-up, and full health inspection", estimatedTime: "4 Hours", standardPrice: 2800, premiumPrice: 4300, luxuryPrice: 6900 },
  { name: "Brake Overhaul", category: "Repair", description: "Brake pad inspection, disc cleaning, caliper service, and brake oil bleeding", estimatedTime: "3 Hours", standardPrice: 2200, premiumPrice: 3600, luxuryPrice: 5400 },
  { name: "AC Service", category: "Maintenance", description: "AC cooling test, vent cleaning, gas level inspection, and cabin filter check", estimatedTime: "2.5 Hours", standardPrice: 1800, premiumPrice: 3000, luxuryPrice: 4700 },
  { name: "Wheel Alignment & Balancing", category: "Tyres", description: "Four-wheel alignment with balancing and steering correction", estimatedTime: "1.5 Hours", standardPrice: 900, premiumPrice: 1400, luxuryPrice: 2100 },
  { name: "Suspension Inspection", category: "Inspection", description: "Shock absorber, link rod, bush, and front-end suspension inspection", estimatedTime: "2 Hours", standardPrice: 1200, premiumPrice: 1900, luxuryPrice: 2900 },
  { name: "Battery & Charging Check", category: "Electrical", description: "Battery voltage, alternator output, and terminal condition test", estimatedTime: "45 Minutes", standardPrice: 450, premiumPrice: 700, luxuryPrice: 1100 },
  { name: "Clutch Service", category: "Repair", description: "Clutch play inspection, hydraulic line check, and transmission-side evaluation", estimatedTime: "4 Hours", standardPrice: 2600, premiumPrice: 4200, luxuryPrice: 6400 },
  { name: "Engine Diagnostics", category: "Diagnostics", description: "OBD scan, fault code analysis, live data review, and troubleshooting report", estimatedTime: "1 Hour", standardPrice: 850, premiumPrice: 1400, luxuryPrice: 2200 },
  { name: "Cooling System Service", category: "Maintenance", description: "Coolant flush, hose inspection, radiator wash, and fan operation check", estimatedTime: "2 Hours", standardPrice: 1500, premiumPrice: 2400, luxuryPrice: 3600 },
  { name: "Transmission Oil Service", category: "Maintenance", description: "Transmission fluid drain, refill, and drive response inspection", estimatedTime: "2.5 Hours", standardPrice: 2000, premiumPrice: 3200, luxuryPrice: 4900 },
  { name: "Ceramic Wash & Detailing", category: "Detailing", description: "Exterior foam wash, interior vacuuming, polishing, and tyre dressing", estimatedTime: "3 Hours", standardPrice: 1600, premiumPrice: 2800, luxuryPrice: 4500 },
  { name: "Pre-Purchase Inspection", category: "Inspection", description: "Comprehensive used-car evaluation with engine, body, tyres, and scan report", estimatedTime: "2 Hours", standardPrice: 1800, premiumPrice: 2600, luxuryPrice: 3800 },
  { name: "Doorstep Pickup & Drop", category: "Convenience", description: "Scheduled vehicle pickup and drop within workshop service radius", estimatedTime: "Flexible", standardPrice: 500, premiumPrice: 800, luxuryPrice: 1200 },
  { name: "Diesel Injector Cleaning", category: "Fuel System", description: "Injector cleaning, combustion check, and throttle response validation", estimatedTime: "3.5 Hours", standardPrice: 3200, premiumPrice: 4700, luxuryPrice: 6800 }
];

const spareParts = [
  { name: "Engine Oil 5W30", category: "Lubricants", brand: "Castrol", partNumber: "EO-5W30-CST", unit: "Litre", standardPrice: 920, premiumPrice: 1280, luxuryPrice: 1740, stockQuantity: 48 },
  { name: "Engine Oil 0W20", category: "Lubricants", brand: "Mobil", partNumber: "EO-0W20-MBL", unit: "Litre", standardPrice: 1080, premiumPrice: 1490, luxuryPrice: 1980, stockQuantity: 32 },
  { name: "Oil Filter", category: "Filters", brand: "Bosch", partNumber: "FLT-OIL-202", unit: "Piece", standardPrice: 360, premiumPrice: 510, luxuryPrice: 720, stockQuantity: 44 },
  { name: "Air Filter", category: "Filters", brand: "Mann", partNumber: "FLT-AIR-118", unit: "Piece", standardPrice: 580, premiumPrice: 790, luxuryPrice: 1080, stockQuantity: 26 },
  { name: "Cabin AC Filter", category: "Filters", brand: "Mahle", partNumber: "FLT-CAB-041", unit: "Piece", standardPrice: 640, premiumPrice: 860, luxuryPrice: 1180, stockQuantity: 21 },
  { name: "Brake Pads Front", category: "Brakes", brand: "TVS", partNumber: "BRK-PAD-FR", unit: "Set", standardPrice: 1950, premiumPrice: 2520, luxuryPrice: 3340, stockQuantity: 18 },
  { name: "Brake Pads Rear", category: "Brakes", brand: "Rane", partNumber: "BRK-PAD-RR", unit: "Set", standardPrice: 1820, premiumPrice: 2380, luxuryPrice: 3190, stockQuantity: 14 },
  { name: "Brake Disc Rotor", category: "Brakes", brand: "Bosch", partNumber: "BRK-DSC-220", unit: "Piece", standardPrice: 2850, premiumPrice: 3520, luxuryPrice: 4600, stockQuantity: 10 },
  { name: "Brake Fluid DOT4", category: "Fluids", brand: "Motul", partNumber: "FLD-DOT4-01", unit: "Bottle", standardPrice: 420, premiumPrice: 590, luxuryPrice: 820, stockQuantity: 30 },
  { name: "Coolant Long Life", category: "Fluids", brand: "3M", partNumber: "CLT-LL-02", unit: "Litre", standardPrice: 380, premiumPrice: 560, luxuryPrice: 790, stockQuantity: 35 },
  { name: "Radiator Hose Upper", category: "Cooling", brand: "Valeo", partNumber: "CLG-HOSE-UP", unit: "Piece", standardPrice: 720, premiumPrice: 990, luxuryPrice: 1360, stockQuantity: 12 },
  { name: "Radiator Hose Lower", category: "Cooling", brand: "Valeo", partNumber: "CLG-HOSE-LW", unit: "Piece", standardPrice: 710, premiumPrice: 970, luxuryPrice: 1320, stockQuantity: 11 },
  { name: "Battery 45AH", category: "Electrical", brand: "Amaron", partNumber: "BAT-45AH-01", unit: "Piece", standardPrice: 4800, premiumPrice: 5450, luxuryPrice: 6400, stockQuantity: 8 },
  { name: "Battery 60AH", category: "Electrical", brand: "Exide", partNumber: "BAT-60AH-02", unit: "Piece", standardPrice: 6200, premiumPrice: 6980, luxuryPrice: 8050, stockQuantity: 6 },
  { name: "Wiper Blade 16 Inch", category: "Wipers", brand: "Michelin", partNumber: "WPR-16-001", unit: "Piece", standardPrice: 320, premiumPrice: 470, luxuryPrice: 650, stockQuantity: 20 },
  { name: "Wiper Blade 24 Inch", category: "Wipers", brand: "Michelin", partNumber: "WPR-24-001", unit: "Piece", standardPrice: 360, premiumPrice: 520, luxuryPrice: 720, stockQuantity: 18 },
  { name: "Spark Plug Iridium", category: "Ignition", brand: "NGK", partNumber: "SPK-IRD-04", unit: "Piece", standardPrice: 780, premiumPrice: 1020, luxuryPrice: 1380, stockQuantity: 28 },
  { name: "Headlight Bulb H4", category: "Electrical", brand: "Philips", partNumber: "BLB-H4-60", unit: "Piece", standardPrice: 290, premiumPrice: 430, luxuryPrice: 610, stockQuantity: 36 },
  { name: "Headlight Bulb H7", category: "Electrical", brand: "Osram", partNumber: "BLB-H7-55", unit: "Piece", standardPrice: 330, premiumPrice: 470, luxuryPrice: 660, stockQuantity: 24 },
  { name: "Clutch Plate Kit", category: "Transmission", brand: "Sachs", partNumber: "CLT-KIT-11", unit: "Set", standardPrice: 4850, premiumPrice: 5920, luxuryPrice: 7250, stockQuantity: 7 },
  { name: "Transmission Oil ATF", category: "Lubricants", brand: "Shell", partNumber: "ATF-SHL-01", unit: "Litre", standardPrice: 850, premiumPrice: 1180, luxuryPrice: 1590, stockQuantity: 19 },
  { name: "Wheel Bearing Front", category: "Suspension", brand: "SKF", partNumber: "WHL-BRG-FR", unit: "Piece", standardPrice: 1240, premiumPrice: 1680, luxuryPrice: 2290, stockQuantity: 13 },
  { name: "Shock Absorber Front", category: "Suspension", brand: "Monroe", partNumber: "SHK-FR-221", unit: "Piece", standardPrice: 3650, premiumPrice: 4490, luxuryPrice: 5520, stockQuantity: 9 },
  { name: "Shock Absorber Rear", category: "Suspension", brand: "Monroe", partNumber: "SHK-RR-222", unit: "Piece", standardPrice: 3480, premiumPrice: 4290, luxuryPrice: 5260, stockQuantity: 9 },
  { name: "Tyre Valve Set", category: "Tyres", brand: "Bridgestone", partNumber: "TYR-VLV-04", unit: "Set", standardPrice: 120, premiumPrice: 180, luxuryPrice: 250, stockQuantity: 40 },
  { name: "Fuel Injector Cleaner", category: "Fuel System", brand: "Liqui Moly", partNumber: "FIC-LM-01", unit: "Bottle", standardPrice: 540, premiumPrice: 760, luxuryPrice: 1020, stockQuantity: 17 },
  { name: "Throttle Body Cleaner", category: "Fuel System", brand: "3M", partNumber: "TBC-3M-02", unit: "Can", standardPrice: 450, premiumPrice: 650, luxuryPrice: 890, stockQuantity: 16 },
  { name: "Door Latch Assembly", category: "Body Parts", brand: "Uno Minda", partNumber: "DRL-ASM-06", unit: "Piece", standardPrice: 1180, premiumPrice: 1590, luxuryPrice: 2160, stockQuantity: 5 },
  { name: "Side Mirror Assembly", category: "Body Parts", brand: "Lumax", partNumber: "SMR-ASY-12", unit: "Piece", standardPrice: 2450, premiumPrice: 3180, luxuryPrice: 4120, stockQuantity: 4 },
  { name: "Fuse Assorted Pack", category: "Electrical", brand: "Uno Minda", partNumber: "FUS-SET-01", unit: "Box", standardPrice: 190, premiumPrice: 280, luxuryPrice: 390, stockQuantity: 22 }
];

const invoices = [
  {
    invoiceNumber: "INV-SAN-2001",
    customerPhone: "9849011201",
    vehicleNumber: "TS08HX1201",
    pricingTier: "STANDARD",
    paymentStatus: "PAID",
    paymentMode: "UPI",
    workStatus: "DELIVERED",
    discount: 200,
    taxPercentage: 18,
    amountPaid: null,
    createdAt: "2026-06-18T04:00:00.000Z",
    dueDate: "2026-06-18T12:00:00.000Z",
    deliveredAt: "2026-06-18T12:45:00.000Z",
    notes: "Regular service visit with filter replacement.",
    items: [
      { itemType: "SERVICE", name: "Periodic Service", quantity: 1 },
      { itemType: "PART", name: "Engine Oil 5W30", quantity: 4 },
      { itemType: "PART", name: "Oil Filter", quantity: 1 },
      { itemType: "PART", name: "Air Filter", quantity: 1 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2002",
    customerPhone: "9849011202",
    vehicleNumber: "TS09LA2201",
    pricingTier: "PREMIUM",
    paymentStatus: "PARTIAL",
    paymentMode: "CARD",
    workStatus: "READY_FOR_DELIVERY",
    discount: 0,
    taxPercentage: 18,
    amountPaid: 4000,
    createdAt: "2026-06-19T05:15:00.000Z",
    dueDate: "2026-06-19T14:00:00.000Z",
    notes: "Brake noise complaint resolved; waiting for final pickup.",
    items: [
      { itemType: "SERVICE", name: "Brake Overhaul", quantity: 1 },
      { itemType: "PART", name: "Brake Pads Front", quantity: 1 },
      { itemType: "PART", name: "Brake Fluid DOT4", quantity: 1 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2003",
    customerPhone: "9849011203",
    vehicleNumber: "TS10MB3301",
    pricingTier: "LUXURY",
    paymentStatus: "UNPAID",
    paymentMode: null,
    workStatus: "RECEIVED",
    discount: 0,
    taxPercentage: 18,
    amountPaid: 0,
    createdAt: "2026-06-20T06:10:00.000Z",
    dueDate: "2026-06-21T11:30:00.000Z",
    notes: "Clutch response weak; diagnosis and estimate shared.",
    items: [
      { itemType: "SERVICE", name: "Engine Diagnostics", quantity: 1 },
      { itemType: "SERVICE", name: "Clutch Service", quantity: 1 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2004",
    customerPhone: "9849011204",
    vehicleNumber: "TS07QK4401",
    pricingTier: "PREMIUM",
    paymentStatus: "PAID",
    paymentMode: "CASH",
    workStatus: "DELIVERED",
    discount: 150,
    taxPercentage: 18,
    amountPaid: null,
    createdAt: "2026-06-21T04:50:00.000Z",
    dueDate: "2026-06-21T11:30:00.000Z",
    deliveredAt: "2026-06-21T12:00:00.000Z",
    notes: "AC cooling restored with filter replacement and balancing.",
    items: [
      { itemType: "SERVICE", name: "AC Service", quantity: 1 },
      { itemType: "SERVICE", name: "Wheel Alignment & Balancing", quantity: 1 },
      { itemType: "PART", name: "Cabin AC Filter", quantity: 1 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2005",
    customerPhone: "9849011205",
    vehicleNumber: "TS08PQ5501",
    pricingTier: "STANDARD",
    paymentStatus: "PARTIAL",
    paymentMode: "UPI",
    workStatus: "IN_SERVICE",
    discount: 100,
    taxPercentage: 18,
    amountPaid: 2500,
    createdAt: "2026-06-23T05:00:00.000Z",
    dueDate: "2026-06-23T16:30:00.000Z",
    notes: "Suspension knocking issue under inspection.",
    items: [
      { itemType: "SERVICE", name: "Suspension Inspection", quantity: 1 },
      { itemType: "PART", name: "Shock Absorber Front", quantity: 2 },
      { itemType: "PART", name: "Wheel Bearing Front", quantity: 1 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2006",
    customerPhone: "9849011206",
    vehicleNumber: "TS09RS6601",
    pricingTier: "STANDARD",
    paymentStatus: "PAID",
    paymentMode: "CARD",
    workStatus: "DELIVERED",
    discount: 0,
    taxPercentage: 18,
    amountPaid: null,
    createdAt: "2026-06-24T04:20:00.000Z",
    dueDate: "2026-06-24T10:30:00.000Z",
    deliveredAt: "2026-06-24T11:10:00.000Z",
    notes: "Battery tested healthy; preventive replacement completed on request.",
    items: [
      { itemType: "SERVICE", name: "Battery & Charging Check", quantity: 1 },
      { itemType: "PART", name: "Battery 45AH", quantity: 1 },
      { itemType: "PART", name: "Fuse Assorted Pack", quantity: 1 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2007",
    customerPhone: "9849011207",
    vehicleNumber: "TS10TU7701",
    pricingTier: "PREMIUM",
    paymentStatus: "UNPAID",
    paymentMode: null,
    workStatus: "READY_FOR_DELIVERY",
    discount: 250,
    taxPercentage: 18,
    amountPaid: 0,
    createdAt: "2026-06-26T05:40:00.000Z",
    dueDate: "2026-06-26T13:30:00.000Z",
    notes: "Customer requested doorstep pickup and drop after settlement.",
    items: [
      { itemType: "SERVICE", name: "Periodic Service", quantity: 1 },
      { itemType: "SERVICE", name: "Doorstep Pickup & Drop", quantity: 1 },
      { itemType: "PART", name: "Engine Oil 0W20", quantity: 4 },
      { itemType: "PART", name: "Oil Filter", quantity: 1 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2008",
    customerPhone: "9849011208",
    vehicleNumber: "TS11VW8801",
    pricingTier: "LUXURY",
    paymentStatus: "PAID",
    paymentMode: "BANK_TRANSFER",
    workStatus: "DELIVERED",
    discount: 0,
    taxPercentage: 18,
    amountPaid: null,
    createdAt: "2026-06-27T06:00:00.000Z",
    dueDate: "2026-06-27T15:00:00.000Z",
    deliveredAt: "2026-06-27T16:10:00.000Z",
    notes: "Detailing package delivered along with premium wash add-ons.",
    items: [
      { itemType: "SERVICE", name: "Ceramic Wash & Detailing", quantity: 1 },
      { itemType: "PART", name: "Wiper Blade 24 Inch", quantity: 2 },
      { itemType: "PART", name: "Headlight Bulb H7", quantity: 2 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2009",
    customerPhone: "9849011209",
    vehicleNumber: "TS12YZ9901",
    pricingTier: "PREMIUM",
    paymentStatus: "PARTIAL",
    paymentMode: "UPI",
    workStatus: "IN_SERVICE",
    discount: 0,
    taxPercentage: 18,
    amountPaid: 3000,
    createdAt: "2026-06-29T04:45:00.000Z",
    dueDate: "2026-06-29T16:00:00.000Z",
    notes: "Cooling warning light complaint; service in progress.",
    items: [
      { itemType: "SERVICE", name: "Cooling System Service", quantity: 1 },
      { itemType: "PART", name: "Coolant Long Life", quantity: 3 },
      { itemType: "PART", name: "Radiator Hose Upper", quantity: 1 },
      { itemType: "PART", name: "Radiator Hose Lower", quantity: 1 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2010",
    customerPhone: "9849011210",
    vehicleNumber: "TS08AB1010",
    pricingTier: "STANDARD",
    paymentStatus: "UNPAID",
    paymentMode: null,
    workStatus: "RECEIVED",
    discount: 0,
    taxPercentage: 18,
    amountPaid: 0,
    createdAt: "2026-06-30T07:15:00.000Z",
    dueDate: "2026-07-01T11:00:00.000Z",
    notes: "Vehicle received for pre-purchase inspection report.",
    items: [
      { itemType: "SERVICE", name: "Pre-Purchase Inspection", quantity: 1 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2011",
    customerPhone: "9849011211",
    vehicleNumber: "TS09CD1111",
    pricingTier: "STANDARD",
    paymentStatus: "PAID",
    paymentMode: "CASH",
    workStatus: "DELIVERED",
    discount: 100,
    taxPercentage: 18,
    amountPaid: null,
    createdAt: "2026-07-01T05:05:00.000Z",
    dueDate: "2026-07-01T12:45:00.000Z",
    deliveredAt: "2026-07-01T13:15:00.000Z",
    notes: "Routine oil and wiper replacement.",
    items: [
      { itemType: "SERVICE", name: "Periodic Service", quantity: 1 },
      { itemType: "PART", name: "Engine Oil 5W30", quantity: 3 },
      { itemType: "PART", name: "Oil Filter", quantity: 1 },
      { itemType: "PART", name: "Wiper Blade 16 Inch", quantity: 2 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2012",
    customerPhone: "9849011212",
    vehicleNumber: "TS10EF1212",
    pricingTier: "PREMIUM",
    paymentStatus: "PAID",
    paymentMode: "UPI",
    workStatus: "DELIVERED",
    discount: 0,
    taxPercentage: 18,
    amountPaid: null,
    createdAt: "2026-07-02T04:30:00.000Z",
    dueDate: "2026-07-02T10:15:00.000Z",
    deliveredAt: "2026-07-02T10:50:00.000Z",
    notes: "Transmission oil service done during periodic maintenance.",
    items: [
      { itemType: "SERVICE", name: "Transmission Oil Service", quantity: 1 },
      { itemType: "PART", name: "Transmission Oil ATF", quantity: 4 },
      { itemType: "PART", name: "Air Filter", quantity: 1 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2013",
    customerPhone: "9849011213",
    vehicleNumber: "TS11GH1313",
    pricingTier: "LUXURY",
    paymentStatus: "UNPAID",
    paymentMode: null,
    workStatus: "READY_FOR_DELIVERY",
    discount: 300,
    taxPercentage: 18,
    amountPaid: 0,
    createdAt: "2026-07-03T05:20:00.000Z",
    dueDate: "2026-07-03T15:30:00.000Z",
    notes: "Diesel smoke issue resolved; customer to settle on pickup.",
    items: [
      { itemType: "SERVICE", name: "Diesel Injector Cleaning", quantity: 1 },
      { itemType: "PART", name: "Fuel Injector Cleaner", quantity: 1 },
      { itemType: "PART", name: "Throttle Body Cleaner", quantity: 1 },
      { itemType: "PART", name: "Spark Plug Iridium", quantity: 4 }
    ]
  },
  {
    invoiceNumber: "INV-SAN-2014",
    customerPhone: "9849011214",
    vehicleNumber: "TS12IJ1414",
    pricingTier: "STANDARD",
    paymentStatus: "PARTIAL",
    paymentMode: "CARD",
    workStatus: "IN_SERVICE",
    discount: 0,
    taxPercentage: 18,
    amountPaid: 2200,
    createdAt: "2026-07-03T06:00:00.000Z",
    dueDate: "2026-07-04T11:45:00.000Z",
    notes: "Brake and suspension combo job progressing.",
    items: [
      { itemType: "SERVICE", name: "Brake Overhaul", quantity: 1 },
      { itemType: "SERVICE", name: "Suspension Inspection", quantity: 1 },
      { itemType: "PART", name: "Brake Pads Rear", quantity: 1 },
      { itemType: "PART", name: "Brake Disc Rotor", quantity: 2 }
    ]
  }
];

function buildServiceKey(entry) {
  return `${entry.name}::${entry.category}`;
}

function buildPartKey(entry) {
  return `${entry.name}::${entry.brand ?? ""}::${entry.partNumber ?? ""}`;
}

function getTierPrice(item, tier) {
  if (tier === "PREMIUM") {
    return item.premiumPrice;
  }

  if (tier === "LUXURY") {
    return item.luxuryPrice;
  }

  return item.standardPrice;
}

function invoiceMessage(invoice, customerName) {
  if (invoice.workStatus === "READY_FOR_DELIVERY") {
    return `Hello ${customerName}, your vehicle ${invoice.vehicleNumber} is ready for delivery at Sangam Automobiles.`;
  }

  if (invoice.workStatus === "IN_SERVICE") {
    return `Hello ${customerName}, your vehicle ${invoice.vehicleNumber} is currently under service at Sangam Automobiles.`;
  }

  return `Hello ${customerName}, your vehicle ${invoice.vehicleNumber} has been received at Sangam Automobiles.`;
}

function buildInvoiceActivityDetails(invoice) {
  return `Invoice ${invoice.invoiceNumber} created for ${invoice.customerPhone} with status ${invoice.workStatus}.`;
}

function buildWorkStatusDetail(status) {
  return `Vehicle status updated to ${status.replaceAll("_", " ")}.`;
}

function buildPaymentDetail(amountPaid, grandTotal, paymentStatus) {
  if (paymentStatus === "PAID") {
    return `Full payment of Rs ${grandTotal.toFixed(2)} collected.`;
  }

  return `Payment updated. Amount received: Rs ${amountPaid.toFixed(2)}.`;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  const workshop = await prisma.workshop.findFirst({
    where: { email: workshopEmail },
    select: { id: true, name: true }
  });

  if (!workshop) {
    throw new Error(`Workshop with email ${workshopEmail} was not found.`);
  }

  const defaultPasswordHash = await bcrypt.hash(defaultStaffPassword, 10);
  const existingUsers = await prisma.user.findMany({
    where: { workshopId: workshop.id },
    select: { email: true }
  });
  const userEmails = new Set(existingUsers.map((entry) => entry.email.toLowerCase()));
  let createdUsers = 0;

  for (const user of staffUsers) {
    if (userEmails.has(user.email.toLowerCase())) {
      continue;
    }

    await prisma.user.create({
      data: {
        workshopId: workshop.id,
        name: user.name,
        email: user.email,
        passwordHash: defaultPasswordHash,
        role: user.role
      }
    });

    userEmails.add(user.email.toLowerCase());
    createdUsers += 1;
  }

  const existingCustomers = await prisma.customer.findMany({
    where: { workshopId: workshop.id },
    select: { id: true, phone: true, name: true }
  });

  const customerByPhone = new Map(existingCustomers.map((entry) => [entry.phone, { id: entry.id, name: entry.name }]));
  let createdCustomers = 0;

  for (const customer of customers) {
    if (customerByPhone.has(customer.phone)) {
      continue;
    }

    const created = await prisma.customer.create({
      data: {
        workshopId: workshop.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address
      },
      select: { id: true, phone: true, name: true }
    });

    customerByPhone.set(created.phone, { id: created.id, name: created.name });
    createdCustomers += 1;
  }

  const vehicleByNumber = new Map();
  const existingVehicles = await prisma.vehicle.findMany({
    where: {
      customer: {
        workshopId: workshop.id
      }
    },
    select: { id: true, customerId: true, vehicleNumber: true }
  });

  for (const entry of existingVehicles) {
    vehicleByNumber.set(entry.vehicleNumber, entry);
  }

  let createdVehicles = 0;
  for (const vehicle of vehicles) {
    const customer = customerByPhone.get(vehicle.customerPhone);
    if (!customer) {
      throw new Error(`Customer with phone ${vehicle.customerPhone} was not found for vehicle ${vehicle.vehicleNumber}.`);
    }

    const existing = await prisma.vehicle.findUnique({
      where: {
        customerId_vehicleNumber: {
          customerId: customer.id,
          vehicleNumber: vehicle.vehicleNumber
        }
      },
      select: { id: true, customerId: true, vehicleNumber: true }
    });

    if (existing) {
      vehicleByNumber.set(existing.vehicleNumber, existing);
      continue;
    }

    const created = await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        vehicleNumber: vehicle.vehicleNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        fuelType: vehicle.fuelType,
        odometer: vehicle.odometer
      },
      select: { id: true, customerId: true, vehicleNumber: true }
    });

    vehicleByNumber.set(created.vehicleNumber, created);
    createdVehicles += 1;
  }

  const existingServices = await prisma.service.findMany({
    where: { workshopId: workshop.id },
    select: { id: true, name: true, category: true, standardPrice: true, premiumPrice: true, luxuryPrice: true }
  });
  const serviceByKey = new Map(existingServices.map((entry) => [buildServiceKey(entry), entry]));
  let createdServices = 0;

  for (const service of services) {
    const key = buildServiceKey(service);
    if (serviceByKey.has(key)) {
      continue;
    }

    const created = await prisma.service.create({
      data: {
        workshopId: workshop.id,
        name: service.name,
        category: service.category,
        description: service.description,
        estimatedTime: service.estimatedTime,
        standardPrice: service.standardPrice,
        premiumPrice: service.premiumPrice,
        luxuryPrice: service.luxuryPrice,
        isActive: true
      },
      select: { id: true, name: true, category: true, standardPrice: true, premiumPrice: true, luxuryPrice: true }
    });

    serviceByKey.set(buildServiceKey(created), created);
    createdServices += 1;
  }

  const existingParts = await prisma.sparePart.findMany({
    where: { workshopId: workshop.id },
    select: {
      id: true,
      name: true,
      category: true,
      brand: true,
      partNumber: true,
      standardPrice: true,
      premiumPrice: true,
      luxuryPrice: true,
      stockQuantity: true
    }
  });
  const partByKey = new Map(existingParts.map((entry) => [buildPartKey(entry), entry]));
  let createdParts = 0;

  for (const part of spareParts) {
    const key = buildPartKey(part);
    if (partByKey.has(key)) {
      continue;
    }

    const created = await prisma.sparePart.create({
      data: {
        workshopId: workshop.id,
        name: part.name,
        category: part.category,
        brand: part.brand,
        partNumber: part.partNumber,
        unit: part.unit,
        standardPrice: part.standardPrice,
        premiumPrice: part.premiumPrice,
        luxuryPrice: part.luxuryPrice,
        stockQuantity: part.stockQuantity,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        partNumber: true,
        standardPrice: true,
        premiumPrice: true,
        luxuryPrice: true,
        stockQuantity: true
      }
    });

    partByKey.set(buildPartKey(created), created);
    createdParts += 1;
  }

  const existingInvoiceNumbers = new Set(
    (await prisma.invoice.findMany({
      where: { workshopId: workshop.id },
      select: { invoiceNumber: true }
    })).map((entry) => entry.invoiceNumber)
  );

  let createdInvoices = 0;
  let createdInvoiceItems = 0;
  let createdActivities = 0;
  let createdReminders = 0;

  for (const invoice of invoices) {
    if (existingInvoiceNumbers.has(invoice.invoiceNumber)) {
      continue;
    }

    const customer = customerByPhone.get(invoice.customerPhone);
    const vehicle = vehicleByNumber.get(invoice.vehicleNumber);

    if (!customer || !vehicle) {
      throw new Error(`Missing customer or vehicle for invoice ${invoice.invoiceNumber}.`);
    }

    const builtItems = invoice.items.map((item) => {
      if (item.itemType === "SERVICE") {
        const source = serviceByKey.get(`${item.name}::${services.find((entry) => entry.name === item.name)?.category ?? ""}`);
        if (!source) {
          throw new Error(`Service ${item.name} was not found for invoice ${invoice.invoiceNumber}.`);
        }

        return {
          itemType: "SERVICE",
          sourceId: source.id,
          name: source.name,
          category: source.category,
          quantity: item.quantity,
          unitPrice: getTierPrice(source, invoice.pricingTier),
          partId: null
        };
      }

      const partSeed = spareParts.find((entry) => entry.name === item.name);
      const source = partSeed ? partByKey.get(buildPartKey(partSeed)) : null;
      if (!source) {
        throw new Error(`Spare part ${item.name} was not found for invoice ${invoice.invoiceNumber}.`);
      }

      if (source.stockQuantity != null && source.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name} while creating ${invoice.invoiceNumber}.`);
      }

      return {
        itemType: "PART",
        sourceId: source.id,
        name: source.name,
        category: source.category,
        quantity: item.quantity,
        unitPrice: getTierPrice(source, invoice.pricingTier),
        partId: source.id
      };
    });

    const subtotal = builtItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxable = Math.max(subtotal - invoice.discount, 0);
    const taxAmount = Number(((taxable * invoice.taxPercentage) / 100).toFixed(2));
    const grandTotal = Number((taxable + taxAmount).toFixed(2));
    const amountPaid = invoice.amountPaid == null ? grandTotal : invoice.amountPaid;

    await prisma.$transaction(async (tx) => {
      const createdInvoice = await tx.invoice.create({
        data: {
          workshopId: workshop.id,
          customerId: customer.id,
          vehicleId: vehicle.id,
          invoiceNumber: invoice.invoiceNumber,
          pricingTier: invoice.pricingTier,
          paymentStatus: invoice.paymentStatus,
          paymentMode: invoice.paymentMode,
          workStatus: invoice.workStatus,
          subtotal,
          discount: invoice.discount,
          taxPercentage: invoice.taxPercentage,
          taxAmount,
          grandTotal,
          amountPaid,
          notes: invoice.notes,
          dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
          deliveredAt: invoice.deliveredAt ? new Date(invoice.deliveredAt) : null,
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.deliveredAt ?? invoice.dueDate ?? invoice.createdAt)
        }
      });

      await tx.invoiceItem.createMany({
        data: builtItems.map((item) => ({
          invoiceId: createdInvoice.id,
          itemType: item.itemType,
          sourceId: item.sourceId,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: Number((item.quantity * item.unitPrice).toFixed(2))
        }))
      });

      for (const item of builtItems) {
        if (item.partId) {
          await tx.sparePart.update({
            where: { id: item.partId },
            data: {
              stockQuantity: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      const createdAt = new Date(invoice.createdAt);
      const invoiceActivities = [
        {
          workshopId: workshop.id,
          invoiceId: createdInvoice.id,
          action: "CREATED",
          details: buildInvoiceActivityDetails(invoice),
          actorName: "Sangam Automobiles Owner",
          createdAt
        }
      ];

      if (invoice.workStatus !== "RECEIVED") {
        invoiceActivities.push({
          workshopId: workshop.id,
          invoiceId: createdInvoice.id,
          action: "WORK_STATUS_UPDATED",
          details: buildWorkStatusDetail(invoice.workStatus),
          actorName: "Sangam Automobiles Owner",
          createdAt: addHours(createdAt, 1)
        });
      }

      if (amountPaid > 0) {
        invoiceActivities.push({
          workshopId: workshop.id,
          invoiceId: createdInvoice.id,
          action: "PAYMENT_UPDATED",
          details: buildPaymentDetail(amountPaid, grandTotal, invoice.paymentStatus),
          actorName: "Sangam Automobiles Owner",
          createdAt: addHours(createdAt, 2)
        });
      }

      await tx.invoiceActivity.createMany({ data: invoiceActivities });

      if (invoice.workStatus === "READY_FOR_DELIVERY" || invoice.workStatus === "IN_SERVICE" || invoice.workStatus === "RECEIVED") {
        await tx.reminderActivity.create({
          data: {
            workshopId: workshop.id,
            invoiceId: createdInvoice.id,
            channel: invoice.workStatus === "READY_FOR_DELIVERY" ? "WHATSAPP" : "SMS",
            customerName: customer.name,
            vehicleNumber: invoice.vehicleNumber,
            workStatus: invoice.workStatus,
            message: invoiceMessage(invoice, customer.name),
            sentAt: addHours(createdAt, 3),
            sentByName: "Sangam Automobiles Owner"
          }
        });
        createdReminders += 1;
      }

      createdActivities += invoiceActivities.length;
      createdInvoiceItems += builtItems.length;
    });

    createdInvoices += 1;
    existingInvoiceNumbers.add(invoice.invoiceNumber);
  }

  const finalCounts = await Promise.all([
    prisma.user.count({ where: { workshopId: workshop.id } }),
    prisma.customer.count({ where: { workshopId: workshop.id } }),
    prisma.vehicle.count({
      where: {
        customer: {
          workshopId: workshop.id
        }
      }
    }),
    prisma.service.count({ where: { workshopId: workshop.id } }),
    prisma.sparePart.count({ where: { workshopId: workshop.id } }),
    prisma.invoice.count({ where: { workshopId: workshop.id } }),
    prisma.invoiceItem.count({
      where: {
        invoice: {
          workshopId: workshop.id
        }
      }
    }),
    prisma.invoiceActivity.count({ where: { workshopId: workshop.id } }),
    prisma.reminderActivity.count({ where: { workshopId: workshop.id } })
  ]);

  console.log(
    JSON.stringify(
      {
        workshop: workshop.name,
        created: {
          users: createdUsers,
          customers: createdCustomers,
          vehicles: createdVehicles,
          services: createdServices,
          spareParts: createdParts,
          invoices: createdInvoices,
          invoiceItems: createdInvoiceItems,
          invoiceActivities: createdActivities,
          reminderActivities: createdReminders
        },
        totals: {
          users: finalCounts[0],
          customers: finalCounts[1],
          vehicles: finalCounts[2],
          services: finalCounts[3],
          spareParts: finalCounts[4],
          invoices: finalCounts[5],
          invoiceItems: finalCounts[6],
          invoiceActivities: finalCounts[7],
          reminderActivities: finalCounts[8]
        }
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

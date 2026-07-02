# GaragePro

GaragePro is a Next.js garage billing and customer management application for workshop owners. It includes:

- Role-aware login flow
- Owner registration and one-time password reset flow
- Team user creation for manager, cashier, and staff roles
- Team role updates and staff removal for owner-managed access control
- Dashboard with revenue, reminders, and due deliveries
- Customer, vehicle, service, and spare-parts management views
- Invoice creation with Standard, Premium, and Luxury pricing tiers
- Work-order style vehicle status tracking
- Reminder center with WhatsApp/SMS launch links and activity history
- Reminder activity stored in PostgreSQL when `DATABASE_URL` is enabled, with JSON fallback for local demo mode
- Pending payments and basic reports
- Richer reports with payment/work-status breakdowns and CSV export
- Global search across customers, vehicles, and invoices
- Printable invoice view
- Workshop branding uploads for logo and payment QR assets
- Prisma schema and seed data for PostgreSQL
- Automatic fallback to a local JSON store when `DATABASE_URL` is not configured
- One-time password reset links for local/demo use, with Prisma-backed token support when the database is enabled

## Demo Login

- Email: `owner@garagepro.app`
- Password: `password123`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create an environment file:

```bash
cp .env.example .env
```

3. Start the app:

```bash
npm run dev
```

## Runtime Data

When `DATABASE_URL` is configured, the app reads and writes through Prisma/PostgreSQL.

When `DATABASE_URL` is not configured, the app falls back to [data/store.json](/Users/anand/Documents/CodexProjects/GaragePlus/data/store.json) so local development still works end to end.

That means:

- New customers, vehicles, services, spare parts, invoices, payments, and status updates survive refreshes
- Workshop settings updates persist locally
- Login reads from the same store
- Password reset links are generated and validated from the same store

## PostgreSQL Setup

After configuring `DATABASE_URL`:

```bash
npm run prisma:migrate
npm run prisma:seed
```

If you were already using a PostgreSQL database before the password reset feature was added, run the migration step above so the `PasswordResetToken` table is created.

Then run the app:

```bash
npm run dev
```

Or build for production:

```bash
npm run build
```

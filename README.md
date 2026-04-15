# DNB — Banking System

A secure online banking system built with Next.js, Tailwind CSS v4, and Supabase.

## Features

- **Admin Panel**: Create accounts, assign IBANs, manage balances, verify users
- **User Dashboard**: View balances (Available + Reserve), transaction history
- **SEPA Transfers**: Send transfers after identity verification
- **Notifications**: Real-time notification system
- **Verification Center**: KYC with address and ID photo upload
- **Responsive**: Clean design on both mobile and desktop

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase Setup

- Create a project at [supabase.com](https://supabase.com)
- Go to SQL Editor and run the contents of `supabase-schema.sql`
- Copy your project URL, anon key, and service role key

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=generate-a-strong-random-string-at-least-32-chars
```

### 4. Generate Admin Password Hash

The schema includes a default admin account. To set your own password:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 12).then(h => console.log(h))"
```

Update the hash in `supabase-schema.sql` or directly in Supabase.

### 5. Add your logo

Replace `public/logo.svg` with your bank logo.

### 6. Run

```bash
npm run dev
```

## Default Admin Login

- **Account ID**: `000-0000-0001`
- **Password**: `admin123` (change this!)

## Architecture

- `/app` — Next.js App Router pages and API routes
- `/components` — Reusable React components
- `/lib` — Supabase client, auth utilities, formatters
- `/public` — Static assets (logo)

## Security Features

- Server-side JWT authentication with httpOnly cookies
- bcrypt password hashing (12 rounds)
- Supabase Row Level Security
- Service role key never exposed to client
- Constant-time password comparison
- Input validation on all API routes

## Color Scheme

- Primary: `#0C4B3E` (dark teal)
- All EUR currency
- Clean, professional banking aesthetic

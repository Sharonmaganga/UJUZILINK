# Ujuzi Link

Ujuzi Link connects people who want to learn a skill with verified, skilled teachers near them. The goal is to
remove the financial and physical barriers to learning.

- **Learners** search for free and see the nearest verified teachers on a Google Map.
- **Teachers** get a free first month after verification, then pay **KES 500/month** by M-Pesa to stay featured.
- **Verification**: every teacher submits a valid ID (number + photo), a pinned location, a profile photo and photos
  of their premises / place of trade. An admin approves or rejects each profile.
- **Payment between learner and teacher happens directly** once they have met and agreed. The app never handles it.

## Tech

Next.js 15 (App Router) · PostgreSQL + Prisma · NextAuth (email + password) · Google Maps JavaScript API ·
Vercel Blob for photos · Safaricom Daraja (M-Pesa STK push) for teacher subscriptions.

## Run it locally

```bash
cp .env.example .env        # fill in DATABASE_URL and NEXTAUTH_SECRET at minimum
npm install
npm run db:push             # creates the tables
npm run dev                 # http://localhost:3000
```

Without a Google Maps key the map is hidden, but location still works through the browser's "use my location".
Without Blob credentials, photos are stored in `.uploads/` on disk. Without M-Pesa credentials, the pay button
shows "payments are not set up yet".

To make yourself an admin (to approve teachers), register normally and then run:

```bash
npm run make-admin -- you@example.com
```

## Deploy (recommended: Vercel + Neon)

1. **Database**: create a free Postgres database on [Neon](https://neon.tech) (or Supabase / Railway) and copy the
   connection string.
2. **Vercel**: import this GitHub repo at [vercel.com/new](https://vercel.com/new). Framework is detected
   automatically.
3. **Photo storage**: in the Vercel project, go to Storage → create a **Blob** store and connect it. This adds
   `BLOB_READ_WRITE_TOKEN` for you.
4. **Environment variables** (Project → Settings → Environment Variables), see `.env.example`:
   - `DATABASE_URL`: from step 1
   - `NEXTAUTH_SECRET`: run `openssl rand -base64 32`
   - `NEXTAUTH_URL`: your site URL, e.g. `https://ujuzilink.vercel.app`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: from Google Cloud Console with **Maps JavaScript API** enabled. Restrict it
     to your domain.
   - M-Pesa variables (below)
5. **Create the tables** once, from your computer: `DATABASE_URL="..." npx prisma db push`
6. Deploy, register your own account, and run `make-admin` against the production database.

### M-Pesa (teacher subscriptions)

1. Create an app on the [Safaricom Daraja portal](https://developer.safaricom.co.ke) with
   **Lipa na M-Pesa Online**. Sandbox credentials work for testing (`MPESA_SHORTCODE=174379`).
2. Set `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`.
3. Set `MPESA_CALLBACK_URL=https://<your-domain>/api/mpesa/callback` and a random `MPESA_CALLBACK_TOKEN`.
4. When ready for real money, apply for Go-Live with your Paybill/Till and set `MPESA_ENV=production`.

Each successful payment adds 30 days on top of whatever time the teacher has left (trial or paid).

## How the main pieces work

| Feature | Where |
| --- | --- |
| Sign up / sign in | `src/app/register`, `src/app/login`, `src/lib/auth.ts` |
| Teacher profile + verification uploads | `src/app/dashboard/profile`, `src/app/api/teacher/profile` |
| Admin review (approve starts the free month) | `src/app/admin`, `src/app/api/admin/verify` |
| Nearest-teacher search | `src/app/search`, `src/app/api/teachers` (distance sort in `src/lib/geo.ts`) |
| Subscription rules | `src/lib/subscription.ts` |
| M-Pesa STK push + callback | `src/lib/mpesa.ts`, `src/app/api/mpesa/*` |

Only teachers who are **approved and inside their trial or paid period** appear in search. Phone and WhatsApp are
shown only to signed-in users. ID numbers and ID photos are only shown to admins.

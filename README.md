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
photos on disk (or Vercel Blob) · Safaricom Daraja (M-Pesa STK push) for teacher subscriptions.

## Run it locally

```bash
cp .env.example .env        # fill in DATABASE_URL and NEXTAUTH_SECRET at minimum
npm install
npm run db:migrate          # creates the tables
npm run dev                 # http://localhost:3000
```

Without a Google Maps key the map is hidden, but location still works through the browser's "use my location".
Without Blob credentials, photos are stored on disk in `UPLOAD_DIR` (default `.uploads/`). Without M-Pesa credentials, the pay button
shows "payments are not set up yet".

To make yourself an admin (to approve teachers), register normally and then run:

```bash
npm run make-admin -- you@example.com
```

## Deploy on RumptyCloud

The repo includes a `Dockerfile`. On every start the container applies database migrations
(`prisma migrate deploy`) and then serves the app on `$PORT`.

1. **Database**: in the RumptyCloud console go to **Data → Databases → Create database**, pick **Postgres**
   (the free Playground plan is fine to start), and copy its connection string.
2. **Deployment**: go to **Compute → Deployments → New deployment**, connect GitHub, and pick this repo and the
   `main` branch.
   - Application type: **Web Service / Backend**
   - Build method: **Dockerfile**
   - Port: **8080** (the default). Readiness path: `/`
   - Tick **Add persistent storage**, mount path **`/data`**, 1 GB to start. Teacher photos are saved there
     (`UPLOAD_DIR=/data/uploads` is already set in the image). Without it, photos are wiped on every deploy.
3. **Environment variables** (the deployment's Env tab), see `.env.example`:
   - `DATABASE_URL`: from step 1
   - `NEXTAUTH_SECRET`: a long random string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL`: the site's address, e.g. `https://ujuzilink.<your-rumpty-domain>` or your own domain
   - `GOOGLE_MAPS_API_KEY`: Google Maps JavaScript API key, restricted to your domain in Google Cloud Console
   - M-Pesa variables (below)
4. Deploy. Pushes to `main` redeploy automatically.
5. Register your own account on the live site, then make yourself admin from the deployment's shell (or
   `rumpty exec`): `node scripts/make-admin.mjs you@example.com`
6. Optional: add a custom domain such as `www.ujuzilink.co.ke` (RumptyCloud supports subdomains, not bare root
   domains yet) and update `NEXTAUTH_URL` and `MPESA_CALLBACK_URL` to match.

RumptyCloud injects env vars only at runtime, so the app reads every setting (including the Maps key) when it
starts rather than at build time.

### Other hosts

The same Docker image runs on any container host (Railway, Render, Fly.io, a VPS). On Vercel, skip the Dockerfile,
set `BLOB_READ_WRITE_TOKEN` for photo storage, and run `npx prisma migrate deploy` once against the database.

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

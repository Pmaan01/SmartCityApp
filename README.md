# 🏙️ SmartCity Service Platform

A full-stack civic engagement platform where citizens report city issues, track real-time status updates, and receive AI-powered notifications — built with Next.js 16, Prisma, and Google Gemini.

> **Live demo:** [smart-city-app.vercel.app](https://smart-city-app-git-master-pmaan01s-projects.vercel.app)

---

## ✨ Features

### For Citizens
- **Report issues** — submit photos, pin the location on a map, get AI-generated category and priority
- **Track reports** — dashboard with live status badges on every submitted issue
- **Issue detail page** — map pin, AI analysis card, comment thread, and progress timeline
- **Notification bell** — in-app badge with dropdown, auto-marks read on open
- **Email & SMS alerts** — opt-in notifications on every status change (Gmail SMTP + Twilio)
- **Profile & settings** — display name, phone number, per-channel notification toggles
- **AI Chatbot** — Gemini-powered assistant for city service questions

### For Admins
- **Admin dashboard** — filterable table of all city issues with inline status + priority dropdowns
- **Instant citizen notification** — status change → Firebase real-time sync + email/SMS fires automatically

### Platform
- Google OAuth sign-in with welcome email on first login
- Public city map — browse all issues without an account
- AI auto-categorisation — pothole, flooding, graffiti, streetlight, and more
- Firebase photo uploads with server-side Admin SDK

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Auth | NextAuth v5 beta · Google OAuth · PrismaAdapter |
| Database | Neon PostgreSQL (serverless) |
| ORM | Prisma 7 · PrismaNeon driver adapter |
| AI | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| Maps | Google Maps JS API (`@react-google-maps/api`) |
| Realtime | Firebase Realtime Database (Admin SDK server-side) |
| Storage | Firebase Storage · Firebase Admin SDK |
| Email | Nodemailer · Gmail SMTP |
| SMS | Twilio |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Neon](https://neon.tech) PostgreSQL database
- [Firebase](https://firebase.google.com) project (Storage + Realtime Database enabled)
- [Google Cloud](https://console.cloud.google.com) project with:
  - OAuth 2.0 credentials (Web application)
  - Maps JavaScript API enabled
  - Generative Language API enabled
- Gmail account + [App Password](https://myaccount.google.com/apppasswords) for SMTP
- [Twilio](https://twilio.com) account *(optional — for SMS)*

### Installation

```bash
git clone https://github.com/Pmaan01/SmartCityApp.git
cd SmartCityApp
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# ── Database ──────────────────────────────────────────────
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# ── Auth ──────────────────────────────────────────────────
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"

# ── Gemini AI ─────────────────────────────────────────────
GEMINI_API_KEY="your-gemini-api-key"

# ── Google Maps ───────────────────────────────────────────
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-maps-api-key"

# ── Firebase (client SDK) ─────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://your-project-default-rtdb.firebaseio.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# ── Firebase Admin (server SDK) ───────────────────────────
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ── Email — Gmail SMTP ────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=abcdefghijklmnop   # 16-char App Password, no spaces
EMAIL_FROM="SmartCity <your.email@gmail.com>"

# ── Twilio (optional) ─────────────────────────────────────
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+15550000000"
```

### Database Setup

```bash
# Apply schema to Neon and generate Prisma client
npx prisma db push
npx prisma generate
```

Grant yourself admin access in the Neon SQL editor:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (citizen)/            # Citizen-facing pages (auth-protected)
│   │   ├── layout.tsx        # Sticky navbar with notification bell
│   │   ├── dashboard/        # My Reports list
│   │   ├── report/           # Issue submission form
│   │   ├── issues/[id]/      # Issue detail + comment thread
│   │   └── profile/          # Settings + notification preferences
│   ├── admin/                # Admin dashboard (ADMIN role only)
│   ├── api/
│   │   ├── auth/             # NextAuth [...nextauth] handler
│   │   ├── issues/           # GET · POST issues; PATCH · GET [id]; POST comments
│   │   ├── notifications/    # GET in-app list; PATCH mark-all-read
│   │   ├── profile/          # GET · PUT user profile
│   │   └── upload/           # Firebase Storage upload
│   ├── auth/signin/          # Custom Google sign-in page
│   └── map/                  # Public city map (no auth required)
├── components/
│   ├── chat/                 # Gemini chatbot floating widget
│   ├── map/                  # LocationPicker (report form) · IssueMap (detail)
│   └── notifications/        # NotificationBell (polls every 30 s)
└── lib/
    ├── auth.ts               # NextAuth config · welcome email on createUser
    ├── prisma.ts             # PrismaNeon singleton
    ├── firebase.ts           # Firebase client SDK init
    ├── firebase-admin.ts     # Firebase Admin SDK (Storage + Realtime DB)
    ├── gemini.ts             # Gemini chat + issue categorisation
    ├── notifications.ts      # sendEmail · sendSMS · notifyStatusChange
    └── email-templates.ts    # Responsive HTML email templates
```

---

## 🗺 Key Flows

### Citizen reports an issue
1. Fills form → picks map location → optionally attaches photo
2. Photo uploads to Firebase Storage
3. `POST /api/issues` → Gemini categorises description → Prisma saves to Neon
4. Redirect to `/dashboard` with success banner

### Admin updates status
1. Selects new status in Admin Dashboard dropdown
2. `PATCH /api/issues/[id]` → Prisma updates DB → Firebase Realtime DB synced (Admin SDK)
3. `notifyStatusChange` runs in parallel:
   - **In-app** notification created (always)
   - **Email** sent via Gmail SMTP if `notificationEmail = true`
   - **SMS** sent via Twilio if `notificationSms = true` and phone number is saved

### Notification bell
- Fetches `/api/notifications` on mount and every 30 seconds
- Red badge shows unread count (capped at "9+")
- Opens dropdown with status-coloured dots, relative timestamps ("5m ago"), "View issue →" links
- Marks all read the moment the dropdown opens

---

## ☁️ Deploying to Vercel

1. Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new)
2. Add all env vars above in **Settings → Environment Variables**
3. Set `AUTH_URL` to your Vercel production URL
4. Add the callback URL to your Google OAuth client's allowed redirect URIs:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
5. Click **Deploy** — `prisma generate` runs automatically via the build script

---

## 📄 License

MIT

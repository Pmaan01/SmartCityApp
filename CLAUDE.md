# Smart City Service Platform — CLAUDE.md

Full-stack Next.js 16 app (App Router, Turbopack) where citizens report city issues via map pin drop, get AI-powered categorization, and receive SMS/email notifications. Admins manage issues through a dashboard with real-time Firebase updates.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| Auth | NextAuth v5 beta (Google OAuth) |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 7 with `@prisma/adapter-neon` |
| File Storage | Firebase Storage (Admin SDK server-side) |
| Real-time | Firebase Realtime Database |
| AI | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| Maps | Google Maps (`@react-google-maps/api`) |
| SMS | Twilio |
| Email | Nodemailer (SMTP via Resend) |
| Styling | Tailwind CSS v4 |

---

## Project Structure

```
src/
  app/
    (citizen)/          # Route group — requires auth (CitizenLayout)
      dashboard/        # User's reported issues
      report/           # Multi-step issue report form
      layout.tsx        # Navbar + auth guard for citizen routes
    api/
      auth/[...nextauth]/ # NextAuth route handler
      chat/             # Gemini chatbot endpoint
      issues/           # CRUD for issues
      reports/pdf/      # PDF report stats endpoint
      upload/           # Firebase file upload endpoint
    auth/signin/        # Google sign-in page
    map/                # Public issue heatmap
    layout.tsx          # Root layout (font, ChatBot)
    page.tsx            # Landing/home page
  components/
    chat/ChatBot.tsx    # Floating AI chatbot widget
    map/LocationPicker.tsx # Map click-to-pin location picker
  lib/
    auth.ts             # NextAuth config
    firebase-admin.ts   # Firebase Admin SDK init
    firebase.ts         # Firebase client SDK init
    gemini.ts           # Gemini AI functions
    notifications.ts    # Email + SMS notification helpers
    prisma.ts           # Prisma client singleton
  middleware.ts         # Edge auth guard for protected routes
  proxy.ts              # Legacy middleware file (superseded by middleware.ts)
  types/index.ts        # Shared TypeScript types
prisma/
  schema.prisma         # DB schema (User, Issue, Comment, Notification)
prisma.config.ts        # Prisma config (schema path, datasource)
```

---

## Database Schema (`prisma/schema.prisma`)

### Enums

- **`Role`** — `CITIZEN | ADMIN | WORKER` — user permission level
- **`IssueStatus`** — `SUBMITTED → IN_REVIEW → ASSIGNED → IN_PROGRESS → RESOLVED | CLOSED`
- **`IssueCategory`** — `POTHOLE | STREETLIGHT | GRAFFITI | GARBAGE | FLOODING | TRAFFIC_SIGNAL | SIDEWALK | PARK | NOISE | OTHER`
- **`NotificationChannel`** — `EMAIL | SMS`

### Models

- **`User`** — citizen/admin account; has `role`, `phone`, relations to reported/assigned issues
- **`Account`** / **`Session`** / **`VerificationToken`** — NextAuth adapter tables
- **`Issue`** — core entity; has `title`, `description`, `category`, `status`, `priority` (1–3), `lat`/`lng`, `address`, `photoUrl`, `aiSummary`; belongs to `reporter`, optionally `assignedTo`
- **`Comment`** — text comment on an issue by a user
- **`Notification`** — log of sent notifications; linked to issue + user; stores `channel` (EMAIL/SMS) and `message`

---

## `prisma.config.ts`

Prisma v7 config format (replaces inline datasource url in schema). Points `schema` to `prisma/schema.prisma` and `migrations` to `prisma/migrations`. Sets `DATABASE_URL` from env for the PostgreSQL Neon connection.

---

## `src/lib/prisma.ts`

### `prisma` (singleton export)
Creates a single `PrismaClient` instance with the `@prisma/adapter-neon` adapter using `neonConfig` (WebSocket for connection pooling). In development, attaches the instance to `global` to survive hot reloads. In production, creates a fresh instance per cold start.

---

## `src/lib/auth.ts`

NextAuth v5 configuration.

### `authConfig`
- Uses `PrismaAdapter` to store sessions/accounts in the database
- Registers the **Google OAuth** provider via `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- Sets `useSecureCookies: false` (allows HTTP in local dev)
- **`session` callback** — attaches `user.id`, `user.role`, and `user.phone` from the database `User` row onto the JWT session so components can read role/phone without extra DB queries
- **`jwt` callback** — persists `id`, `role`, `phone` into the JWT token on sign-in

### `auth`, `signIn`, `signOut` (named exports)
Re-exported from NextAuth for use in server components and API routes.

---

## `src/lib/firebase.ts`

Firebase **client-side** SDK initialization.

### `app`
Initializes the Firebase app using `NEXT_PUBLIC_FIREBASE_*` env vars. Calls `getApps()` to prevent duplicate initialization on hot reload.

### `db`
Exports the Firebase Realtime Database instance — used for real-time issue status updates pushed to connected clients.

### `storage`
Exports the Firebase Storage instance — used client-side when needed (primary uploads go through Admin SDK server-side).

---

## `src/lib/firebase-admin.ts`

Firebase **server-side** Admin SDK initialization.

### `serviceAccount`
Builds a `ServiceAccount` object from env vars:
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` — `.replace(/\\n/g, "\n")` converts literal `\n` in the env string back to real newlines (required for PEM key parsing)

### `initializeApp()`
Called once (guarded by `getApps().length`) with the service account credential and storage bucket. This grants server-side admin access to Firebase Storage without exposing credentials to the client.

### `adminStorage` (export)
The admin storage instance — used in `/api/upload` to write files and call `makePublic()`.

---

## `src/lib/gemini.ts`

Google Generative AI integration using `gemini-2.0-flash` model.

### `genAI`
Singleton `GoogleGenerativeAI` client initialized with `GEMINI_API_KEY`.

### `SYSTEM_PROMPT`
Static prompt injected at the start of every chat session to constrain Gemini's role to a Smart City assistant that knows the issue categories.

### `chatWithGemini(history, userMessage) → Promise<string>`
- Starts a multi-turn chat session with the system prompt prepended to history
- Sends `userMessage` and returns the model's plain-text response
- `history` is an array of `{ role: "user" | "model", parts: [{ text }] }` — the full conversation passed from the client each time (stateless on the server)

### `categorizeIssue(description) → Promise<{ category, priority, summary }>`
- Sends a single prompt asking Gemini to classify a free-text issue description
- Returns JSON with `category` (one of the 10 `IssueCategory` values), `priority` (1–3), and a one-sentence `summary`
- Strips markdown code fences before `JSON.parse()` to handle Gemini's tendency to wrap JSON in ` ```json ` blocks

---

## `src/lib/notifications.ts`

### `notifyStatusChange(issue, newStatus)`
Sends a notification to the issue reporter when their issue status changes.
- Looks up the reporter's email and phone from the database via `prisma.user.findUnique`
- Constructs a message string: `"Your issue 'X' status changed to Y"`
- **Email** — sends via Nodemailer using `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`; `from` is `EMAIL_FROM`
- **SMS** — sends via Twilio client using `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`; `from` is `TWILIO_PHONE_NUMBER`; only sends if reporter has a `phone` on their profile
- Saves a `Notification` record to the database logging the channel and message

---

## `src/middleware.ts`

Next.js Edge Middleware — runs before every matched request.

### `default` (auth middleware)
Wraps NextAuth's `auth()` to inspect `req.auth` on protected paths:
- `/dashboard/*`, `/report/*` — redirects to `/auth/signin` if no session
- `/admin/*` — additionally redirects to `/dashboard` if session exists but `role !== "ADMIN"`

### `config.matcher`
Limits middleware execution to `/dashboard/:path*`, `/report/:path*`, `/admin/:path*` — all other routes (public map, API, home) are not intercepted.

---

## `src/types/index.ts`

### `IssueWithRelations`
Extends the Prisma `Issue` type to include the `reporter` (User) and `comments` (Comment[]) relations. Used as the return type for issue detail queries.

### Re-exported Enums
`IssueStatus`, `IssueCategory`, `Role` — re-exported from `@prisma/client` so they can be imported from `@/types` without referencing Prisma directly.

---

## API Routes

### `src/app/api/auth/[...nextauth]/route.ts`
Exports `GET` and `POST` handlers from NextAuth. Cast to `unknown` then `{ GET, POST }` to satisfy Next.js 16 route handler type requirements.

---

### `src/app/api/upload/route.ts`

#### `POST(req)`
Authenticated file upload to Firebase Storage.
1. Checks session via `auth()` — returns 401 if not signed in
2. Reads `file` from `FormData`
3. Builds a storage path: `issues/{userId}/{timestamp}.{ext}`
4. Saves the file buffer via `adminStorage.bucket().file(path).save()`
5. Calls `fileRef.makePublic()` to allow public reads
6. Returns `{ url }` — the public `storage.googleapis.com` URL

---

### `src/app/api/chat/route.ts`

#### `POST(req)`
Chatbot endpoint that proxies messages to Gemini.
1. Parses `{ message, history }` from request body
2. Validates `message` is non-empty
3. Calls `chatWithGemini(history, message)` — returns AI reply text
4. On **429** from Gemini (rate limit) — returns a friendly 429 with a retry message
5. On other errors — returns 500 with a generic message

---

### `src/app/api/issues/route.ts`

#### `GET(req)`
Returns a list of issues, optionally filtered.
- Query params: `status`, `category`, `userId`
- Always includes `reporter` (name, image) in the response
- Ordered by `createdAt DESC`

#### `POST(req)`
Creates a new issue report.
1. Requires an authenticated session — 401 otherwise
2. Parses `{ title, description, category, lat, lng, address, photoUrl }` from body
3. Calls `categorizeIssue(description)` — Gemini returns `{ category, priority, summary }`
4. Creates the `Issue` in the database with `reporterId = session.user.id` and `aiSummary`
5. Calls `notifyStatusChange` with status `SUBMITTED` to alert the reporter
6. Returns the created issue as JSON

---

### `src/app/api/issues/[id]/route.ts`

#### `GET(req, { params })`
Returns a single issue by `id`, including `reporter`, `assignedTo`, `comments`, and `notifications`.

#### `PATCH(req, { params })`
Updates a single issue (admin/worker action).
1. Requires a session — 401 otherwise
2. Accepts any subset of `{ status, assignedToId, priority, notes }`
3. Updates the issue in the database
4. If `status` changed — calls `notifyStatusChange(issue, newStatus)` and pushes a Firebase Realtime Database update to `issues/{id}` so connected clients see the change instantly
5. Returns the updated issue

---

### `src/app/api/reports/pdf/route.ts`

#### `GET(req)`
Returns aggregate statistics for PDF report generation.
- Counts total issues and resolved issues for the current calendar month
- Groups issues by category (all time) via `prisma.issue.groupBy`
- Returns `{ total, resolved, byCategory: [{ category, _count }] }`

---

## Pages & Layouts

### `src/app/layout.tsx` — Root Layout
Sets up the Geist font (`--font-geist-sans`), applies `antialiased` and `min-h-full` to `<body>`, and renders `<ChatBot />` as a global floating widget so it appears on all pages.

---

### `src/app/page.tsx` — Home / Landing Page
Server component that reads the session.
- **Authenticated users** — shows a personalized greeting with quick links to Report, Dashboard, and Map
- **Unauthenticated users** — shows the platform name, tagline, and a "Get Started" button to sign in
- Includes a feature grid (Report, Track, Map, AI) with icons

---

### `src/app/auth/signin/page.tsx` — Sign In Page
Client component. Renders a centered card with a "Continue with Google" button that calls `signIn("google")`. Redirects to `/dashboard` after sign-in via `callbackUrl`.

---

### `src/app/(citizen)/layout.tsx` — Citizen Layout

Server component wrapping all citizen-facing pages. Redirects to `/auth/signin` if no session.

#### Navbar features
- **Logo** — gradient indigo→violet icon + gradient "SmartCity" wordmark; glows on hover
- **Nav links** — pill-shaped with inline SVG icons: Report (plus icon), My Reports (clipboard icon), City Map (map icon); indigo hover background
- **Glassmorphism** — `backdrop-blur-md` + semi-transparent background blurs page content on scroll; `sticky top-0`
- **User section** — avatar with Google profile image (or initial fallback), first name, sign-out button with red hover and door icon

---

### `src/app/(citizen)/dashboard/page.tsx` — My Reports Dashboard
Server component. Fetches all issues where `reporterId = session.user.id`.
- Shows issue count in header
- Each issue card: photo thumbnail, title, AI summary, category badge, priority dot, status badge (color-coded), relative timestamp
- Empty state with a "Report your first issue" link

---

### `src/app/(citizen)/report/page.tsx` — Report Page Wrapper
Server component. Verifies session, then renders `<ReportForm userId={session.user.id} />`.

---

## Components

### `src/app/(citizen)/report/ReportForm.tsx` — Multi-Step Report Form

Client component. Three-step wizard for submitting a city issue.

#### State
- `step` (1–3) — current wizard step
- `form` — `{ title, description, category, lat, lng, address, photoUrl }` — collects all fields across steps
- `photoFile` — raw `File` for upload
- `loading` — submission in progress

#### Step 1 — Issue Details
- `title` text input
- `description` textarea
- `category` dropdown (Gemini auto-fills this on submit)

#### Step 2 — Location
- Renders `<LocationPicker>` — user clicks the map to drop a pin
- Updates `form.lat`, `form.lng`, `form.address` from the picker's `onChange` callback

#### Step 3 — Photo (optional)
- File input filtered to `image/*`
- Preview of selected image via `URL.createObjectURL`

#### `handleSubmit()`
1. If `photoFile` present — uploads via `POST /api/upload` (FormData), sets `form.photoUrl` from response
2. Posts all fields to `POST /api/issues` which triggers Gemini categorization server-side
3. On success — redirects to `/dashboard`

---

### `src/app/map/page.tsx` — Public Map Page
Server component. Fetches all non-closed issues (`status != CLOSED`) with `lat`/`lng` fields. Renders a header with issue count and the `<PublicMap>` client component.

---

### `src/app/map/PublicMap.tsx` — Issue Heatmap

Client component. Displays all open city issues on a Google Map.

#### `LIBRARIES` constant
Defined **outside** the component at module scope as `const LIBRARIES: ("places")[] = ["places"]`. This prevents the Google Maps loader from seeing a new array reference on each render and reloading the script.

#### Map features
- **Category filter** — pill buttons above the map; filters visible markers by issue category
- **Priority-colored circle markers** — gray (low/1), amber (medium/2), red (high/3); size scales with priority (`8 + priority * 2`)
- **InfoWindow on marker click** — shows title, category, status badge (color-coded), and address
- **Legend** — fixed bottom-right showing priority color key
- Centers on first issue, or defaults to New York City if no issues

---

### `src/components/map/LocationPicker.tsx` — Map Location Picker

Client component used inside `ReportForm` step 2.

#### `LIBRARIES` constant
Same `const LIBRARIES: ("places")[] = ["places"]` pattern as `PublicMap.tsx` — must match exactly since the Maps loader is a singleton across the app.

#### Props
```ts
onChange(lat: number, lng: number, address: string): void
```

#### Behavior
- Renders a Google Map; user clicks anywhere to drop a pin
- On click — calls `geocodeLatLng` via the Geocoder API to resolve coordinates to a human-readable address
- Falls back to `"Lat: X, Lng: Y"` string if Geocoding API is not enabled or fails
- Calls `onChange` with the resolved lat, lng, address so the parent form state updates

---

### `src/components/chat/ChatBot.tsx` — Floating AI Chatbot

Client component. Fixed bottom-right chat bubble that opens a conversation with the Gemini assistant.

#### State
- `open` — whether the chat panel is expanded
- `messages` — array of `{ role: "user" | "model", text }` — full conversation history displayed in the UI
- `input` — current text field value
- `loading` — waiting for API response

#### `send()`
1. Appends user message to `messages`
2. Converts `messages` to Gemini history format (`{ role, parts: [{ text }] }`)
3. Posts to `POST /api/chat` with `{ message, history }`
4. Appends model reply (or `data.error` on rate-limit/failure) to `messages`
5. Uses `useEffect` + `bottomRef` to auto-scroll to the latest message

#### UI
- Toggle button: speech bubble emoji when closed, ✕ when open
- 420px tall panel with scrollable message list
- User messages — right-aligned indigo bubble
- Model messages — left-aligned gray bubble
- "Thinking..." placeholder while loading

---

## Environment Variables

All secrets live in `.env` (gitignored). Copy these to Vercel's Environment Variables panel for production.

```env
# Database
DATABASE_URL=""                          # Neon PostgreSQL connection string

# Auth
AUTH_SECRET=""                           # Random secret for JWT signing
AUTH_URL=""                              # Full app URL (https://your-app.vercel.app)
NEXTAUTH_URL=""                          # Same as AUTH_URL
AUTH_GOOGLE_ID=""                        # Google OAuth client ID
AUTH_GOOGLE_SECRET=""                    # Google OAuth client secret

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""       # Maps JavaScript API key

# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_DATABASE_URL=""     # Realtime Database URL

# Firebase Admin (server)
FIREBASE_CLIENT_EMAIL=""                 # Service account client_email
FIREBASE_PRIVATE_KEY=""                  # Service account private_key (include full PEM)

# Gemini AI
GEMINI_API_KEY=""                        # Google AI Studio or Cloud Console API key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""                   # E.164 format e.g. +14284362074

# Email (SMTP)
SMTP_HOST=""                             # e.g. smtp.resend.com
SMTP_PORT=""                             # e.g. 465
SMTP_USER=""                             # e.g. resend
SMTP_PASS=""                             # SMTP password / Resend API key
EMAIL_FROM=""                            # Sender address
```

---

## Common Pitfalls

- **`FIREBASE_PRIVATE_KEY` format** — must be `KEY="-----BEGIN PRIVATE KEY-----\n..."` in `.env` (dotenv format, not JSON). The `firebase-admin.ts` calls `.replace(/\\n/g, "\n")` to unescape the literal `\n` sequences.
- **`LIBRARIES` constant** — must be defined outside the component at module scope in both `LocationPicker.tsx` and `PublicMap.tsx`. A new array reference on each render causes the Google Maps loader to reload the script.
- **Prisma on Vercel** — the build script is `"prisma generate && next build"` so Vercel generates the Prisma client before compilation.
- **Gemini model** — use `gemini-2.0-flash`; `gemini-1.5-flash` was removed from the v1beta API and returns 404.
- **Auth URLs** — `AUTH_URL` and `NEXTAUTH_URL` must match the deployed domain exactly, and that domain must be in the Google Cloud Console OAuth authorized redirect URIs list.

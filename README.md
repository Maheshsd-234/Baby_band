## Baby Band Safety Dashboard

Premium Apple-inspired UI that listens to the ESP32 baby band via Firebase Realtime Database. Built with Next.js (App Router), TailwindCSS, and shadcn/ui primitives.

## Requirements

- Node.js 18+
- Firebase Realtime Database URL
- (Optional) Vercel CLI for deployment

## Environment Variables

Create `.env.local` inside `dashboard/`:

```
NEXT_PUBLIC_FIREBASE_URL=https://<your-db>.firebaseio.com
NEXT_PUBLIC_FIREBASE_API_KEY=<optional-demo-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
NEXT_PUBLIC_SIMULATE=false
```

Set `NEXT_PUBLIC_SIMULATE=true` when you want the dashboard to run without hitting Firebase (local heartbeat generator + alert emitter).

## Run Locally

```bash
cd dashboard
npm install
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000). The UI listens to `/devices/baby1/state` and `/devices/baby1/alerts` in real time. Simulation buttons send REST calls to Firebase (or emit local alerts in simulate mode).

## Deploy

Vercel is the recommended target. A helper script exists at the repo root:

```bash
cd ..
./scripts/deploy.sh
```

The script installs dependencies, builds the app, then runs `vercel --prod`. Ensure `vercel` CLI is authenticated beforehand.

## Firebase Rules (demo)

See `../docs/firebase-schema.md` for the JSON structure and permissive rules used for demos. Lock down read/write access before shipping to production.

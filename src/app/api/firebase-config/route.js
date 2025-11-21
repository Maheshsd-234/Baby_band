// API route to provide Firebase config to service worker
// Service workers can't access environment variables directly, so we expose them via API

export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Validate all required fields
  const missing = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    return Response.json(
      { error: `Missing Firebase config: ${missing.join(", ")}` },
      { status: 500 }
    );
  }

  return Response.json(config);
}


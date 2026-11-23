/**
 * Google Fit OAuth helpers (web).
 * Plan adı "Google Health"; web tarafında Fit REST API kullanılır.
 */

const FIT_SCOPE = "https://www.googleapis.com/auth/fitness.activity.read";

export function googleHealthConfigured() {
  return Boolean(
    process.env.GOOGLE_HEALTH_CLIENT_ID &&
      process.env.GOOGLE_HEALTH_CLIENT_SECRET &&
      process.env.GOOGLE_HEALTH_REDIRECT_URI
  );
}

export function getGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_HEALTH_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_HEALTH_REDIRECT_URI!,
    response_type: "code",
    scope: FIT_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_HEALTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_HEALTH_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_HEALTH_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }

  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  };
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_HEALTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_HEALTH_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${text}`);
  }

  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
  };
}

/** Aggregate today's step count via Google Fit. */
export async function fetchTodaySteps(accessToken: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();

  const res = await fetch(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aggregateBy: [
          {
            dataTypeName: "com.google.step_count.delta",
          },
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: start.getTime(),
        endTimeMillis: end.getTime(),
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Fit steps failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    bucket?: Array<{
      dataset?: Array<{
        point?: Array<{
          value?: Array<{ intVal?: number; fpVal?: number }>;
        }>;
      }>;
    }>;
  };

  let steps = 0;
  for (const bucket of data.bucket || []) {
    for (const ds of bucket.dataset || []) {
      for (const point of ds.point || []) {
        for (const v of point.value || []) {
          steps += v.intVal ?? Math.round(v.fpVal || 0);
        }
      }
    }
  }

  return steps;
}

export { FIT_SCOPE };

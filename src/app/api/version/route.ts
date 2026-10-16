import { getAppVersion } from "@/lib/appVersion";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { version: getAppVersion() },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate", "X-Content-Type-Options": "nosniff" } }
  );
}


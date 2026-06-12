// Vercel Cron target — posts the daily standings card to Discord.
// Scheduled in vercel.json (08:00–08:59 ET, see Hobby ±1h precision). Vercel
// includes `Authorization: Bearer ${CRON_SECRET}` on cron invocations; we verify
// it so the route can't be triggered by the public.

import { buildStandingsPayload } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    return new Response("DISCORD_WEBHOOK_URL not set", { status: 500 });
  }

  const cacheBust = new Date().toISOString().slice(0, 10); // refresh image daily
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildStandingsPayload(cacheBust)),
  });

  if (!res.ok) {
    return new Response(`Discord webhook failed: ${res.status}`, { status: 502 });
  }
  return new Response("Posted standings to Discord.", { status: 200 });
}

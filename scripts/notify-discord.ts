// Posts the standings card to Discord via webhook — a manual / CI fallback for
// the primary Vercel cron (app/api/cron/discord). Both build the same card via
// lib/discord. Requires DISCORD_WEBHOOK_URL.
//
// Run locally:
//   DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." npm run notify:discord

import { buildStandingsPayload } from "@/lib/discord";

async function main() {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.log("DISCORD_WEBHOOK_URL not set — skipping Discord post.");
    return;
  }

  // Cache-bust the share image (per-deploy in CI, per-day locally).
  const v = process.env.GITHUB_SHA?.slice(0, 8) ?? new Date().toISOString().slice(0, 10);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildStandingsPayload(v)),
  });

  if (!res.ok) {
    console.error(`Discord webhook failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log("Posted standings card to Discord.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

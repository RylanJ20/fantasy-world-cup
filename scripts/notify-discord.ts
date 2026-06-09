// Posts the current standings to a Discord channel via webhook.
// Runs in CI (see .github/workflows/discord-standings.yml) on every change to
// data/league.ts. Reuses the same scoring engine the site uses, so the numbers
// always match. Requires the env var DISCORD_WEBHOOK_URL (a GitHub Actions secret).
//
// Run locally:  DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." npm run notify:discord

import { getStandings, leagueMeta } from "@/lib/league";

const SITE = "https://fantasy-world-cup-five.vercel.app";

async function main() {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.log("DISCORD_WEBHOOK_URL not set — skipping Discord post.");
    return;
  }

  const standings = getStandings();
  const medal = (rank: number) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `\`#${rank}\``;

  const description = standings
    .map(
      (s) =>
        `${medal(s.rank)} **${s.manager.name}** — ${s.total} pts ` +
        `*(${s.playersTotal} players · ${s.teamsTotal} teams)*`,
    )
    .join("\n");

  const body = {
    username: "Fantasy Draft Bot",
    embeds: [
      {
        title: `📊 ${leagueMeta.name} — Standings`,
        url: SITE,
        description,
        color: 0x2ee36f, // pitch green
        footer: { text: "Updated after the latest results" },
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`Discord webhook failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log("Posted standings to Discord.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

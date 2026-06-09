// Posts a rich standings card to Discord via webhook.
// Runs in CI (see .github/workflows/discord-standings.yml) on every change to
// data/league.ts. Reuses the same scoring engine the site uses, so the numbers
// always match. Requires DISCORD_WEBHOOK_URL (a GitHub Actions secret).
//
// Run locally:
//   DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." npm run notify:discord

import { getStandings, getLeagueLeaders, leagueMeta } from "@/lib/league";

const SITE = "https://fantasy-world-cup-five.vercel.app";

async function main() {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.log("DISCORD_WEBHOOK_URL not set — skipping Discord post.");
    return;
  }

  const standings = getStandings();
  const leaders = getLeagueLeaders();
  const medal = (rank: number) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `\`#${rank}\``;

  const description = standings
    .map((s) => `${medal(s.rank)} **${s.manager.name}** — ${s.total} pts`)
    .join("\n");

  // Cache-bust the share image per deploy so Discord fetches a fresh render.
  const v = process.env.GITHUB_SHA?.slice(0, 8) ?? `${standings[0]?.total ?? 0}`;

  const fields: { name: string; value: string; inline?: boolean }[] = [];
  if (leaders.topScorer && leaders.topScorer.value > 0) {
    fields.push({
      name: "🔥 Top points",
      value: `${leaders.topScorer.subject.player.name} — ${leaders.topScorer.value} (${leaders.topScorer.managerName})`,
      inline: true,
    });
  }
  if (leaders.mostGoals && leaders.mostGoals.value > 0) {
    fields.push({
      name: "⚽ Golden boot",
      value: `${leaders.mostGoals.subject.player.name} — ${leaders.mostGoals.value} goals`,
      inline: true,
    });
  }

  const body = {
    username: "GORT",
    embeds: [
      {
        title: `📊 ${leagueMeta.name} — Standings`,
        url: SITE,
        description,
        color: 0x2ee36f, // pitch green
        fields,
        image: { url: `${SITE}/api/og/standings?v=${v}` },
        footer: { text: "Tap the title for the live table · updated after results" },
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
  console.log("Posted standings card to Discord.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

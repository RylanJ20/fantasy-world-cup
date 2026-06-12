// ──────────────────────────────────────────────────────────────────────────
//  Builds the Discord standings card. Shared by the Vercel cron route
//  (app/api/cron/discord) and the CLI fallback (scripts/notify-discord.ts) so
//  the message stays identical wherever it's sent from.
// ──────────────────────────────────────────────────────────────────────────

import { getStandings, getLeagueLeaders, leagueMeta } from "./league";

const SITE = "https://fantasy-world-cup-five.vercel.app";

const medal = (rank: number) =>
  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `\`#${rank}\``;

/** The Discord webhook payload for the current standings. `cacheBust` busts the
 *  share-image cache so Discord re-fetches a fresh render. */
export function buildStandingsPayload(cacheBust: string) {
  const standings = getStandings();
  const leaders = getLeagueLeaders();
  const card = (key: string) => leaders.find((c) => c.key === key);

  const description = standings
    .map((s) => `${medal(s.rank)} **${s.manager.name}** — ${s.total} pts`)
    .join("\n");

  const fields: { name: string; value: string; inline?: boolean }[] = [];
  const topPts = card("points");
  const boot = card("boot");
  if (topPts) {
    fields.push({
      name: "🔥 Top points",
      value: `${topPts.name} — ${topPts.value} (${topPts.meta})`,
      inline: true,
    });
  }
  if (boot) {
    fields.push({
      name: "⚽ Golden boot",
      value: `${boot.name} — ${boot.value} goals`,
      inline: true,
    });
  }

  return {
    username: "GORT",
    // Ping the channel on every post; allowed_mentions makes the @everyone fire.
    content: "@everyone",
    allowed_mentions: { parse: ["everyone"] },
    embeds: [
      {
        title: `📊 ${leagueMeta.name} — Standings`,
        url: SITE,
        description,
        color: 0x2ee36f, // pitch green
        fields,
        image: { url: `${SITE}/api/og/standings?v=${cacheBust}` },
        footer: { text: "Tap the title for the live table · updated after results" },
      },
    ],
  };
}

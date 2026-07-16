// ──────────────────────────────────────────────────────────────────────────
//  Builds the Discord standings card. Shared by the Vercel cron route
//  (app/api/cron/discord) and the CLI fallback (scripts/notify-discord.ts) so
//  the message stays identical wherever it's sent from.
// ──────────────────────────────────────────────────────────────────────────

import { getStandings, getLeagueLeaders, leagueMeta } from "./league";
import { fixtures } from "./fixtures";
import { displayName } from "./flags";

const SITE = "https://fantasy-world-cup-five.vercel.app";

const medal = (rank: number) =>
  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `\`#${rank}\``;

/** The World Cup winner once the Final has been played — otherwise null (the
 *  tournament is still live). Drives the finale "champion" post. */
export function worldCupChampion(): string | null {
  const final = fixtures.find((f) => f.stage === "Final");
  if (!final || final.status !== "FINISHED") return null;
  if (final.winner === "HOME_TEAM") return displayName(final.home);
  if (final.winner === "AWAY_TEAM") return displayName(final.away);
  return null;
}

/** The Discord webhook payload for the current standings. `cacheBust` busts the
 *  share-image cache so Discord re-fetches a fresh render. Once the World Cup
 *  final is finished this switches to the celebratory "champion" card that
 *  crowns the pool winner — the season's last post. */
export function buildStandingsPayload(cacheBust: string) {
  const standings = getStandings();
  const leaders = getLeagueLeaders();
  const card = (key: string) => leaders.find((c) => c.key === key);
  const wcChampion = worldCupChampion(); // non-null → tournament over → finale

  const table = standings
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

  // ── Finale: the final is in the books — crown the pool winner. ──
  if (wcChampion) {
    const winners = standings.filter((s) => s.rank === 1);
    const names = winners.map((w) => w.manager.name).join(" & ");
    const headline =
      winners.length === 1
        ? `👑 **${names}** wins the whole thing!`
        : `👑 **${names}** share the crown!`;

    return {
      username: "GORT",
      content: "@everyone",
      allowed_mentions: { parse: ["everyone"] },
      embeds: [
        {
          title: `🏆 ${leagueMeta.name} — Champion`,
          url: SITE,
          description: `${headline}\n\n**Final standings**\n${table}`,
          color: 0xffc53d, // championship gold
          fields: [
            { name: "🌍 World Cup winner", value: wcChampion, inline: true },
            ...fields,
          ],
          image: { url: `${SITE}/api/og/standings?v=${cacheBust}` },
          footer: { text: "That's a wrap — thanks for playing! · final table" },
        },
      ],
    };
  }

  // ── Daily standings while the tournament is still live. ──
  return {
    username: "GORT",
    // Ping the channel on every post; allowed_mentions makes the @everyone fire.
    content: "@everyone",
    allowed_mentions: { parse: ["everyone"] },
    embeds: [
      {
        title: `📊 ${leagueMeta.name} — Standings`,
        url: SITE,
        description: table,
        color: 0x2ee36f, // pitch green
        fields,
        image: { url: `${SITE}/api/og/standings?v=${cacheBust}` },
        footer: { text: "Tap the title for the live table · updated after results" },
      },
    ],
  };
}

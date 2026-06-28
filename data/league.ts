// ════════════════════════════════════════════════════════════════════════════
//  THE DATA FILE  —  this is the only file you need to edit to update scores.
// ════════════════════════════════════════════════════════════════════════════
//
//  The 8 squads below are the real drafts. You mostly just list NAMES here —
//  scores update hands-free from ESPN's free feed.
//
//  HOW IT UPDATES (automatic)
//  ──────────────────────────
//  data/{fixtures,groups,player-stats}.json are refreshed from ESPN by
//  .github/workflows/auto-import.yml, then merged in at read time:
//    • Team points  → from real results, so a team just needs its country name.
//    • Player points → goals, assists, shots on goal, saves, goals conceded and
//                      result auto-import per drafted player (matched by name).
//  So leave `matches: []` for almost everyone — it fills itself in.
//
//  WHEN YOU STILL EDIT BY HAND (a thin overlay, merged onto the auto stats)
//  ───────────────────────────
//  ESPN can't give MOTM — add it as a pm() keyed by opponent. Penalty & shootout
//  saves now auto-import (scripts/import-penalties.ts reads match commentary), so
//  you only need a pm() to correct one the parser missed or mis-attributed:
//      pm("Brazil", { motm: true })        // Man of the match (+2)
//      pm("Brazil", { pkSaves: 1 })        // in-play penalty save (+5)
//      pm("Brazil", { shootoutSaves: 2 })  // shootout save (+3)
//    The overlay merges onto the auto-imported Brazil match (matched by opponent
//    name); goals/assists/SoG/saves still come from ESPN. You can override an
//    auto stat the same way if ESPN is ever wrong.
//
//  • Drafted teams — each manager's `teams: [ ... ]`: just list up to 6 names:
//      t("Argentina")                        // results auto-fill from fixtures
//      t("Argentina", [ tm("Spain",1,1,"W") ])  // or hand-enter to override
//
//  Squad shape: 1 GK · 2 CB · 1 DEF · 1 WB · 3 MID · 3 FWD.
// ════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-unused-vars -- pm/t/tm are kept ready for when you start logging results */

import type {
  DraftedTeam,
  League,
  Player,
  PlayerMatch,
  Position,
  Result,
  TeamMatch,
} from "@/lib/types";

// ── Terse builders ──────────────────────────────────────────────────────────
const p = (
  name: string,
  position: Position,
  country: string,
  matches: PlayerMatch[] = [],
  note?: string,
): Player => ({ name, position, country, matches, ...(note ? { note } : {}) });

const pm = (
  opponent: string,
  stats: Omit<PlayerMatch, "opponent"> = {},
): PlayerMatch => ({ opponent, ...stats });

// Mid-tournament replacement. After the group stage, a manager may swap a
// drafted player who logged ≤65 total minutes for another real World Cup
// player. The slot KEEPS every point the outgoing player banked before the
// swap; the incoming player scores only from `on` (an ISO cutoff) forward —
// their earlier group-stage points do NOT transfer. Replace like-for-like
// position to keep the squad shape intact.
//   swap(p("David Raya", "GK", "Spain"), p("Unai Simón", "GK", "Spain"), KNOCKOUTS)
const swap = (out: Player, incoming: Player, on: string): Player => ({
  ...out,
  replacedBy: incoming,
  replacedOn: on,
});

// Knockout cutoff for post-group-stage replacements. The last group match
// kicked off 2026-06-28T02:00Z and the first Round-of-32 match 2026-06-28T19:00Z,
// so midday UTC cleanly splits group games (before) from knockout games (on/after).
const KNOCKOUTS = "2026-06-28T12:00:00Z";

const t = (country: string, matches: TeamMatch[] = []): DraftedTeam => ({
  country,
  matches,
});

const tm = (
  opponent: string,
  goalsFor: number,
  goalsAgainst: number,
  result?: Result,
): TeamMatch => ({
  opponent,
  goalsFor,
  goalsAgainst,
  result: result ?? (goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D"),
});

// ════════════════════════════════════════════════════════════════════════════

export const league: League = {
  name: "2026 World Cup Fantasy Draft",
  season: "World Cup 2026",
  // Fallback kickoff (used only if no fixtures are imported). The live countdown
  // actually targets the earliest match in data/fixtures.json automatically.
  kickoff: "2026-06-11T19:00:00Z",
  managers: [
    // ── Rylan ────────────────────────────────────────────────────────────
    {
      id: "rylan",
      name: "Rylan",
      players: [
        p("Luis Díaz", "FWD", "Colombia"),
        p("Mikel Oyarzabal", "FWD", "Spain"),
        p("Cody Gakpo", "FWD", "Netherlands"),
        p("Dani Olmo", "MID", "Spain"),
        p("Enzo Fernández", "MID", "Argentina"),
        p("Kevin De Bruyne", "MID", "Belgium"),
        p("Denzel Dumfries", "WB", "Netherlands"),
        p("Aymeric Laporte", "CB", "Spain"),
        p("Joško Gvardiol", "CB", "Croatia"),
        // Grimaldo logged 0 minutes in the group stage — swapped for Daniel
        // Muñoz (Colombia) for the knockouts.
        swap(
          p("Alejandro Grimaldo", "DEF", "Spain"),
          p("Daniel Muñoz", "DEF", "Colombia"),
          KNOCKOUTS,
        ),
        p("Jordan Pickford", "GK", "England"),
      ],
      teams: [
        t("Argentina"),
        t("Colombia"),
        t("Czechia"),
        t("Egypt"),
        t("Iran"),
        t("Jordan"),
      ],
      bench: [
        // Inside joke — not at the World Cup, so he scores nothing, but he's
        // on the squad in spirit. Bench picks never count toward the total.
        p("Cole Palmer", "MID", "England"),
      ],
    },

    // ── Marc ─────────────────────────────────────────────────────────────
    {
      id: "marc",
      name: "Marc",
      players: [
        p("Rafael Leão", "FWD", "Portugal"),
        p("Erling Haaland", "FWD", "Norway"),
        p("Bukayo Saka", "FWD", "England"),
        p("Florian Wirtz", "MID", "Germany"),
        p("Tijjani Reijnders", "MID", "Netherlands"),
        p("Arda Güler", "MID", "Türkiye"),
        p("Joshua Kimmich", "WB", "Germany"),
        p("Ladislav Krejčí", "CB", "Czechia"),
        p("Marquinhos", "CB", "Brazil"),
        p("Andy Robertson", "DEF", "Scotland"),
        p("Alisson", "GK", "Brazil"),
      ],
      teams: [
        t("Portugal"),
        t("Switzerland"),
        t("Japan"),
        t("Scotland"),
        t("Saudi Arabia"),
        t("Iraq"),
      ],
    },

    // ── Terrick ──────────────────────────────────────────────────────────
    {
      id: "terrick",
      name: "Terrick",
      players: [
        p("Vinícius Júnior", "FWD", "Brazil"),
        p("Son Heung-min", "FWD", "South Korea"),
        p("Christian Pulisic", "FWD", "USA"),
        // Bernardo Silva swapped for João Neves (Portugal) for the knockouts.
        swap(
          p("Bernardo Silva", "MID", "Portugal"),
          p("João Neves", "MID", "Portugal"),
          KNOCKOUTS,
        ),
        p("Martin Ødegaard", "MID", "Norway"),
        p("Bruno Fernandes", "MID", "Portugal"),
        p("Theo Hernández", "WB", "France"),
        p("Virgil van Dijk", "CB", "Netherlands"),
        p("Antonio Rüdiger", "CB", "Germany"),
        p("João Cancelo", "DEF", "Portugal"),
        p("Diogo Costa", "GK", "Portugal"),
      ],
      teams: [
        t("France"),
        t("United States"),
        t("Senegal"),
        t("Ghana"),
        t("Bosnia-Herzegovina"),
        t("Curaçao"),
      ],
    },

    // ── Zach ─────────────────────────────────────────────────────────────
    {
      id: "zach",
      name: "Zach",
      players: [
        p("Raphinha", "FWD", "Brazil"),
        p("Ferran Torres", "FWD", "Spain"),
        p("Lionel Messi", "FWD", "Argentina"),
        p("Fabián Ruiz", "MID", "Spain"),
        p("Youri Tielemans", "MID", "Belgium"),
        // Cherki swapped for Ryan Gravenberch (Netherlands) for the knockouts.
        swap(
          p("Rayan Cherki", "MID", "France"),
          p("Ryan Gravenberch", "MID", "Netherlands"),
          KNOCKOUTS,
        ),
        p("Nuno Mendes", "WB", "Portugal"),
        p("Gabriel Magalhães", "CB", "Brazil"),
        p("Pau Cubarsí", "CB", "Spain"),
        p("Marc Cucurella", "DEF", "Spain"),
        p("Mike Maignan", "GK", "France"),
      ],
      teams: [
        t("Spain"),
        t("Uruguay"),
        t("Norway"),
        t("Panama"),
        t("Paraguay"),
        t("Uzbekistan"),
      ],
    },

    // ── Ben ──────────────────────────────────────────────────────────────
    {
      id: "ben",
      name: "Ben",
      players: [
        p("Cristiano Ronaldo", "FWD", "Portugal"),
        p("Harry Kane", "FWD", "England"),
        p("Lautaro Martínez", "FWD", "Argentina"),
        p("Jamal Musiala", "MID", "Germany"),
        p("Casemiro", "MID", "Brazil"),
        p("Marcel Sabitzer", "MID", "Austria"),
        p("Julian Ryerson", "WB", "Norway"),
        p("Nathan Aké", "CB", "Netherlands"),
        p("Manuel Akanji", "CB", "Switzerland"),
        p("Reece James", "DEF", "England"),
        p("Thibaut Courtois", "GK", "Belgium"),
      ],
      teams: [
        t("Netherlands"),
        t("Croatia"),
        t("Austria"),
        t("Canada"),
        t("Australia"),
        t("Tunisia"),
      ],
    },

    // ── Grayson ──────────────────────────────────────────────────────────
    {
      id: "grayson",
      name: "Grayson",
      players: [
        p("João Félix", "FWD", "Portugal"),
        p("Antoine Semenyo", "FWD", "Ghana"),
        p("Lamine Yamal", "FWD", "Spain"),
        p("Jude Bellingham", "MID", "England"),
        p("Declan Rice", "MID", "England"),
        p("Vitinha", "MID", "Portugal"),
        p("Antonee Robinson", "WB", "USA"), // "Jedi"
        p("Piero Hincapié", "CB", "Ecuador"),
        p("Willian Pacho", "CB", "Ecuador"),
        // David Raum swapped for Alex Freeman for the knockouts. Grayson keeps
        // Raum's group points and now scores Freeman's knockout games.
        swap(
          p("David Raum", "DEF", "Germany"),
          p("Alex Freeman", "DEF", "USA"),
          KNOCKOUTS,
        ),
        // Raya logged 0 minutes in the group stage — swapped for Unai Simón for
        // the knockouts. Grayson keeps Raya's group points (0) and now scores
        // Simón's knockout games; Simón's group-stage points do not transfer.
        swap(
          p("David Raya", "GK", "Spain"),
          p("Unai Simón", "GK", "Spain"),
          KNOCKOUTS,
        ),
      ],
      teams: [
        t("Mexico"),
        t("Brazil"),
        t("Morocco"),
        t("South Africa"),
        t("Congo DR"),
        t("Qatar"),
      ],
    },

    // ── Travis ───────────────────────────────────────────────────────────
    {
      id: "travis",
      name: "Travis",
      players: [
        p("Julián Álvarez", "FWD", "Argentina"),
        p("Viktor Gyökeres", "FWD", "Sweden"),
        p("Michael Olise", "FWD", "France"),
        p("Lucas Paquetá", "MID", "Brazil"),
        p("Frenkie de Jong", "MID", "Netherlands"),
        p("Scott McTominay", "MID", "Scotland"), // "McNugget"
        p("Achraf Hakimi", "WB", "Morocco"),
        p("Marc Guéhi", "CB", "England"),
        p("William Saliba", "CB", "France"),
        p("Micky van de Ven", "DEF", "Netherlands"), // "Micky"
        p("Emiliano Martínez", "GK", "Argentina"), // "Emi"
      ],
      teams: [
        t("England"),
        t("Ecuador"),
        t("Türkiye"),
        t("Sweden"),
        t("Algeria"),
        t("Cabo Verde"),
      ],
    },

    // ── Alejandro ────────────────────────────────────────────────────────
    {
      id: "alejandro",
      name: "Alejandro",
      players: [
        p("Kylian Mbappé", "FWD", "France"),
        p("Kai Havertz", "FWD", "Germany"),
        p("Ousmane Dembélé", "FWD", "France"),
        p("Alexis Mac Allister", "MID", "Argentina"),
        p("Pedri", "MID", "Spain"),
        p("Federico Valverde", "MID", "Uruguay"),
        p("Nahuel Molina", "WB", "Argentina"),
        p("Rúben Dias", "CB", "Portugal"),
        p("Cristian Romero", "CB", "Argentina"),
        p("Jonathan Tah", "DEF", "Germany"),
        p("Manuel Neuer", "GK", "Germany"),
      ],
      teams: [
        t("Germany"),
        t("Belgium"),
        t("Ivory Coast"),
        t("South Korea"),
        t("New Zealand"),
        t("Haiti"),
      ],
    },
  ],
};

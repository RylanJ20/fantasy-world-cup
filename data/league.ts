// ════════════════════════════════════════════════════════════════════════════
//  THE DATA FILE  —  this is the only file you need to edit to update scores.
// ════════════════════════════════════════════════════════════════════════════
//
//  The 8 squads below are the real drafts. Match logs start EMPTY because the
//  tournament hasn't kicked off — everyone sits at 0 until you add results.
//
//  HOW TO EDIT
//  ───────────
//  • Add a player match — put it in that player's `matches: [ ... ]` array:
//      pm("vs Brazil", { goals: 1, shotsOnGoal: 3, motm: true })
//      Only list what happened — anything you omit counts as 0 / none.
//      Stat keys: goals, assists, shotsOnGoal, saves, pkSaves,
//                 goalsConceded, result ("W" | "D" | "L"), motm (true).
//      ▸ For the GK and every defender (CB / DEF / WB), set `goalsConceded`
//        so clean-sheet (+3) and one-goal-allowed (+1) bonuses are awarded.
//      ▸ `result: "W"` gives the GK the +3 win bonus.
//
//  • Add a team match — put it in that team's `matches: [ ... ]` array:
//      tm("vs Brazil", 2, 0)            // goals for, goals against (result inferred)
//      tm("vs Spain", 1, 1, "W")        // drawn 1–1 but won on penalties
//
//  • Add the drafted teams — each manager's `teams: [ ... ]` is currently empty.
//      Fill it with up to 6:   t("Argentina", [ /* matches */ ])
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
): Player => ({ name, position, country, matches });

const pm = (
  opponent: string,
  stats: Omit<PlayerMatch, "opponent"> = {},
): PlayerMatch => ({ opponent, ...stats });

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
  name: "The Group of Death",
  season: "World Cup 2026",
  managers: [
    // ── Rylan ────────────────────────────────────────────────────────────
    {
      id: "rylan",
      name: "Rylan",
      players: [
        p("Mikel Oyarzabal", "FWD", "Spain"),
        p("Luis Díaz", "FWD", "Colombia"),
        p("Cody Gakpo", "FWD", "Netherlands"),
        p("Kevin De Bruyne", "MID", "Belgium"),
        p("Enzo Fernández", "MID", "Argentina"),
        p("Dani Olmo", "MID", "Spain"),
        p("Denzel Dumfries", "WB", "Netherlands"),
        p("Joško Gvardiol", "CB", "Croatia"),
        p("Aymeric Laporte", "CB", "Spain"),
        p("Alejandro Grimaldo", "DEF", "Spain"),
        p("Jordan Pickford", "GK", "England"),
      ],
      teams: [
        // TODO: add Rylan's 6 drafted national teams, e.g. t("Argentina")
      ],
    },

    // ── Marc ─────────────────────────────────────────────────────────────
    {
      id: "marc",
      name: "Marc",
      players: [
        p("Erling Haaland", "FWD", "Norway"),
        p("Bukayo Saka", "FWD", "England"),
        p("Rafael Leão", "FWD", "Portugal"),
        p("Florian Wirtz", "MID", "Germany"),
        p("Arda Güler", "MID", "Türkiye"),
        p("Tijjani Reijnders", "MID", "Netherlands"),
        p("Joshua Kimmich", "WB", "Germany"),
        p("Ladislav Krejčí", "CB", "Czechia"),
        p("Marquinhos", "CB", "Brazil"),
        p("Andy Robertson", "DEF", "Scotland"),
        p("Alisson", "GK", "Brazil"),
      ],
      teams: [
        // TODO: add Marc's 6 drafted national teams
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
        p("Bruno Fernandes", "MID", "Portugal"),
        p("Martin Ødegaard", "MID", "Norway"),
        p("Bernardo Silva", "MID", "Portugal"),
        p("Theo Hernández", "WB", "France"),
        p("Virgil van Dijk", "CB", "Netherlands"),
        p("Antonio Rüdiger", "CB", "Germany"),
        p("João Cancelo", "DEF", "Portugal"),
        p("Diogo Costa", "GK", "Portugal"),
      ],
      teams: [
        // TODO: add Terrick's 6 drafted national teams
      ],
    },

    // ── Zach ─────────────────────────────────────────────────────────────
    {
      id: "zach",
      name: "Zach",
      players: [
        p("Raphinha", "FWD", "Brazil"),
        p("Lionel Messi", "FWD", "Argentina"),
        p("Ferran Torres", "FWD", "Spain"),
        p("Rayan Cherki", "MID", "France"),
        p("Youri Tielemans", "MID", "Belgium"),
        p("Fabián Ruiz", "MID", "Spain"),
        p("Nuno Mendes", "WB", "Portugal"),
        p("Gabriel Magalhães", "CB", "Brazil"),
        p("Pau Cubarsí", "CB", "Spain"),
        p("Marc Cucurella", "DEF", "Spain"),
        p("Mike Maignan", "GK", "France"),
      ],
      teams: [
        // TODO: add Zach's 6 drafted national teams
      ],
    },

    // ── Ben ──────────────────────────────────────────────────────────────
    {
      id: "ben",
      name: "Ben",
      players: [
        p("Harry Kane", "FWD", "England"),
        p("Cristiano Ronaldo", "FWD", "Portugal"),
        p("Lautaro Martínez", "FWD", "Argentina"),
        p("Jamal Musiala", "MID", "Germany"),
        p("Casemiro", "MID", "Brazil"),
        p("Marcel Sabitzer", "MID", "Austria"),
        p("Julian Ryerson", "WB", "Norway"),
        p("Manuel Akanji", "CB", "Switzerland"),
        p("Nathan Aké", "CB", "Netherlands"),
        p("Reece James", "DEF", "England"),
        p("Thibaut Courtois", "GK", "Belgium"),
      ],
      teams: [
        // TODO: add Ben's 6 drafted national teams
      ],
    },

    // ── Grayson ──────────────────────────────────────────────────────────
    {
      id: "grayson",
      name: "Grayson",
      players: [
        p("Lamine Yamal", "FWD", "Spain"),
        p("João Félix", "FWD", "Portugal"),
        p("Antoine Semenyo", "FWD", "Ghana"),
        p("Jude Bellingham", "MID", "England"),
        p("Declan Rice", "MID", "England"),
        p("Vitinha", "MID", "Portugal"),
        p("Antonee Robinson", "WB", "USA"), // "Jedi"
        p("Piero Hincapié", "CB", "Ecuador"),
        p("Willian Pacho", "CB", "Ecuador"),
        p("David Raum", "DEF", "Germany"),
        p("David Raya", "GK", "Spain"),
      ],
      teams: [
        // TODO: add Grayson's 6 drafted national teams
      ],
    },

    // ── Travis ───────────────────────────────────────────────────────────
    {
      id: "travis",
      name: "Travis",
      players: [
        p("Viktor Gyökeres", "FWD", "Sweden"),
        p("Julián Álvarez", "FWD", "Argentina"),
        p("Michael Olise", "FWD", "France"),
        p("Lucas Paquetá", "MID", "Brazil"),
        p("Scott McTominay", "MID", "Scotland"), // "McNugget"
        p("Frenkie de Jong", "MID", "Netherlands"),
        p("Achraf Hakimi", "WB", "Morocco"),
        p("William Saliba", "CB", "France"),
        p("Marc Guéhi", "CB", "England"),
        p("Micky van de Ven", "DEF", "Netherlands"), // "Micky"
        p("Emiliano Martínez", "GK", "Argentina"), // "Emi"
      ],
      teams: [
        // TODO: add Travis's 6 drafted national teams
      ],
    },

    // ── Alejandro ────────────────────────────────────────────────────────
    {
      id: "alejandro",
      name: "Alejandro",
      players: [
        p("Kylian Mbappé", "FWD", "France"),
        p("Ousmane Dembélé", "FWD", "France"),
        p("Kai Havertz", "FWD", "Germany"),
        p("Federico Valverde", "MID", "Uruguay"),
        p("Pedri", "MID", "Spain"),
        p("Alexis Mac Allister", "MID", "Argentina"),
        p("Nahuel Molina", "WB", "Argentina"),
        p("Rúben Dias", "CB", "Portugal"),
        p("Cristian Romero", "CB", "Argentina"),
        p("Jonathan Tah", "DEF", "Germany"),
        p("Manuel Neuer", "GK", "Germany"),
      ],
      teams: [
        // TODO: add Alejandro's 6 drafted national teams
      ],
    },
  ],
};

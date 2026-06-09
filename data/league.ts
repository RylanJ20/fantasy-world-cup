// ════════════════════════════════════════════════════════════════════════════
//  THE DATA FILE  —  this is the only file you need to edit to update scores.
// ════════════════════════════════════════════════════════════════════════════
//
//  Everything below is SAMPLE data (a pretend "2 matchdays in") so the site
//  looks alive before the real tournament starts. Replace the names and stats
//  with the real drafts and results. The design and totals update automatically.
//
//  HOW TO EDIT
//  ───────────
//  • Each manager has  players: [...]  (the 11-man squad) and  teams: [...]
//    (the 6 drafted national teams).
//  • Add a player match:   pm("vs Brazil", { goals: 1, shotsOnGoal: 3, motm: true })
//      Only list what happened — anything you omit counts as 0 / none.
//      Stat keys: goals, assists, shotsOnGoal, saves, pkSaves,
//                 goalsConceded, result ("W" | "D" | "L"), motm (true).
//      ▸ For the GK and every defender (CB / DEF / WB), set `goalsConceded`
//        so clean-sheet (+3) and one-goal-allowed (+1) bonuses are awarded.
//      ▸ `result: "W"` gives the GK the +3 win bonus.
//  • Add a team match:     tm("vs Brazil", 2, 0)   →  goals for, goals against
//      The W/D/L result is inferred from the score. For a knockout game decided
//      on penalties, pass it explicitly:  tm("vs Spain", 1, 1, "W").
//
//  Squad shape: 1 GK · 2 CB · 1 DEF · 1 WB · 3 MID · 3 FWD.
// ════════════════════════════════════════════════════════════════════════════

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
  matches: PlayerMatch[],
): Player => ({ name, position, country, matches });

const pm = (
  opponent: string,
  stats: Omit<PlayerMatch, "opponent"> = {},
): PlayerMatch => ({ opponent, ...stats });

const t = (country: string, matches: TeamMatch[]): DraftedTeam => ({
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
    // ── 1 ──────────────────────────────────────────────────────────────────
    {
      id: "rylan",
      name: "Rylan",
      tagline: "Defending champion energy.",
      players: [
        p("Emiliano Martínez", "GK", "Argentina", [
          pm("vs Saudi Arabia", { saves: 4, goalsConceded: 0, result: "W" }),
          pm("vs Mexico", { saves: 3, goalsConceded: 1, pkSaves: 1, result: "W" }),
        ]),
        p("Cristian Romero", "CB", "Argentina", [
          pm("vs Saudi Arabia", { goalsConceded: 0, result: "W" }),
          pm("vs Mexico", { goalsConceded: 1, shotsOnGoal: 1, result: "W" }),
        ]),
        p("Ronald Araújo", "CB", "Uruguay", [
          pm("vs Ghana", { goalsConceded: 0, result: "D" }),
          pm("vs Portugal", { goalsConceded: 2, result: "L" }),
        ]),
        p("William Saliba", "DEF", "France", [
          pm("vs Australia", { goalsConceded: 1, result: "W" }),
          pm("vs Denmark", { goalsConceded: 0, assists: 1, result: "W" }),
        ]),
        p("Achraf Hakimi", "WB", "Morocco", [
          pm("vs Croatia", { goalsConceded: 0, shotsOnGoal: 1, result: "D" }),
          pm("vs Belgium", { goalsConceded: 0, assists: 1, result: "W" }),
        ]),
        p("Jude Bellingham", "MID", "England", [
          pm("vs Iran", { goals: 1, shotsOnGoal: 2, result: "W", motm: true }),
          pm("vs USA", { assists: 1, shotsOnGoal: 1, result: "D" }),
        ]),
        p("Pedri", "MID", "Spain", [
          pm("vs Costa Rica", { assists: 2, shotsOnGoal: 1, result: "W" }),
          pm("vs Germany", { assists: 1, result: "D" }),
        ]),
        p("Federico Valverde", "MID", "Uruguay", [
          pm("vs Ghana", { shotsOnGoal: 3, result: "D" }),
          pm("vs Portugal", { goals: 1, shotsOnGoal: 2, result: "L" }),
        ]),
        p("Lionel Messi", "FWD", "Argentina", [
          pm("vs Saudi Arabia", { goals: 1, assists: 1, shotsOnGoal: 4, result: "W", motm: true }),
          pm("vs Mexico", { goals: 2, shotsOnGoal: 5, result: "W", motm: true }),
        ]),
        p("Kylian Mbappé", "FWD", "France", [
          pm("vs Australia", { goals: 2, shotsOnGoal: 5, result: "W", motm: true }),
          pm("vs Denmark", { goals: 1, assists: 1, shotsOnGoal: 3, result: "W" }),
        ]),
        p("Lautaro Martínez", "FWD", "Argentina", [
          pm("vs Saudi Arabia", { shotsOnGoal: 2, result: "W" }),
          pm("vs Mexico", { goals: 1, shotsOnGoal: 3, result: "W" }),
        ]),
      ],
      teams: [
        t("Argentina", [tm("vs Saudi Arabia", 2, 1), tm("vs Mexico", 2, 0)]),
        t("Belgium", [tm("vs Canada", 1, 0), tm("vs Morocco", 0, 2)]),
        t("Senegal", [tm("vs Netherlands", 0, 2), tm("vs Qatar", 3, 1)]),
        t("Australia", [tm("vs France", 1, 4), tm("vs Tunisia", 1, 0)]),
        t("Canada", [tm("vs Belgium", 0, 1), tm("vs Croatia", 1, 4)]),
        t("Switzerland", [tm("vs Cameroon", 1, 0), tm("vs Brazil", 0, 1)]),
      ],
    },

    // ── 2 ──────────────────────────────────────────────────────────────────
    {
      id: "marcus",
      name: "Marcus",
      tagline: "All-in on the Seleção.",
      players: [
        p("Alisson", "GK", "Brazil", [
          pm("vs Serbia", { saves: 3, goalsConceded: 0, result: "W" }),
          pm("vs Switzerland", { saves: 2, goalsConceded: 0, result: "W" }),
        ]),
        p("Marquinhos", "CB", "Brazil", [
          pm("vs Serbia", { goalsConceded: 0, result: "W" }),
          pm("vs Switzerland", { goalsConceded: 0, result: "W" }),
        ]),
        p("Virgil van Dijk", "CB", "Netherlands", [
          pm("vs Senegal", { goalsConceded: 0, goals: 1, result: "W", motm: true }),
          pm("vs Ecuador", { goalsConceded: 1, result: "D" }),
        ]),
        p("Antonio Rüdiger", "DEF", "Germany", [
          pm("vs Japan", { goalsConceded: 2, result: "L" }),
          pm("vs Spain", { goalsConceded: 1, result: "D" }),
        ]),
        p("Theo Hernández", "WB", "France", [
          pm("vs Australia", { goalsConceded: 1, assists: 1, result: "W" }),
          pm("vs Denmark", { goalsConceded: 0, result: "W" }),
        ]),
        p("Vitinha", "MID", "Portugal", [
          pm("vs Ghana", { assists: 1, shotsOnGoal: 1, result: "W" }),
          pm("vs Uruguay", { shotsOnGoal: 2, result: "W" }),
        ]),
        p("Frenkie de Jong", "MID", "Netherlands", [
          pm("vs Senegal", { assists: 1, shotsOnGoal: 1, result: "W" }),
          pm("vs Ecuador", { shotsOnGoal: 1, result: "D" }),
        ]),
        p("Declan Rice", "MID", "England", [
          pm("vs Iran", { shotsOnGoal: 1, result: "W" }),
          pm("vs USA", { assists: 1, result: "D" }),
        ]),
        p("Vinícius Jr", "FWD", "Brazil", [
          pm("vs Serbia", { goals: 1, shotsOnGoal: 4, result: "W", motm: true }),
          pm("vs Switzerland", { assists: 1, shotsOnGoal: 3, result: "W" }),
        ]),
        p("Harry Kane", "FWD", "England", [
          pm("vs Iran", { goals: 2, shotsOnGoal: 4, result: "W", motm: true }),
          pm("vs USA", { shotsOnGoal: 2, result: "D" }),
        ]),
        p("Rodrygo", "FWD", "Brazil", [
          pm("vs Serbia", { shotsOnGoal: 2, result: "W" }),
          pm("vs Switzerland", { goals: 1, shotsOnGoal: 2, result: "W" }),
        ]),
      ],
      teams: [
        t("Brazil", [tm("vs Serbia", 2, 0), tm("vs Switzerland", 1, 0)]),
        t("Croatia", [tm("vs Canada", 4, 1), tm("vs Morocco", 0, 0)]),
        t("Nigeria", [tm("vs Argentina", 1, 2), tm("vs Poland", 1, 1)]),
        t("South Korea", [tm("vs Uruguay", 0, 0), tm("vs Ghana", 2, 3)]),
        t("Mexico", [tm("vs Poland", 0, 0), tm("vs Argentina", 0, 2)]),
        t("Austria", [tm("vs France", 0, 1), tm("vs Poland", 2, 0)]),
      ],
    },

    // ── 3 ──────────────────────────────────────────────────────────────────
    {
      id: "sofia",
      name: "Sofia",
      tagline: "Haaland or bust.",
      players: [
        p("Thibaut Courtois", "GK", "Belgium", [
          pm("vs Canada", { saves: 5, goalsConceded: 0, result: "W" }),
          pm("vs Morocco", { saves: 2, goalsConceded: 2, result: "L" }),
        ]),
        p("Rúben Dias", "CB", "Portugal", [
          pm("vs Ghana", { goalsConceded: 0, result: "W" }),
          pm("vs Uruguay", { goalsConceded: 0, result: "W" }),
        ]),
        p("Joško Gvardiol", "CB", "Croatia", [
          pm("vs Canada", { goalsConceded: 1, assists: 1, result: "W" }),
          pm("vs Morocco", { goalsConceded: 0, result: "D" }),
        ]),
        p("Alphonso Davies", "DEF", "Canada", [
          pm("vs Belgium", { goalsConceded: 1, shotsOnGoal: 1, result: "L" }),
          pm("vs Croatia", { goalsConceded: 4, goals: 1, result: "L" }),
        ]),
        p("Trent Alexander-Arnold", "WB", "England", [
          pm("vs Iran", { goalsConceded: 0, assists: 2, result: "W" }),
          pm("vs USA", { goalsConceded: 0, result: "D" }),
        ]),
        p("Kevin De Bruyne", "MID", "Belgium", [
          pm("vs Canada", { assists: 2, shotsOnGoal: 2, result: "W", motm: true }),
          pm("vs Morocco", { shotsOnGoal: 1, result: "L" }),
        ]),
        p("Luka Modrić", "MID", "Croatia", [
          pm("vs Canada", { assists: 1, shotsOnGoal: 1, result: "W" }),
          pm("vs Morocco", { shotsOnGoal: 1, result: "D" }),
        ]),
        p("Bruno Fernandes", "MID", "Portugal", [
          pm("vs Ghana", { goals: 1, assists: 1, shotsOnGoal: 3, result: "W", motm: true }),
          pm("vs Uruguay", { assists: 1, shotsOnGoal: 2, result: "W" }),
        ]),
        p("Erling Haaland", "FWD", "Norway", [
          pm("vs Saudi Arabia", { goals: 2, shotsOnGoal: 5, result: "W", motm: true }),
          pm("vs Jamaica", { goals: 1, shotsOnGoal: 4, result: "W" }),
        ]),
        p("Bukayo Saka", "FWD", "England", [
          pm("vs Iran", { goals: 1, assists: 1, shotsOnGoal: 3, result: "W" }),
          pm("vs USA", { shotsOnGoal: 2, result: "D" }),
        ]),
        p("Rafael Leão", "FWD", "Portugal", [
          pm("vs Ghana", { goals: 1, shotsOnGoal: 2, result: "W" }),
          pm("vs Uruguay", { shotsOnGoal: 3, result: "W" }),
        ]),
      ],
      teams: [
        t("France", [tm("vs Australia", 4, 1), tm("vs Denmark", 2, 1)]),
        t("Uruguay", [tm("vs Ghana", 0, 0), tm("vs Portugal", 0, 2)]),
        t("Egypt", [tm("vs Iran", 1, 1), tm("vs Iraq", 2, 0)]),
        t("Qatar", [tm("vs Senegal", 1, 3), tm("vs Netherlands", 0, 2)]),
        t("Jamaica", [tm("vs Norway", 0, 1), tm("vs Saudi Arabia", 1, 1)]),
        t("Scotland", [tm("vs Switzerland", 1, 1), tm("vs Cameroon", 2, 1)]),
      ],
    },

    // ── 4 ──────────────────────────────────────────────────────────────────
    {
      id: "diego",
      name: "Diego",
      tagline: "Trusts the process.",
      players: [
        p("Unai Simón", "GK", "Spain", [
          pm("vs Costa Rica", { saves: 1, goalsConceded: 0, result: "W" }),
          pm("vs Germany", { saves: 4, goalsConceded: 1, result: "D" }),
        ]),
        p("Pau Cubarsí", "CB", "Spain", [
          pm("vs Costa Rica", { goalsConceded: 0, result: "W" }),
          pm("vs Germany", { goalsConceded: 1, result: "D" }),
        ]),
        p("Dayot Upamecano", "CB", "France", [
          pm("vs Australia", { goalsConceded: 1, result: "W" }),
          pm("vs Denmark", { goalsConceded: 0, result: "W" }),
        ]),
        p("João Cancelo", "DEF", "Portugal", [
          pm("vs Ghana", { goalsConceded: 0, assists: 1, result: "W" }),
          pm("vs Uruguay", { goalsConceded: 0, result: "W" }),
        ]),
        p("Jeremie Frimpong", "WB", "Netherlands", [
          pm("vs Senegal", { goalsConceded: 0, result: "W" }),
          pm("vs Ecuador", { goalsConceded: 1, shotsOnGoal: 1, result: "D" }),
        ]),
        p("Florian Wirtz", "MID", "Germany", [
          pm("vs Japan", { goals: 1, shotsOnGoal: 2, result: "L" }),
          pm("vs Spain", { assists: 1, shotsOnGoal: 2, result: "D" }),
        ]),
        p("Enzo Fernández", "MID", "Argentina", [
          pm("vs Saudi Arabia", { assists: 1, shotsOnGoal: 1, result: "W" }),
          pm("vs Mexico", { goals: 1, shotsOnGoal: 2, result: "W" }),
        ]),
        p("Aurélien Tchouaméni", "MID", "France", [
          pm("vs Australia", { shotsOnGoal: 1, result: "W" }),
          pm("vs Denmark", { assists: 1, result: "W" }),
        ]),
        p("Julián Álvarez", "FWD", "Argentina", [
          pm("vs Saudi Arabia", { goals: 1, shotsOnGoal: 3, result: "W" }),
          pm("vs Mexico", { goals: 1, assists: 1, shotsOnGoal: 2, result: "W", motm: true }),
        ]),
        p("Victor Osimhen", "FWD", "Nigeria", [
          pm("vs Argentina", { goals: 1, shotsOnGoal: 3, result: "L" }),
          pm("vs Poland", { shotsOnGoal: 4, result: "D" }),
        ]),
        p("Cody Gakpo", "FWD", "Netherlands", [
          pm("vs Senegal", { goals: 1, shotsOnGoal: 2, result: "W" }),
          pm("vs Ecuador", { goals: 1, shotsOnGoal: 3, result: "D" }),
        ]),
      ],
      teams: [
        t("England", [tm("vs Iran", 3, 0), tm("vs USA", 1, 1)]),
        t("Colombia", [tm("vs Ecuador", 2, 1), tm("vs Paraguay", 1, 0)]),
        t("Ghana", [tm("vs Uruguay", 0, 0), tm("vs South Korea", 3, 2)]),
        t("Iraq", [tm("vs Egypt", 0, 2), tm("vs Iran", 1, 1)]),
        t("Costa Rica", [tm("vs Spain", 0, 1), tm("vs Germany", 1, 2)]),
        t("Poland", [tm("vs Mexico", 0, 0), tm("vs Nigeria", 1, 1)]),
      ],
    },

    // ── 5 ──────────────────────────────────────────────────────────────────
    {
      id: "amara",
      name: "Amara",
      tagline: "Salah is a system.",
      players: [
        p("Yann Sommer", "GK", "Switzerland", [
          pm("vs Cameroon", { saves: 4, goalsConceded: 0, result: "W" }),
          pm("vs Brazil", { saves: 5, goalsConceded: 1, result: "L" }),
        ]),
        p("Ibrahima Konaté", "CB", "France", [
          pm("vs Australia", { goalsConceded: 1, result: "W" }),
          pm("vs Denmark", { goalsConceded: 0, result: "W" }),
        ]),
        p("Gabriel Magalhães", "CB", "Brazil", [
          pm("vs Serbia", { goalsConceded: 0, result: "W" }),
          pm("vs Switzerland", { goalsConceded: 0, goals: 1, result: "W", motm: true }),
        ]),
        p("Kyle Walker", "DEF", "England", [
          pm("vs Iran", { goalsConceded: 0, result: "W" }),
          pm("vs USA", { goalsConceded: 0, result: "D" }),
        ]),
        p("Alejandro Grimaldo", "WB", "Spain", [
          pm("vs Costa Rica", { goalsConceded: 0, assists: 1, result: "W" }),
          pm("vs Germany", { goalsConceded: 1, result: "D" }),
        ]),
        p("Rodri", "MID", "Spain", [
          pm("vs Costa Rica", { goals: 1, shotsOnGoal: 2, result: "W" }),
          pm("vs Germany", { shotsOnGoal: 1, result: "D" }),
        ]),
        p("Nicolò Barella", "MID", "Italy", [
          pm("vs Tunisia", { assists: 1, shotsOnGoal: 2, result: "W" }),
          pm("vs Serbia", { goals: 1, shotsOnGoal: 1, result: "W" }),
        ]),
        p("Warren Zaïre-Emery", "MID", "France", [
          pm("vs Australia", { shotsOnGoal: 1, result: "W" }),
          pm("vs Denmark", { assists: 1, shotsOnGoal: 1, result: "W" }),
        ]),
        p("Mohamed Salah", "FWD", "Egypt", [
          pm("vs Iran", { goals: 1, shotsOnGoal: 3, result: "D" }),
          pm("vs Iraq", { goals: 1, assists: 1, shotsOnGoal: 4, result: "W", motm: true }),
        ]),
        p("Marcus Rashford", "FWD", "England", [
          pm("vs Iran", { goals: 1, shotsOnGoal: 2, result: "W" }),
          pm("vs USA", { shotsOnGoal: 3, result: "D" }),
        ]),
        p("Dušan Vlahović", "FWD", "Serbia", [
          pm("vs Brazil", { shotsOnGoal: 2, result: "L" }),
          pm("vs Cameroon", { goals: 1, shotsOnGoal: 3, result: "D" }),
        ]),
      ],
      teams: [
        t("Spain", [tm("vs Costa Rica", 1, 0), tm("vs Germany", 1, 1)]),
        t("Ecuador", [tm("vs Colombia", 1, 2), tm("vs Paraguay", 2, 0)]),
        t("Cameroon", [tm("vs Switzerland", 0, 1), tm("vs Scotland", 1, 2)]),
        t("Saudi Arabia", [tm("vs Argentina", 1, 2), tm("vs Jamaica", 1, 1)]),
        t("Honduras", [tm("vs USA", 0, 3), tm("vs Iran", 0, 0)]),
        t("Norway", [tm("vs Jamaica", 1, 0), tm("vs Saudi Arabia", 2, 1)]),
      ],
    },

    // ── 6 ──────────────────────────────────────────────────────────────────
    {
      id: "liam",
      name: "Liam",
      tagline: "Old guard, big game.",
      players: [
        p("Gianluigi Donnarumma", "GK", "Italy", [
          pm("vs Tunisia", { saves: 2, goalsConceded: 0, result: "W" }),
          pm("vs Serbia", { saves: 4, goalsConceded: 0, result: "W" }),
        ]),
        p("Alessandro Bastoni", "CB", "Italy", [
          pm("vs Tunisia", { goalsConceded: 0, result: "W" }),
          pm("vs Serbia", { goalsConceded: 0, assists: 1, result: "W" }),
        ]),
        p("Éder Militão", "CB", "Brazil", [
          pm("vs Serbia", { goalsConceded: 0, result: "W" }),
          pm("vs Switzerland", { goalsConceded: 0, result: "W" }),
        ]),
        p("Jules Koundé", "DEF", "France", [
          pm("vs Australia", { goalsConceded: 1, result: "W" }),
          pm("vs Denmark", { goalsConceded: 0, result: "W" }),
        ]),
        p("Federico Dimarco", "WB", "Italy", [
          pm("vs Tunisia", { goalsConceded: 0, assists: 1, result: "W" }),
          pm("vs Serbia", { goalsConceded: 0, shotsOnGoal: 1, result: "W" }),
        ]),
        p("Martin Ødegaard", "MID", "Norway", [
          pm("vs Saudi Arabia", { assists: 2, shotsOnGoal: 2, result: "W", motm: true }),
          pm("vs Jamaica", { assists: 1, shotsOnGoal: 1, result: "W" }),
        ]),
        p("Jamal Musiala", "MID", "Germany", [
          pm("vs Japan", { goals: 1, shotsOnGoal: 3, result: "L" }),
          pm("vs Spain", { shotsOnGoal: 2, result: "D" }),
        ]),
        p("Eduardo Camavinga", "MID", "France", [
          pm("vs Australia", { shotsOnGoal: 1, result: "W" }),
          pm("vs Denmark", { assists: 1, result: "W" }),
        ]),
        p("Cristiano Ronaldo", "FWD", "Portugal", [
          pm("vs Ghana", { goals: 1, shotsOnGoal: 3, result: "W" }),
          pm("vs Uruguay", { goals: 1, shotsOnGoal: 4, result: "W", motm: true }),
        ]),
        p("Romelu Lukaku", "FWD", "Belgium", [
          pm("vs Canada", { goals: 1, shotsOnGoal: 3, result: "W" }),
          pm("vs Morocco", { shotsOnGoal: 2, result: "L" }),
        ]),
        p("Gabriel Jesus", "FWD", "Brazil", [
          pm("vs Serbia", { shotsOnGoal: 2, result: "W" }),
          pm("vs Switzerland", { goals: 1, shotsOnGoal: 2, result: "W" }),
        ]),
      ],
      teams: [
        t("Portugal", [tm("vs Ghana", 3, 0), tm("vs Uruguay", 2, 0)]),
        t("Ecuador", [tm("vs Colombia", 1, 2), tm("vs Paraguay", 2, 0)]),
        t("Ivory Coast", [tm("vs Algeria", 1, 1), tm("vs Tunisia", 2, 1)]),
        t("Japan", [tm("vs Germany", 2, 1), tm("vs Spain", 1, 1)]),
        t("USA", [tm("vs England", 1, 1), tm("vs Iran", 2, 0)]),
        t("Denmark", [tm("vs France", 1, 2), tm("vs Australia", 3, 1)]),
      ],
    },

    // ── 7 ──────────────────────────────────────────────────────────────────
    {
      id: "noah",
      name: "Noah",
      tagline: "Wins on the wings.",
      players: [
        p("Diogo Costa", "GK", "Portugal", [
          pm("vs Ghana", { saves: 3, goalsConceded: 0, result: "W" }),
          pm("vs Uruguay", { saves: 2, goalsConceded: 0, result: "W" }),
        ]),
        p("Nico Schlotterbeck", "CB", "Germany", [
          pm("vs Japan", { goalsConceded: 2, result: "L" }),
          pm("vs Spain", { goalsConceded: 1, result: "D" }),
        ]),
        p("Lisandro Martínez", "CB", "Argentina", [
          pm("vs Saudi Arabia", { goalsConceded: 0, result: "W" }),
          pm("vs Mexico", { goalsConceded: 1, result: "W" }),
        ]),
        p("Raphaël Guerreiro", "DEF", "Portugal", [
          pm("vs Ghana", { goalsConceded: 0, assists: 1, result: "W" }),
          pm("vs Uruguay", { goalsConceded: 0, result: "W" }),
        ]),
        p("Denzel Dumfries", "WB", "Netherlands", [
          pm("vs Senegal", { goalsConceded: 0, goals: 1, result: "W" }),
          pm("vs Ecuador", { goalsConceded: 1, result: "D" }),
        ]),
        p("Bernardo Silva", "MID", "Portugal", [
          pm("vs Ghana", { assists: 1, shotsOnGoal: 2, result: "W" }),
          pm("vs Uruguay", { goals: 1, shotsOnGoal: 2, result: "W", motm: true }),
        ]),
        p("İlkay Gündoğan", "MID", "Germany", [
          pm("vs Japan", { shotsOnGoal: 1, result: "L" }),
          pm("vs Spain", { assists: 1, shotsOnGoal: 1, result: "D" }),
        ]),
        p("Alexis Mac Allister", "MID", "Argentina", [
          pm("vs Saudi Arabia", { assists: 1, shotsOnGoal: 2, result: "W" }),
          pm("vs Mexico", { goals: 1, shotsOnGoal: 2, result: "W" }),
        ]),
        p("Ousmane Dembélé", "FWD", "France", [
          pm("vs Australia", { goals: 1, assists: 1, shotsOnGoal: 3, result: "W", motm: true }),
          pm("vs Denmark", { shotsOnGoal: 2, result: "W" }),
        ]),
        p("Phil Foden", "FWD", "England", [
          pm("vs Iran", { goals: 1, shotsOnGoal: 2, result: "W" }),
          pm("vs USA", { assists: 1, shotsOnGoal: 2, result: "D" }),
        ]),
        p("Antoine Griezmann", "FWD", "France", [
          pm("vs Australia", { assists: 2, shotsOnGoal: 2, result: "W" }),
          pm("vs Denmark", { goals: 1, shotsOnGoal: 3, result: "W" }),
        ]),
      ],
      teams: [
        t("Germany", [tm("vs Japan", 1, 2), tm("vs Spain", 1, 1)]),
        t("Paraguay", [tm("vs Colombia", 0, 1), tm("vs Ecuador", 0, 2)]),
        t("Algeria", [tm("vs Ivory Coast", 1, 1), tm("vs Honduras", 2, 0)]),
        t("South Korea", [tm("vs Uruguay", 0, 0), tm("vs Ghana", 2, 3)]),
        t("Mexico", [tm("vs Poland", 0, 0), tm("vs Argentina", 0, 2)]),
        t("Switzerland", [tm("vs Cameroon", 1, 0), tm("vs Brazil", 0, 1)]),
      ],
    },

    // ── 8 ──────────────────────────────────────────────────────────────────
    {
      id: "priya",
      name: "Priya",
      tagline: "Sleeper picks, loud results.",
      players: [
        p("David Raya", "GK", "Spain", [
          pm("vs Costa Rica", { saves: 2, goalsConceded: 0, result: "W" }),
          pm("vs Germany", { saves: 3, goalsConceded: 1, result: "D" }),
        ]),
        p("John Stones", "CB", "England", [
          pm("vs Iran", { goalsConceded: 0, result: "W" }),
          pm("vs USA", { goalsConceded: 0, result: "D" }),
        ]),
        p("Matthijs de Ligt", "CB", "Netherlands", [
          pm("vs Senegal", { goalsConceded: 0, result: "W" }),
          pm("vs Ecuador", { goalsConceded: 1, result: "D" }),
        ]),
        p("Nuno Mendes", "DEF", "Portugal", [
          pm("vs Ghana", { goalsConceded: 0, result: "W" }),
          pm("vs Uruguay", { goalsConceded: 0, assists: 1, result: "W" }),
        ]),
        p("Pervis Estupiñán", "WB", "Ecuador", [
          pm("vs Colombia", { goalsConceded: 2, result: "L" }),
          pm("vs Paraguay", { goalsConceded: 0, assists: 1, result: "W" }),
        ]),
        p("Lamine Yamal", "MID", "Spain", [
          pm("vs Costa Rica", { goals: 1, assists: 1, shotsOnGoal: 3, result: "W", motm: true }),
          pm("vs Germany", { shotsOnGoal: 2, result: "D" }),
        ]),
        p("Dani Olmo", "MID", "Spain", [
          pm("vs Costa Rica", { goals: 1, shotsOnGoal: 2, result: "W" }),
          pm("vs Germany", { assists: 1, shotsOnGoal: 1, result: "D" }),
        ]),
        p("Youri Tielemans", "MID", "Belgium", [
          pm("vs Canada", { assists: 1, shotsOnGoal: 1, result: "W" }),
          pm("vs Morocco", { shotsOnGoal: 1, result: "L" }),
        ]),
        p("Robert Lewandowski", "FWD", "Poland", [
          pm("vs Mexico", { shotsOnGoal: 3, result: "D" }),
          pm("vs Nigeria", { goals: 1, shotsOnGoal: 4, result: "D" }),
        ]),
        p("Son Heung-min", "FWD", "South Korea", [
          pm("vs Uruguay", { shotsOnGoal: 2, result: "D" }),
          pm("vs Ghana", { goals: 1, assists: 1, shotsOnGoal: 3, result: "L" }),
        ]),
        p("Nicolas Jackson", "FWD", "Senegal", [
          pm("vs Netherlands", { shotsOnGoal: 2, result: "L" }),
          pm("vs Qatar", { goals: 2, shotsOnGoal: 3, result: "W", motm: true }),
        ]),
      ],
      teams: [
        t("Italy", [tm("vs Tunisia", 2, 0), tm("vs Serbia", 1, 0)]),
        t("Chile", [tm("vs Colombia", 1, 1), tm("vs Paraguay", 0, 0)]),
        t("Tunisia", [tm("vs Italy", 0, 2), tm("vs Australia", 0, 1)]),
        t("Iran", [tm("vs Egypt", 1, 1), tm("vs Iraq", 1, 1)]),
        t("Serbia", [tm("vs Brazil", 0, 2), tm("vs Italy", 0, 1)]),
        t("Morocco", [tm("vs Croatia", 0, 0), tm("vs Belgium", 2, 0)]),
      ],
    },
  ],
};

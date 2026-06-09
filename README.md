# Fantasy World Cup Tracker

A soccer-themed website for our 8-manager fantasy World Cup. Homepage shows the
standings; every manager has their own page with their drafted XI laid out on a
pitch, their 6 national teams, and a full scoring breakdown for each.

Built with Next.js 16 + Tailwind v4. All scores come from **one data file**.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

## Updating scores — the only file you touch

Everything lives in **[`data/league.ts`](data/league.ts)**. The site recomputes
all points, breakdowns and standings automatically from the raw match stats.

**Add a player match** (only list what happened — anything omitted is 0/none):

```ts
pm("vs Brazil", { goals: 1, assists: 1, shotsOnGoal: 3, motm: true })
```

Stat keys: `goals`, `assists`, `shotsOnGoal`, `saves`, `pkSaves`,
`goalsConceded`, `result` (`"W" | "D" | "L"`), `motm` (`true`).

- For the **GK and every defender** (CB / DEF / WB) set `goalsConceded` so
  clean-sheet (+3) and one-goal-allowed (+1) bonuses are awarded.
- `result: "W"` gives the **GK** the +3 win bonus.

**Add a team match** (goals for, goals against — result is inferred):

```ts
tm("vs Brazil", 2, 0)              // 2–0 win
tm("vs Spain", 1, 1, "W")          // drawn 1–1 but won on penalties
```

> The data currently in the file is **sample data** so the design is visible
> before kickoff. Replace the names and stats with the real drafts and results.

## Scoring

| Who | Event | Pts |
| --- | --- | --- |
| All players | Goal / Assist / Shot on goal / MOTM | +10 / +5 / +1 / +2 |
| GK only | Save / PK save / Win / Goal allowed | +2 / +5 / +3 / −2 |
| GK + CB + DEF + WB | Clean sheet / Only one goal allowed | +3 / +1 |
| Teams | Win / Tie / Shutout (stacks) | +3 / +1 / +5 |

The full rulebook is also at `/rules` in the app.

## Deploy

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new),
or run `vercel` with the CLI. It's a static Next.js app — no environment
variables or database needed. To update scores after deploy, edit
`data/league.ts`, commit, and push; Vercel redeploys automatically.

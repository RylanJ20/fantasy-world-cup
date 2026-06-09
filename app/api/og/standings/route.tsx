import { ImageResponse } from "next/og";
import { getStandings, leagueMeta } from "@/lib/league";

export const dynamic = "force-dynamic";

// Dynamic share card — used as the site's OpenGraph image and posted to Discord.
export async function GET() {
  const standings = getStandings().slice(0, 8);
  const medalColor = (rank: number) =>
    rank === 1 ? "#ffd96b" : rank === 2 ? "#cdd9d1" : rank === 3 ? "#ffb020" : "#5d7a6a";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #08160f 0%, #06110c 55%, #0c1d14 100%)",
          color: "#ecfdf2",
          padding: "30px 56px",
          fontFamily: "sans-serif",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              width: 16,
              height: 16,
              borderRadius: 99,
              background: "#2ee36f",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#8fb3a0",
            }}
          >
            {leagueMeta.name}
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              fontSize: 46,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            Standings
          </div>
        </div>

        {/* table */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 14,
          }}
        >
          {standings.map((s, i) => (
            <div
              key={s.manager.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "6px 20px",
                borderRadius: 14,
                background:
                  i === 0 ? "rgba(255,197,61,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  i === 0 ? "rgba(255,197,61,0.35)" : "rgba(167,243,205,0.08)"
                }`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 42,
                  fontSize: 28,
                  fontWeight: 800,
                  color: medalColor(s.rank),
                }}
              >
                {s.rank}
              </div>
              <div style={{ display: "flex", flex: 1, fontSize: 30, fontWeight: 700 }}>
                {s.manager.name}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  fontWeight: 800,
                  color: i === 0 ? "#ffd96b" : "#5dffa0",
                }}
              >
                {s.total}
              </div>
              <div style={{ display: "flex", fontSize: 16, color: "#5d7a6a", width: 30 }}>
                pts
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 20,
            color: "#5d7a6a",
          }}
        >
          fantasy-world-cup-five.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

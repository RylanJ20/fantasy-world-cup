import type { ReactNode } from "react";
import type { PlayerTotals } from "@/lib/scoring";
import type { Position } from "@/lib/types";
import {
  BootIcon,
  GloveIcon,
  NetIcon,
  ShieldIcon,
  StarIcon,
  TargetIcon,
} from "./icons";

export interface Pill {
  icon: ReactNode;
  value: number;
  label: string;
}

/** The (up to four) headline stat pills for a player, chosen by position.
 *  Shared by the static PlayerCard and the interactive ReplacementCard, and
 *  works on any {position, totals} pair (e.g. one occupant of a replaced slot). */
export function statPills({
  player,
  totals: t,
}: {
  player: { position: Position };
  totals: PlayerTotals;
}): Pill[] {
  const out: Pill[] = [];
  const push = (icon: ReactNode, value: number, label: string) => {
    if (value) out.push({ icon, value, label });
  };
  push(<BootIcon size={15} />, t.goals, "G");
  push(<NetIcon size={15} />, t.assists, "A");
  if (player.position === "GK") {
    push(<GloveIcon size={15} />, t.saves, "SV");
    push(<ShieldIcon size={15} />, t.cleanSheets, "CS");
  } else if (["CB", "DEF", "WB"].includes(player.position)) {
    push(<ShieldIcon size={15} />, t.cleanSheets, "CS");
    push(<TargetIcon size={15} />, t.shotsOnGoal, "SoG");
  } else {
    push(<TargetIcon size={15} />, t.shotsOnGoal, "SoG");
    push(<StarIcon size={15} />, t.motm, "MOTM");
  }
  return out.slice(0, 4);
}

import iron3 from "@/assets/ranks/3.webp";
import bronze1 from "@/assets/ranks/4.webp";
import bronze2 from "@/assets/ranks/5.webp";
import bronze3 from "@/assets/ranks/6.webp";
import silver1 from "@/assets/ranks/7.webp";
import silver2 from "@/assets/ranks/8.webp";
import silver3 from "@/assets/ranks/9.webp";
import gold1 from "@/assets/ranks/10.webp";
import gold2 from "@/assets/ranks/11.webp";
import gold3 from "@/assets/ranks/12.webp";
import platinum1 from "@/assets/ranks/13.webp";
import platinum2 from "@/assets/ranks/14.webp";
import platinum3 from "@/assets/ranks/15.webp";
import diamond1 from "@/assets/ranks/16.webp";
import diamond2 from "@/assets/ranks/17.webp";
import diamond3 from "@/assets/ranks/18.webp";
import unranked from "@/assets/ranks/unranked.svg";

export const RANK_ICONS: Record<string, string> = {
  "Iron 3": iron3,
  "Bronze 1": bronze1,
  "Bronze 2": bronze2,
  "Bronze 3": bronze3,
  "Silver 1": silver1,
  "Silver 2": silver2,
  "Silver 3": silver3,
  "Gold 1": gold1,
  "Gold 2": gold2,
  "Gold 3": gold3,
  "Platinum 1": platinum1,
  "Platinum 2": platinum2,
  "Platinum 3": platinum3,
  "Diamond 1": diamond1,
  "Diamond 2": diamond2,
  "Diamond 3": diamond3,
  "Unranked": unranked,
};

export function getRankIcon(tierName: string): string {
  return RANK_ICONS[tierName] ?? RANK_ICONS["Unranked"];
}

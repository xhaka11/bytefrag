import iron1 from "@/assets/ranks/iron-1.webp";
import iron2 from "@/assets/ranks/iron-2.webp";
import iron3 from "@/assets/ranks/iron-3.webp";
import bronze1 from "@/assets/ranks/bronze-1.webp";
import bronze2 from "@/assets/ranks/bronze-2.webp";
import bronze3 from "@/assets/ranks/bronze-3.webp";
import silver1 from "@/assets/ranks/silver-1.webp";
import silver2 from "@/assets/ranks/silver-2.webp";
import silver3 from "@/assets/ranks/silver-3.webp";
import gold1 from "@/assets/ranks/gold-1.webp";
import gold2 from "@/assets/ranks/gold-2.webp";
import gold3 from "@/assets/ranks/gold-3.webp";
import platinum1 from "@/assets/ranks/platinum-1.webp";
import platinum2 from "@/assets/ranks/platinum-2.webp";
import platinum3 from "@/assets/ranks/platinum-3.webp";
import diamon1 from "@/assets/ranks/diamon-1.webp";
import diamon2 from "@/assets/ranks/diamon-2.webp";
import diamon3 from "@/assets/ranks/diamon-3.webp";
import ascendant1 from "@/assets/ranks/ascendant-1.webp";
import ascendant2 from "@/assets/ranks/ascendant-2.webp";
import ascendant3 from "@/assets/ranks/ascendant-3.webp";
import immortal1 from "@/assets/ranks/immortal-1.webp";
import immortal2 from "@/assets/ranks/immortal-2.webp";
import immortal3 from "@/assets/ranks/immortal-3.webp";
import radiant from "@/assets/ranks/radiant.webp";
import unranked from "@/assets/ranks/unranked.webp";

export const RANK_ICONS: Record<string, string> = {
  "Iron 1": iron1,
  "Iron 2": iron2,
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
  "Diamond 1": diamon1,
  "Diamond 2": diamon2,
  "Diamond 3": diamon3,
  "Ascendant 1": ascendant1,
  "Ascendant 2": ascendant2,
  "Ascendant 3": ascendant3,
  "Immortal 1": immortal1,
  "Immortal 2": immortal2,
  "Immortal 3": immortal3,
  "Radiant": radiant,
  "Unranked": unranked,
};

export function getRankIcon(tierName: string): string {
  return RANK_ICONS[tierName] ?? RANK_ICONS["Unranked"];
}
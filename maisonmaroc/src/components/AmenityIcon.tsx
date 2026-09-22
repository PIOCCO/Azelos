import {
  Car,
  Waves,
  Trees,
  ArrowUpDown,
  Snowflake,
  Flame,
  ShieldCheck,
  Sun,
  PanelTop,
  Sofa,
  BellRing,
  CookingPot,
  Check,
  type LucideIcon,
} from "lucide-react";
import type { AmenityKey } from "../data/types";
import { amenityMeta } from "../data/meta";

const map: Record<string, LucideIcon> = {
  Car,
  Waves,
  Trees,
  ArrowUpDown,
  Snowflake,
  Flame,
  ShieldCheck,
  Sun,
  PanelTop,
  Sofa,
  BellRing,
  CookingPot,
};

export default function AmenityIcon({
  amenity,
  size = 18,
  className = "",
}: {
  amenity: AmenityKey;
  size?: number;
  className?: string;
}) {
  const Icon = map[amenityMeta[amenity].icon] ?? Check;
  return <Icon size={size} className={className} />;
}

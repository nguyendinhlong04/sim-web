"use client";

import { REGION_NAMES } from "@/lib/electricity-pricing";

type Props = {
  activeRegion: string;
  onSelect: (key: string) => void;
};

/*
  Simplified SVG map of Japan split into 9 electric utility regions.
  Each region is a <path> group that can be clicked and highlighted.
  Coordinates are approximate outlines for visual representation.
*/

const REGION_PATHS: Record<string, string> = {
  hokkaido:
    "M180,10 L220,5 L260,15 L280,40 L270,70 L250,90 L230,95 L200,85 L180,65 L170,40 Z",
  tohoku:
    "M210,100 L240,95 L255,110 L260,140 L255,170 L240,185 L220,190 L205,180 L195,155 L200,125 Z",
  tokyo:
    "M205,195 L240,190 L250,205 L248,225 L235,240 L215,245 L200,235 L195,215 Z",
  chubu:
    "M175,200 L195,195 L200,215 L195,240 L180,255 L160,255 L150,240 L155,220 Z",
  hokuriku:
    "M145,175 L170,170 L180,190 L175,210 L160,215 L140,210 L135,195 Z",
  kansai:
    "M145,245 L170,240 L180,258 L175,275 L160,280 L145,275 L138,260 Z",
  chugoku:
    "M95,245 L135,240 L145,258 L140,275 L120,285 L100,280 L88,265 Z",
  shikoku:
    "M110,290 L145,285 L155,300 L148,315 L130,320 L112,312 L105,300 Z",
  kyushu:
    "M55,280 L85,275 L95,295 L90,325 L78,345 L60,350 L45,335 L40,305 Z",
};

export default function JapanRegionMap({ activeRegion, onSelect }: Props) {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <svg viewBox="0 0 300 370" className="h-auto w-full" role="img" aria-label="Japan region map">
        {/* Background */}
        <rect x="0" y="0" width="300" height="370" fill="transparent" />

        {Object.entries(REGION_PATHS).map(([key, d]) => {
          const isActive = activeRegion === key;
          return (
            <g key={key} onClick={() => onSelect(key)} className="cursor-pointer">
              <path
                d={d}
                fill={isActive ? "#f97316" : "#e5e7eb"}
                stroke={isActive ? "#ea580c" : "#d1d5db"}
                strokeWidth={isActive ? 2 : 1}
                className="transition-all duration-200 hover:fill-orange-300"
              />
              <title>{REGION_NAMES[key]}</title>
            </g>
          );
        })}

        {/* Region labels */}
        {Object.entries(REGION_PATHS).map(([key]) => {
          const pos = LABEL_POS[key];
          if (!pos) return null;
          const isActive = activeRegion === key;
          return (
            <text
              key={`label-${key}`}
              x={pos[0]}
              y={pos[1]}
              textAnchor="middle"
              className={`pointer-events-none select-none text-[9px] font-bold ${
                isActive ? "fill-white" : "fill-gray-500"
              }`}
            >
              {REGION_NAMES[key]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

const LABEL_POS: Record<string, [number, number]> = {
  hokkaido: [225, 50],
  tohoku: [228, 145],
  tokyo: [225, 218],
  chubu: [170, 228],
  hokuriku: [155, 193],
  kansai: [158, 262],
  chugoku: [115, 262],
  shikoku: [130, 303],
  kyushu: [67, 312],
};

"use client";

import { useId } from "react";
import type { FleetArtVariant } from "@/data/fleet";
import { cn } from "@/lib/utils";

const gold = "#c9a45c";
const ivory = "#f3eee4";

function TowerCrane() {
  return (
    <g fill="none" strokeLinecap="square">
      <g stroke={gold} strokeWidth="1.4">
        <path d="M300 540V170h24v370" />
        <path d="M324 200h300" />
        <path d="M324 200H170" />
        <path d="M624 200v54" />
        <path d="M170 200v42" />
        <path d="M420 200V118h90v82" />
        <path d="M450 118V92h32v26" />
      </g>
      <g stroke={gold} strokeWidth="0.8" opacity="0.55">
        {Array.from({ length: 14 }).map((_, i) => (
          <g key={i}>
            <path d={`M300 ${220 + i * 24}h24`} />
            <path d={`M300 ${220 + i * 24}l24 24`} />
            <path d={`M324 ${220 + i * 24}l-24 24`} />
          </g>
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <path key={`j-${i}`} d={`M${350 + i * 22} 200l11 18 11-18`} />
        ))}
        <path d="M324 200 624 254M324 200l300-42" opacity="0.7" />
      </g>
      <g stroke={ivory} strokeWidth="1" opacity="0.35">
        <path d="M624 254v34" />
        <path d="M618 288h12v14h-12z" />
        <path d="M624 302v28a9 9 0 1 0 1 0" />
        <path d="M300 540h90M320 540v34M370 540v34M320 574h50" />
      </g>
      <g stroke={gold} strokeWidth="1" opacity="0.4">
        <path d="M660 180v200M654 180h12M654 380h12" />
        <path d="M660 200h30M660 260h30M660 320h30" strokeDasharray="2 5" />
        <text x="700" y="250" fill={gold} stroke="none" fontSize="11" letterSpacing="2">
          H 196M
        </text>
      </g>
      <circle cx="624" cy="196" r="3" fill={gold} stroke="none" />
    </g>
  );
}

function Crawler() {
  return (
    <g fill="none" strokeLinecap="square">
      <g stroke={gold} strokeWidth="1.4">
        <path d="M150 470h300v55H150z" />
        <path d="M185 470a35 35 0 0 1 0 55M240 470a35 35 0 0 1 0 55M295 470a35 35 0 0 1 0 55M350 470a35 35 0 0 1 0 55M405 470a35 35 0 0 1 0 55" opacity="0.6" />
        <path d="M200 470V420h180v50" />
        <path d="M230 420V350h100v70" />
        <path d="M380 400 570 160" />
        <path d="M400 420 610 210" />
        <path d="M570 160 610 210" />
        <path d="M610 210l20 130" />
        <path d="M620 340v46a9 9 0 1 0 1 0" />
        <path d="M250 470v-26h30v26M350 470v-26h30v26" />
      </g>
      <g stroke={gold} strokeWidth="0.8" opacity="0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={i} d={`M${400 + i * 21} ${410 - i * 24}l20 50`} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={`x-${i}`} d={`M${390 + i * 24} ${415 - i * 22}l18 18`} />
        ))}
      </g>
      <g stroke={ivory} strokeWidth="1" opacity="0.35">
        <path d="M250 350v-40h60v40M280 310v-18" />
        <path d="M640 190v220M634 190h12M634 410h12" />
        <text x="660" y="300" fill={gold} stroke="none" fontSize="11" letterSpacing="2">
          300 T
        </text>
      </g>
      <circle cx="610" cy="210" r="3" fill={gold} stroke="none" />
    </g>
  );
}

function Excavator() {
  return (
    <g fill="none" strokeLinecap="square">
      <g stroke={gold} strokeWidth="1.4">
        <path d="M130 460h330v60H130z" />
        <path d="M170 460a32 32 0 0 1 0 60M225 460a32 32 0 0 1 0 60M280 460a32 32 0 0 1 0 60M335 460a32 32 0 0 1 0 60M390 460a32 32 0 0 1 0 60M445 460a32 32 0 0 1 0 60" opacity="0.55" />
        <path d="M190 460v-70h190v70" />
        <path d="M230 390v-70h90v70" />
        <path d="M300 390 470 240" />
        <path d="M320 390 500 280" />
        <path d="M470 240 600 310" />
        <path d="M500 280 620 340" />
        <path d="M600 310 650 430 590 450 560 350" />
        <path d="M650 430 690 470 610 490 590 450" />
      </g>
      <g stroke={gold} strokeWidth="0.8" opacity="0.45">
        <path d="M220 360v-40h40v40M260 320v-24" />
        <path d="M340 390 380 370M380 370l20 20M420 370l20 20" />
        <path d="M470 240l-10 18M500 280l-10 18" />
      </g>
      <g stroke={ivory} strokeWidth="1" opacity="0.3">
        <path d="M720 180v260M714 180h12M714 440h12" />
        <path d="M720 250h40M720 340h40" strokeDasharray="2 5" />
        <text x="750" y="300" fill={gold} stroke="none" fontSize="11" letterSpacing="2">
          3.4 M³
        </text>
      </g>
    </g>
  );
}

function Mobile() {
  return (
    <g fill="none" strokeLinecap="square">
      <g stroke={gold} strokeWidth="1.4">
        <path d="M180 480h420v40H180z" />
        <circle cx="240" cy="520" r="42" />
        <circle cx="400" cy="520" r="42" />
        <circle cx="520" cy="520" r="42" />
        <circle cx="240" cy="520" r="18" opacity="0.5" />
        <circle cx="400" cy="520" r="18" opacity="0.5" />
        <circle cx="520" cy="520" r="18" opacity="0.5" />
        <path d="M200 480v-70h140v70" />
        <path d="M360 480V330h70v150" />
        <path d="M390 330 640 130" />
        <path d="M430 330 670 170" />
        <path d="M640 130 670 170" />
        <path d="M670 170l24 170" />
        <path d="M684 340v40a9 9 0 1 0 1 0" />
        <path d="M180 480v40h-30v-40M600 480v40h30v-40" />
      </g>
      <g stroke={gold} strokeWidth="0.8" opacity="0.45">
        <path d="M220 410v-30h40v30" />
        <path d="M360 300h40v-20h-40z" />
        <path d="M640 130l-12 18M670 170l-12 18" />
        <path d="M180 520h-50M630 520h50" strokeDasharray="2 5" />
      </g>
      <g stroke={ivory} strokeWidth="1" opacity="0.3">
        <path d="M730 140v280M724 140h12M724 420h12" />
        <text x="750" y="280" fill={gold} stroke="none" fontSize="11" letterSpacing="2">
          750 T
        </text>
      </g>
    </g>
  );
}

function Piling() {
  return (
    <g fill="none" strokeLinecap="square">
      <g stroke={gold} strokeWidth="1.4">
        <path d="M190 490h260v50H190z" />
        <path d="M225 490a30 30 0 0 1 0 50M275 490a30 30 0 0 1 0 50M325 490a30 30 0 0 1 0 50M375 490a30 30 0 0 1 0 50M425 490a30 30 0 0 1 0 50" opacity="0.55" />
        <path d="M230 490v-80h180v80" />
        <path d="M300 410V120h40v290" />
        <path d="M300 180h40M300 240h40M300 300h40M300 360h40" opacity="0.6" />
        <path d="M320 120V70" />
        <path d="M320 70l-30 30h60z" />
        <path d="M320 410v40h20v-40" />
        <path d="M320 450v40M305 490h30" />
        <path d="M340 300 420 250" />
      </g>
      <g stroke={gold} strokeWidth="0.8" opacity="0.45">
        <path d="M260 410v-30h30v30" />
        <path d="M320 490v80" strokeDasharray="3 6" />
        <path d="M280 590h80" />
      </g>
      <g stroke={ivory} strokeWidth="1" opacity="0.3">
        <path d="M500 120v380M494 120h12M494 500h12" />
        <text x="520" y="300" fill={gold} stroke="none" fontSize="11" letterSpacing="2">
          45 M
        </text>
      </g>
    </g>
  );
}

function Hauler() {
  return (
    <g fill="none" strokeLinecap="square">
      <g stroke={gold} strokeWidth="1.4">
        <path d="M160 440h470v80H160z" />
        <circle cx="240" cy="520" r="46" />
        <circle cx="450" cy="520" r="46" />
        <circle cx="240" cy="520" r="20" opacity="0.5" />
        <circle cx="450" cy="520" r="20" opacity="0.5" />
        <path d="M180 440l30-130h150l-20 130" />
        <path d="M360 310h150l40 130H380" />
        <path d="M410 330h50v40h-50z" />
        <path d="M500 310l60-20 20 30" />
        <path d="M160 470h-30v-30" />
      </g>
      <g stroke={gold} strokeWidth="0.8" opacity="0.45">
        <path d="M220 340h100M240 370h90M255 400h80" />
        <path d="M410 440v-60h50" />
        <path d="M580 290l20 20-20 20" />
      </g>
      <g stroke={ivory} strokeWidth="1" opacity="0.3">
        <path d="M650 260v250M644 260h12M644 510h12" />
        <text x="670" y="390" fill={gold} stroke="none" fontSize="11" letterSpacing="2">
          55 T
        </text>
      </g>
    </g>
  );
}

export function FleetArt({
  variant,
  className,
}: {
  variant: FleetArtVariant;
  className?: string;
}) {
  const rawId = useId();
  const uid = rawId.replace(/[:]/g, "");

  const content = (() => {
    switch (variant) {
      case "tower-crane":
        return <TowerCrane />;
      case "crawler":
        return <Crawler />;
      case "excavator":
        return <Excavator />;
      case "mobile":
        return <Mobile />;
      case "piling":
        return <Piling />;
      case "hauler":
        return <Hauler />;
      default:
        return <TowerCrane />;
    }
  })();

  return (
    <svg
      viewBox="0 0 800 600"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <pattern id={`${uid}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={gold} strokeWidth="0.4" opacity="0.13" />
        </pattern>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.14" />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill={`url(#${uid}-glow)`} />
      <rect width="800" height="600" fill={`url(#${uid}-grid)`} />
      {content}
    </svg>
  );
}

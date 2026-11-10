"use client";

import { useId } from "react";
import type { ArtVariant } from "@/data/projects";
import { cn } from "@/lib/utils";

type Palette = {
  top: string;
  bottom: string;
  accent: string;
  structure: string;
  haze: string;
};

const palettes: Record<ArtVariant, Palette> = {
  tower: {
    top: "#070b12",
    bottom: "#1c2934",
    accent: "#d8b877",
    structure: "#0a0e14",
    haze: "#d8b877",
  },
  villa: {
    top: "#17110c",
    bottom: "#4a3520",
    accent: "#e2c08a",
    structure: "#17120d",
    haze: "#e8b877",
  },
  bridge: {
    top: "#080d12",
    bottom: "#24343e",
    accent: "#cbb489",
    structure: "#090e13",
    haze: "#bcd3dd",
  },
  industrial: {
    top: "#08090b",
    bottom: "#23272c",
    accent: "#d3b070",
    structure: "#0b0d10",
    haze: "#d3b070",
  },
  heritage: {
    top: "#160f0a",
    bottom: "#4b2e18",
    accent: "#e4bd80",
    structure: "#1b120b",
    haze: "#e8a95e",
  },
  interchange: {
    top: "#070c12",
    bottom: "#1f2e3a",
    accent: "#d6b67c",
    structure: "#080c11",
    haze: "#c7d5de",
  },
  marina: {
    top: "#071016",
    bottom: "#153440",
    accent: "#d9bf8c",
    structure: "#081116",
    haze: "#9cc6d4",
  },
  solar: {
    top: "#1b1207",
    bottom: "#4a3216",
    accent: "#f0ca7c",
    structure: "#1a1208",
    haze: "#f5c25e",
  },
};

function Tower({ p }: { p: Palette }) {
  return (
    <g>
      <g fill={p.structure} opacity="0.9">
        <rect x="70" y="510" width="120" height="330" />
        <rect x="200" y="430" width="90" height="410" />
        <rect x="300" y="545" width="140" height="295" />
        <rect x="720" y="470" width="100" height="370" />
        <rect x="830" y="520" width="150" height="320" />
        <rect x="990" y="440" width="90" height="400" />
        <rect x="1090" y="540" width="80" height="300" />
      </g>

      <g opacity="0.5" stroke={p.accent} strokeWidth="1" fill="none">
        {Array.from({ length: 15 }).map((_, i) => (
          <line key={i} x1="230" y1={470 + i * 24} x2="260" y2={470 + i * 24} />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`m-${i}`} x1="744" y1={500 + i * 26} x2="796" y2={500 + i * 26} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`r-${i}`} x1="1010" y1={470 + i * 28} x2="1060" y2={470 + i * 28} />
        ))}
      </g>

      <g>
        <rect x="420" y="150" width="330" height="690" fill={p.structure} />
        <rect x="450" y="120" width="270" height="60" fill={p.structure} />
        <rect x="520" y="70" width="130" height="50" fill={p.structure} />
        <line x1="585" y1="70" x2="585" y2="20" stroke={p.accent} strokeWidth="2" />
        <circle cx="585" cy="18" r="4" fill={p.accent} />
      </g>

      <g stroke={p.accent} strokeWidth="1" opacity="0.52">
        {Array.from({ length: 23 }).map((_, i) => (
          <line key={i} x1="430" y1={170 + i * 28} x2="740" y2={170 + i * 28} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`v-${i}`} x1={445 + i * 40} y1="150" x2={445 + i * 40} y2="840" />
        ))}
      </g>

      <g fill={p.accent} opacity="0.5">
        {Array.from({ length: 46 }).map((_, i) => {
          const col = i % 8;
          const row = Math.floor(i / 8);
          return (
            <rect
              key={i}
              x={452 + col * 40}
              y={190 + row * 56}
              width="18"
              height="8"
              opacity={0.25 + ((i * 7) % 10) / 18}
            />
          );
        })}
      </g>

      <g stroke={p.structure} strokeWidth="7" fill="none">
        <path d="M960 850V250h120" />
        <path d="M960 290h210" />
        <path d="M1170 290v90" />
      </g>
      <g stroke={p.accent} strokeWidth="1.5" fill="none" opacity="0.8">
        <path d="M960 850V250h120" />
        <path d="M960 290h210" />
        <path d="M1170 290v90" />
      </g>
      <circle cx="960" cy="250" r="5" fill={p.accent} />
    </g>
  );
}

function Villa({ p }: { p: Palette }) {
  return (
    <g>
      <path
        d="M0 600c180-60 300-40 430 10 130 50 280 30 430-20 120-40 230-20 340 20v290H0Z"
        fill={p.structure}
        opacity="0.75"
      />
      <path
        d="M0 690c180-50 330-20 470 20 160 45 300 10 450-25 110-26 200-15 280 10v205H0Z"
        fill={p.structure}
      />

      <g>
        <rect x="260" y="470" width="660" height="170" fill={p.structure} />
        <rect x="260" y="455" width="660" height="16" fill={p.accent} opacity="0.55" />
        <rect x="390" y="415" width="400" height="56" fill={p.structure} />
        <rect x="390" y="405" width="400" height="12" fill={p.accent} opacity="0.4" />
        <rect x="820" y="500" width="150" height="140" fill={p.structure} />
        <line x1="250" y1="470" x2="930" y2="470" stroke={p.accent} strokeWidth="1.5" />
      </g>

      <g fill="#d9b477" opacity="0.28">
        <rect x="290" y="510" width="90" height="95" />
        <rect x="400" y="510" width="150" height="95" />
        <rect x="570" y="510" width="110" height="95" />
        <rect x="700" y="510" width="90" height="95" />
        <rect x="845" y="535" width="100" height="70" />
      </g>
      <g stroke={p.accent} strokeWidth="1" opacity="0.45">
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i} x1={292 + i * 90} y1="510" x2={292 + i * 90} y2="605" />
        ))}
        <line x1="400" y1="557" x2="550" y2="557" />
        <line x1="570" y1="557" x2="680" y2="557" />
      </g>

      <g>
        <rect x="170" y="690" width="860" height="95" fill="#0d1a1d" opacity="0.85" />
        <g stroke={p.accent} strokeWidth="1" opacity="0.4">
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={i} x1="190" y1={705 + i * 12} x2="1010" y2={705 + i * 12} />
          ))}
        </g>
      </g>

      {[210, 1000].map((x, index) => (
        <g key={x} stroke={p.structure} strokeWidth="7" fill="none">
          <path d={`M${x} 700c${index === 0 ? 10 : -10} -70 5 -140 18 -200`} />
          <g stroke={p.accent} strokeWidth="1.4" opacity="0.7">
            <path d={`M${x} 700c${index === 0 ? 10 : -10} -70 5 -140 18 -200`} />
            <path d={`M${x + 18} 500c-40-20-65-10-85 12`} />
            <path d={`M${x + 18} 500c40-25 68-12 88 10`} />
            <path d={`M${x + 18} 500c-20-35-8-55 15-70`} />
            <path d={`M${x + 18} 500c22-30 15-55-5-72`} />
          </g>
        </g>
      ))}

      <g fill={p.accent} opacity="0.7">
        <circle cx="960" cy="150" r="44" opacity="0.12" />
        <circle cx="960" cy="150" r="2.5" />
      </g>
    </g>
  );
}

function Bridge({ p }: { p: Palette }) {
  return (
    <g>
      <path d="M0 600h1200v300H0Z" fill="#081116" />
      <g stroke={p.accent} strokeWidth="1" opacity="0.16">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1="0" y1={620 + i * 18} x2="1200" y2={620 + i * 18} />
        ))}
      </g>

      <g stroke={p.structure} strokeWidth="18" fill="none">
        <path d="M330 760V250" />
        <path d="M870 760V250" />
      </g>
      <g stroke={p.accent} strokeWidth="1.5" fill="none" opacity="0.8">
        <path d="M330 760V250" />
        <path d="M870 760V250" />
        <path d="M330 250h-14M870 250h14" />
      </g>

      <g stroke={p.accent} strokeWidth="1" opacity="0.55">
        {Array.from({ length: 9 }).map((_, i) => (
          <g key={i}>
            <line x1="330" y1={280 + i * 34} x2={80 + i * 34} y2="585" />
            <line x1="330" y1={280 + i * 34} x2={580 + i * 34} y2="585" />
            <line x1="870" y1={280 + i * 34} x2={620 + i * 34} y2="585" />
            <line x1="870" y1={280 + i * 34} x2={1120 - i * 34} y2="585" />
          </g>
        ))}
      </g>

      <g>
        <rect x="0" y="570" width="1200" height="34" fill={p.structure} />
        <line x1="0" y1="570" x2="1200" y2="570" stroke={p.accent} strokeWidth="1.5" opacity="0.65" />
        <line x1="0" y1="604" x2="1200" y2="604" stroke={p.accent} strokeWidth="1" opacity="0.35" />
      </g>

      <g stroke={p.structure} strokeWidth="10">
        {[160, 500, 700, 1040].map((x) => (
          <line key={x} x1={x} y1="604" x2={x} y2="720" />
        ))}
      </g>

      <g opacity="0.25">
        <path d="M330 760V250M870 760V250" stroke={p.accent} strokeWidth="1" />
        <path d="M0 570h1200" stroke={p.accent} strokeWidth="1" />
      </g>

      <g fill={p.accent} opacity="0.7">
        <circle cx="600" cy="140" r="56" opacity="0.1" />
        <circle cx="600" cy="140" r="2" />
      </g>
    </g>
  );
}

function Industrial({ p }: { p: Palette }) {
  return (
    <g>
      <path d="M0 660h1200v240H0Z" fill={p.structure} />
      <g fill={p.structure}>
        <rect x="90" y="360" width="90" height="300" />
        <rect x="200" y="440" width="60" height="220" />
        <rect x="300" y="390" width="120" height="270" />
        <rect x="760" y="410" width="110" height="250" />
        <rect x="900" y="340" width="80" height="320" />
        <rect x="1010" y="470" width="130" height="190" />
      </g>
      <g stroke={p.accent} strokeWidth="1.2" fill="none" opacity="0.55">
        <ellipse cx="135" cy="360" rx="45" ry="10" />
        <ellipse cx="360" cy="390" rx="60" ry="12" />
        <ellipse cx="940" cy="340" rx="40" ry="9" />
        <line x1="90" y1="410" x2="180" y2="410" />
        <line x1="90" y1="470" x2="180" y2="470" />
        <line x1="300" y1="450" x2="420" y2="450" />
        <line x1="300" y1="510" x2="420" y2="510" />
        <line x1="900" y1="400" x2="980" y2="400" />
        <line x1="900" y1="460" x2="980" y2="460" />
      </g>

      <g stroke={p.structure} strokeWidth="8" fill="none">
        <path d="M510 660V300h120" />
        <path d="M510 350h180" />
        <path d="M690 350v120" />
        <path d="M510 410h-80" />
      </g>
      <g stroke={p.accent} strokeWidth="1.3" fill="none" opacity="0.65">
        <path d="M510 660V300h120" />
        <path d="M510 350h180" />
        <path d="M690 350v120" />
        <path d="M510 410h-80" />
      </g>

      <g fill={p.accent}>
        <rect x="610" y="280" width="6" height="20" opacity="0.7" />
        <rect x="840" y="620" width="6" height="20" opacity="0.7" />
        <rect x="120" y="620" width="6" height="20" opacity="0.7" />
      </g>

      <g stroke={p.accent} strokeWidth="1" opacity="0.35">
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={i} x1="0" y1={400 + i * 26} x2="1200" y2={400 + i * 26} />
        ))}
      </g>

      <g fill={p.accent} opacity="0.7">
        <circle cx="180" cy="180" r="52" opacity="0.08" />
        <circle cx="180" cy="180" r="2" />
      </g>
    </g>
  );
}

function Heritage({ p }: { p: Palette }) {
  return (
    <g>
      <path
        d="M0 650c170-30 300-15 440 12 170 32 300 5 440-25 110-22 210-12 320 8v255H0Z"
        fill={p.structure}
      />

      <g fill={p.structure}>
        <rect x="150" y="470" width="280" height="210" />
        <rect x="190" y="420" width="200" height="60" />
        <rect x="470" y="520" width="220" height="160" />
        <rect x="730" y="440" width="320" height="240" />
        <rect x="790" y="380" width="200" height="70" />
      </g>

      <g fill="#c99a5c" opacity="0.18">
        <path d="M250 680V560c0-38 30-68 68-68s68 30 68 68v120Z" />
        <path d="M540 680v-80c0-28 22-50 50-50s50 22 50 50v80Z" />
        <path d="M820 680V540c0-45 36-80 80-80s80 35 80 80v140Z" />
      </g>
      <g stroke={p.accent} strokeWidth="1.3" fill="none" opacity="0.55">
        <path d="M250 680V560c0-38 30-68 68-68s68 30 68 68v120" />
        <path d="M540 680v-80c0-28 22-50 50-50s50 22 50 50v80" />
        <path d="M820 680V540c0-45 36-80 80-80s80 35 80 80v140" />
      </g>

      <g stroke={p.accent} strokeWidth="1" opacity="0.32">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1="160" y1={500 + i * 22} x2="420" y2={500 + i * 22} />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h-${i}`} x1="740" y1={470 + i * 24} x2="1040" y2={470 + i * 24} />
        ))}
      </g>

      {[110, 1100].map((x, index) => (
        <g key={x} stroke={p.structure} strokeWidth="6" fill="none">
          <path d={`M${x} 700c${index === 0 ? 8 : -8} -80 2 -150 16 -210`} />
          <g stroke={p.accent} strokeWidth="1.2" opacity="0.65">
            <path d={`M${x} 700c${index === 0 ? 8 : -8} -80 2 -150 16 -210`} />
            <path d={`M${x + 16} 490c-40-22-68-12-90 10`} />
            <path d={`M${x + 16} 490c42-26 70-12 90 10`} />
            <path d={`M${x + 16} 490c-20-35-8-58 16-72`} />
            <path d={`M${x + 16} 490c22-32 14-56-6-74`} />
          </g>
        </g>
      ))}

      <g fill="none" stroke={p.accent} opacity="0.65">
        <path d="M600 120a70 70 0 1 0 60 102 60 60 0 1 1-60-102Z" strokeWidth="1.5" />
        <circle cx="600" cy="120" r="120" strokeWidth="0.8" opacity="0.25" />
      </g>

      <g fill={p.accent} opacity="0.6">
        <circle cx="980" cy="180" r="1.5" />
        <circle cx="1060" cy="120" r="1" />
        <circle cx="880" cy="100" r="1" />
      </g>
    </g>
  );
}

function Interchange({ p }: { p: Palette }) {
  return (
    <g>
      <g fill={p.structure} opacity="0.9">
        <rect x="40" y="470" width="90" height="250" />
        <rect x="150" y="420" width="70" height="300" />
        <rect x="240" y="500" width="110" height="220" />
        <rect x="880" y="460" width="80" height="260" />
        <rect x="980" y="510" width="130" height="210" />
        <rect x="1120" y="450" width="60" height="270" />
      </g>

      <g stroke={p.structure} strokeWidth="34" fill="none" strokeLinecap="round">
        <path d="M-50 700c260-20 380-180 560-190 200-12 260 170 480 180 80 4 160-20 260-70" />
        <path d="M120 900c40-220 200-300 360-310 180-10 260 100 420 110 120 8 220-40 300-140" />
      </g>
      <g stroke={p.accent} strokeWidth="1.5" fill="none" opacity="0.6">
        <path d="M-50 700c260-20 380-180 560-190 200-12 260 170 480 180 80 4 160-20 260-70" />
        <path d="M120 900c40-220 200-300 360-310 180-10 260 100 420 110 120 8 220-40 300-140" />
      </g>

      <g stroke={p.structure} strokeWidth="12">
        {[220, 420, 650, 880, 1050].map((x, i) => (
          <line key={x} x1={x} y1={i % 2 === 0 ? 660 : 780} x2={x} y2="900" />
        ))}
      </g>
      <g stroke={p.accent} strokeWidth="1" opacity="0.35">
        {[220, 420, 650, 880, 1050].map((x, i) => (
          <line key={x} x1={x} y1={i % 2 === 0 ? 660 : 780} x2={x} y2="900" />
        ))}
      </g>

      <g stroke={p.accent} strokeWidth="2" opacity="0.65">
        <path d="M80 705c100 0 150-20 220-40" />
        <path d="M750 700c100 4 180 0 280-30" />
        <path d="M300 870c60-60 130-80 210-80" />
      </g>

      <g fill={p.accent} opacity="0.55">
        <circle cx="310" cy="680" r="2.5" />
        <circle cx="820" cy="690" r="2.5" />
        <circle cx="1020" cy="665" r="2" />
        <circle cx="580" cy="820" r="2" />
      </g>

      <g fill={p.accent} opacity="0.8">
        <circle cx="950" cy="170" r="60" opacity="0.09" />
        <circle cx="950" cy="170" r="2" />
      </g>
    </g>
  );
}

function Marina({ p }: { p: Palette }) {
  return (
    <g>
      <path d="M0 590h1200v310H0Z" fill="#071419" />
      <g stroke={p.accent} strokeWidth="1" opacity="0.14">
        {Array.from({ length: 16 }).map((_, i) => (
          <line key={i} x1="0" y1={610 + i * 17} x2="1200" y2={610 + i * 17} />
        ))}
      </g>

      <g fill={p.structure}>
        <rect x="90" y="330" width="130" height="270" />
        <rect x="250" y="390" width="100" height="210" />
        <rect x="390" y="270" width="150" height="330" />
        <rect x="590" y="350" width="110" height="250" />
        <rect x="740" y="290" width="160" height="310" />
        <rect x="950" y="370" width="120" height="230" />
      </g>

      <g stroke={p.accent} strokeWidth="1" opacity="0.45">
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={i} x1="400" y1={290 + i * 15} x2="530" y2={290 + i * 15} />
        ))}
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`b-${i}`} x1="750" y1={310 + i * 16} x2="890" y2={310 + i * 16} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`c-${i}`} x1="100" y1={350 + i * 20} x2="210" y2={350 + i * 20} />
        ))}
      </g>

      <g fill="#d9b477" opacity="0.22">
        {Array.from({ length: 22 }).map((_, i) => (
          <rect
            key={i}
            x={110 + (i % 4) * 30}
            y={360 + Math.floor(i / 4) * 30}
            width="14"
            height="10"
          />
        ))}
      </g>

      <g>
        <path d="M0 590h1200" stroke={p.accent} strokeWidth="1.5" opacity="0.55" />
        <path d="M0 700h1200" stroke={p.accent} strokeWidth="0.8" opacity="0.18" />
      </g>

      <g>
        <path d="M430 660l50-10 36 26-76 4Z" fill={p.structure} stroke={p.accent} strokeWidth="1" />
        <path d="M480 650v-48l30 38" fill="none" stroke={p.accent} strokeWidth="1.2" />
        <path d="M760 700l70-12 48 32-100 4Z" fill={p.structure} stroke={p.accent} strokeWidth="1" />
        <path d="M830 688v-60l38 46" fill="none" stroke={p.accent} strokeWidth="1.2" />
      </g>

      <g stroke={p.accent} strokeWidth="1" opacity="0.3">
        {[460, 820].map((x) => (
          <g key={x}>
            <line x1={x} y1="680" x2={x} y2="760" />
            <line x1={x - 20} y1="760" x2={x + 20} y2="760" />
          </g>
        ))}
      </g>

      <g fill={p.accent} opacity="0.75">
        <circle cx="980" cy="150" r="42" opacity="0.12" />
        <circle cx="980" cy="150" r="2" />
      </g>
    </g>
  );
}

function Solar({ p }: { p: Palette }) {
  return (
    <g>
      <circle cx="860" cy="240" r="150" fill={p.accent} opacity="0.09" />
      <circle cx="860" cy="240" r="92" fill={p.accent} opacity="0.14" />
      <circle cx="860" cy="240" r="48" fill={p.accent} opacity="0.3" />

      <path d="M0 600h1200v300H0Z" fill={p.structure} />
      <path d="M0 600h1200" stroke={p.accent} strokeWidth="1" opacity="0.35" />

      <g fill={p.structure} stroke={p.accent} strokeWidth="1" opacity="0.8">
        {Array.from({ length: 5 }).map((_, row) => (
          <g key={row} transform={`translate(${row * 8} ${row * 58})`}>
            {Array.from({ length: 8 }).map((_, col) => (
              <g key={col}>
                <path
                  d={`M${70 + col * 132} ${520 + row * 58}l84-24 40 22-84 24Z`}
                  fill="#0b1118"
                  opacity="0.9"
                />
                <path
                  d={`M${70 + col * 132} ${520 + row * 58}l84-24 40 22`}
                  fill="none"
                  stroke={p.accent}
                  strokeWidth="0.8"
                  opacity="0.55"
                />
              </g>
            ))}
          </g>
        ))}
      </g>

      <g stroke={p.accent} strokeWidth="1.4" fill="none" opacity="0.55">
        <path d="M250 680V300M250 330l-50 60M250 330l50 60M250 380l-60 70M250 380l60 70M250 440l-70 80M250 440l70 80" />
        <path d="M1040 680V330M1040 360l-45 55M1040 360l45 55M1040 410l-55 65M1040 410l55 65" />
      </g>
      <g stroke={p.structure} strokeWidth="5" fill="none">
        <path d="M250 680V300M1040 680V330" />
      </g>

      <g stroke={p.accent} strokeWidth="1" opacity="0.18">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1="0" y1={600 + i * 24} x2="1200" y2={600 + i * 24} />
        ))}
      </g>

      <g fill={p.accent} opacity="0.55">
        <circle cx="620" cy="130" r="1.5" />
        <circle cx="700" cy="90" r="1" />
        <circle cx="1050" cy="130" r="1" />
      </g>
    </g>
  );
}

export function ProjectArt({
  variant,
  className,
  label,
}: {
  variant: ArtVariant;
  className?: string;
  label?: string;
}) {
  const rawId = useId();
  const uid = rawId.replace(/[:]/g, "");
  const p = palettes[variant];

  const content = (() => {
    switch (variant) {
      case "tower":
        return <Tower p={p} />;
      case "villa":
        return <Villa p={p} />;
      case "bridge":
        return <Bridge p={p} />;
      case "industrial":
        return <Industrial p={p} />;
      case "heritage":
        return <Heritage p={p} />;
      case "interchange":
        return <Interchange p={p} />;
      case "marina":
        return <Marina p={p} />;
      case "solar":
        return <Solar p={p} />;
      default:
        return <Tower p={p} />;
    }
  })();

  return (
    <svg
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
      className={cn("project-art", className)}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor={p.top} />
          <stop offset="100%" stopColor={p.bottom} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={p.haze} stopOpacity="0.35" />
          <stop offset="100%" stopColor={p.haze} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-vignette`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050607" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#050607" stopOpacity="0" />
          <stop offset="100%" stopColor="#050607" stopOpacity="0.55" />
        </linearGradient>
        <pattern id={`${uid}-grid`} width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M72 0H0V72" fill="none" stroke={p.accent} strokeWidth="0.5" opacity="0.13" />
        </pattern>
      </defs>

      <rect width="1200" height="900" fill={`url(#${uid}-sky)`} />
      <ellipse cx="820" cy="260" rx="560" ry="380" fill={`url(#${uid}-glow)`} />
      <rect width="1200" height="900" fill={`url(#${uid}-grid)`} opacity="0.55" />
      {content}
      <rect width="1200" height="900" fill={`url(#${uid}-vignette)`} />
      <rect
        x="0.5"
        y="0.5"
        width="1199"
        height="899"
        fill="none"
        stroke={p.accent}
        strokeOpacity="0.16"
      />
    </svg>
  );
}

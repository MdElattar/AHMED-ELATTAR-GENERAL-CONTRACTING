# 🏗️ Ahmed Elattar General Contracting Co.
### شركة أحمد العطار للمقاولات العامة

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16_%28App_Router%29-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Three.js-WebGL_3D-black?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/GSAP-ScrollTrigger-88CE02?style=for-the-badge&logo=greensock&logoColor=black" alt="GSAP" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/i18n-Arabic_%2F_English-C5A059?style=for-the-badge" alt="i18n Support" />
</p>

> **"Innovating Construction... Building a Legacy That Endures"**  
> *نبتكر في البناء.. لنترك أثراً يخلده الزمن*

An ultra-luxurious, Arab-first (RTL) bilingual marketing experience, procedural 3D heavy-equipment kinematics engine, real-time client transparency portal, and administrative control center crafted exclusively for **Ahmed Elattar General Contracting Company**.

---

## 🌟 Executive Overview

**Ahmed Elattar General Contracting Co.** sets a new digital standard for flagship mega-construction enterprises across the Arab world. Moving beyond static corporate websites, this platform immerses visitors in a cinematic, scroll-driven web experience. Powered by procedural WebGL 3D rendering (Three.js / R3F) synchronized seamlessly with GSAP ScrollTrigger timelines, users interactively explore architectural engineering milestones, equipment mechanics, and structural progress.

The system bridges high-end architectural aesthetics with full enterprise utilities, including an authenticated Client Progress & Invoicing Portal (`/portal`), an Administrative Business Control Center (`/admin`), and an instant zero-flicker i18n localization pipeline.

---

## 🎨 Color Palette & Visual Identity

The platform utilizes a modern luxury industrial design language:

| Color Name | Hex Code | Visual Application |
| :--- | :---: | :--- |
| **Obsidian Dark** | `#0B0C10` | Immersive main backgrounds & canvas viewport |
| **Champagne Gold** | `#C5A059` | Primary brand accent, call-to-actions, engineering highlights |
| **Charcoal Steel** | `#1F2833` | Glassmorphism cards, surface panels & sticky header overlays |
| **Ivory White** | `#F4F4F4` | High-contrast typography & structural detail vectors |

---

## 💻 Technical Architecture & Stack

| Layer | Technology | Key Details & Capabilities |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | React 19 Server Components, Server Actions & Static Route Optimization |
| **Language** | **TypeScript** | Strict type safety, procedural mesh interfaces & data schema enforcement |
| **Styling** | **Tailwind CSS 4** | Custom design tokens, glassmorphism filters, dynamic dark/light contrast |
| **3D Kinematics** | **Three.js & R3F** | Procedural WebGL geometry, directional sun shadows & brushed-metal PBR shaders |
| **Motion & Scroll** | **GSAP & ScrollTrigger** | Pinned layout sequences, Lenis smooth scrolling, camera path interpolation |
| **Micro-Interactions**| **Framer Motion** | UI card reveals, interactive drawers, modal state transitions |
| **Localization** | **Bilingual i18n System** | Native Arabic (RTL) primary & English (LTR) secondary with `localStorage` sync |

---

## 🏗️ Core Business Pillars & Engineering Expertise

* **🏢 Residential Towers & Luxury Complexes:** Modern high-rise residential architecture engineered for structural durability and maximum spatial luxury.
* **💼 Commercial & Administrative Facilities:** State-of-the-art corporate headquarters, commercial malls, and high-capacity administrative hubs.
* **🌉 Infrastructure & Civil Works:** Large-scale bridge work, structural foundations, and essential utility developments.
* **🏭 Industrial & Logistics Facilities:** Heavy industrial plants, specialized logistics warehouses, and ISO-compliant industrial structures.

---

## 🚀 Key Features & System Modules

### 1. Procedural 3D Crane & Urban Scene Dynamics
* **Zero-GLB Procedural Geometry:** The main heavy tower crane model is constructed entirely via procedural primitives and instanced structural trusses, eliminating external 3D file load delays.
* **Scroll-Bound Kinematics:** GSAP ScrollTrigger maps scroll progress directly to mechanical crane slewing, boom elevation, trolley travel, cable drop, and hook payload positioning.
* **Interactive Structural Assembly:** Secondary pinned scroll sequence simulating real-time steel rebar and wooden framework snapping into position as milestones reveal.

### 2. Auth-Gated Client Portal (`/portal`)
* **Real-Time Project Tracking:** Milestone progress metrics, live site photo updates, and engineering timeline logs.
* **Financial & Blueprint Vault:** Secure access to billing stages, downloadable contract PDFs, and architectural blueprints.
* **Direct Supervision Line:** In-app direct communication channel with project managers and site engineers.

### 3. Administrative Control Center (`/admin`)
* **Project CRUD Engine:** Complete operational control to add, edit, or archive project showcase items, specs, and engineering progress logs.
* **Financial & Profit Metrics:** Admin overview of total contract valuations, budget distributions, net profits, and client invoice statuses.
* **Dynamic Banner & Media Control:** Real-time updates for homepage hero announcements, fleet availability, and service offerings.

### 4. Zero-Flicker Bilingual Engine (AR / EN)
* **Dual Directionality (RTL / LTR):** Full native RTL support for Arabic and instant toggle for LTR English layout.
* **State Persistence:** Automatically syncs user language via `localStorage` (`alattar-locale`), updates `<html lang dir>`, and supports shareable URL params (`?lang=ar` / `?lang=en`).

---

## 📁 Directory & File Structure

```text
AHMED-ELATTAR-GENERAL-CONTRACTING/
├── src/
│   ├── app/                    # Next.js App Router Pages & API Routes
│   │   ├── admin/              # Comprehensive Business Admin Control Panel
│   │   ├── portal/             # Client Project Transparency Dashboard
│   │   ├── projects/           # Filterable Mega-Project Showcase & Modals
│   │   ├── services/           # Heavy Equipment & Contracting Line Items
│   │   ├── about/              # Founder Story, Vision & ISO Certifications
│   │   ├── contact/            # Bidding Form & File Attachment System
│   │   └── page.tsx            # Full Homepage featuring Procedural 3D Canvas
│   ├── components/
│   │   ├── 3d/                 # R3F Canvas, Procedural Crane Meshes & Lights
│   │   ├── layout/             # Seamless Glass Navbar, Footer & Preloader
│   │   ├── providers/          # Smooth Scroll, Auth & i18n Context Providers
│   │   ├── sections/           # Pinned GSAP Scroll & Interactive Showcase Sections
│   │   └── ui/                 # Bespoke Inline SVG Vectors, Modals & Buttons
│   ├── data/                   # Initial Datasets (Projects, Invoices, Fleet)
│   └── lib/                    # Dictionary Core (`dictionary.ts`) & Utilities
├── public/                     # Static Brand Icons & Manifest Files
├── package.json
└── tsconfig.json
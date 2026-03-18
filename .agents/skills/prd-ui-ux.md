# EvConn Laboratory — UI/UX Design System PRD
## Frontend Design Requirements Document
**Version:** 1.0
**Scope:** Full Platform — Public Website + LMS + Dashboard
**Status:** Ready for Design Implementation

---

## Table of Contents

1. [Design Vision & Direction](#1-design-vision--direction)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Motion & Animation System](#4-motion--animation-system)
5. [3D Background & Atmospheric Effects](#5-3d-background--atmospheric-effects)
6. [Component Design System](#6-component-design-system)
7. [Layout & Spatial System](#7-layout--spatial-system)
8. [Page-by-Page UI Specification](#8-page-by-page-ui-specification)
9. [Responsive Design System](#9-responsive-design-system)
10. [Accessibility Requirements](#10-accessibility-requirements)
11. [Tech Stack Recommendations](#11-tech-stack-recommendations)

---

## 1. Design Vision & Direction

### 1.1 Brand Identity Reference

**EvConn Laboratory** logo uses:
- Hexagonal modular shapes (honeycomb pattern) — symbolizes connectivity, data nodes, network topology
- Color progression: **Teal → Cyan → Green → Blue** (left to right gradient narrative)
- Dark background (`#000000` / near-black) as the dominant canvas
- Bold, clean sans-serif wordmark

### 1.2 Overall Aesthetic Direction

**Theme:** `Dark Futuristic Flat + Hexagonal Network`

The design system must feel like a **precision-engineered research environment** — not a generic edu-tech SaaS. Think: the visual language of network topology diagrams, circuit board traces, and data flow — rendered flat, clean, and functional. No skeuomorphic shadows or heavy glassmorphism. The 3D/animation elements live in the *background only* — foreground UI stays flat, legible, and fast.

**Keywords:** Flat · Dark · Teal-accented · Hexagonal grid · Network nodes · Clean data visualization · Controlled micro-motion

**Tone:** Professional intelligence. Like looking at a real-time network monitoring tool — but elegant and academic.

### 1.3 Design Principles

| Principle         | Application                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| **Flat-first**    | All UI components are flat — no drop shadows, no glassmorphism           |
| **Dark canvas**   | Primary backgrounds are deep dark navy/black; content floats on darkness |
| **Hex motif**     | Hexagons appear as structural decoration, badges, avatars, accents       |
| **Teal as life**  | Teal/cyan is the primary interactive color — all CTAs, links, highlights |
| **Green = success** | Green (from logo's center hexagon) = completion, success, positive states |
| **Blue = depth**  | Blue (rightmost hex) = secondary info, metadata, supporting content     |
| **Motion = purposeful** | Animations serve information — not decoration for its own sake    |

---

## 2. Color System

### 2.1 Core Palette

Extracted directly from EvConn logo and extended for full-system use.

```css
:root {
  /* === PRIMARY BRAND COLORS === */
  --evconn-teal:        #2ABFBF;   /* Primary teal — main hex cluster */
  --evconn-cyan:        #1DD9D9;   /* Bright cyan — accent / hover states */
  --evconn-green:       #00E676;   /* Electric green — center hexagon / success */
  --evconn-blue:        #3B82C4;   /* Steel blue — rightmost hexagon / depth */
  --evconn-blue-dark:   #2563A8;   /* Darker blue — secondary actions */

  /* === BACKGROUND LAYERS === */
  --bg-base:            #080C10;   /* True dark — main background */
  --bg-surface:         #0D1318;   /* Surface cards */
  --bg-elevated:        #111920;   /* Elevated cards, modals */
  --bg-border:          #1A2736;   /* Subtle borders */
  --bg-overlay:         #162030;   /* Hover overlays */

  /* === TEXT === */
  --text-primary:       #F0F4F8;   /* Primary text — slightly cool white */
  --text-secondary:     #8BA8C0;   /* Secondary / muted text */
  --text-tertiary:      #4A6380;   /* Disabled / placeholder */
  --text-on-teal:       #000000;   /* Text on teal buttons */

  /* === SEMANTIC STATES === */
  --state-success:      #00E676;   /* Same as evconn-green */
  --state-warning:      #FFB347;   /* Warm amber */
  --state-error:        #FF5252;   /* Alert red */
  --state-info:         #2ABFBF;   /* Same as teal */

  /* === GRADIENTS === */
  --gradient-brand:     linear-gradient(135deg, #2ABFBF 0%, #00E676 50%, #3B82C4 100%);
  --gradient-dark-fade: linear-gradient(180deg, #080C10 0%, #0D1A26 100%);
  --gradient-teal-glow: radial-gradient(ellipse at center, rgba(42,191,191,0.15) 0%, transparent 70%);
  --gradient-hex-mesh:  linear-gradient(60deg, #2ABFBF15, #00E67610, #3B82C415);

  /* === HEX ACCENT OPACITIES (for decorative elements) === */
  --hex-teal-10:        rgba(42, 191, 191, 0.10);
  --hex-teal-20:        rgba(42, 191, 191, 0.20);
  --hex-green-10:       rgba(0, 230, 118, 0.10);
  --hex-blue-10:        rgba(59, 130, 196, 0.10);
}
```

### 2.2 Color Usage Rules

| Use Case                    | Color Token                     |
| --------------------------- | ------------------------------- |
| Primary CTA buttons         | `--evconn-teal`                 |
| Primary CTA hover           | `--evconn-cyan`                 |
| Active navigation           | `--evconn-teal`                 |
| Links                       | `--evconn-cyan`                 |
| Success / completion states | `--evconn-green`                |
| Secondary actions           | `--evconn-blue`                 |
| Card backgrounds            | `--bg-surface`                  |
| Dividers / borders          | `--bg-border`                   |
| Page background             | `--bg-base`                     |
| Body text                   | `--text-primary`                |
| Captions / metadata         | `--text-secondary`              |
| Disabled                    | `--text-tertiary`               |
| Warning alerts              | `--state-warning`               |
| Error alerts                | `--state-error`                 |

### 2.3 Dark Mode Only

This design system is **dark-first and dark-only**. No light mode variant in Phase 1.

---

## 3. Typography

### 3.1 Font Stack

```css
/* PRIMARY FONT — UI, headings, body */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

/* SECONDARY FONT — data labels, captions, metadata, mono-ish content */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

/* MONO FONT — code, NIM display, IDs, CSV data */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-primary:   'Poppins', sans-serif;
  --font-secondary: 'Plus Jakarta Sans', sans-serif;
  --font-mono:      'JetBrains Mono', monospace;
}
```

### 3.2 Type Scale

```css
:root {
  /* Display — hero sections, landing page hero */
  --text-display-xl:  clamp(2.5rem, 6vw, 5rem);       /* 80px max */
  --text-display-lg:  clamp(2rem, 4.5vw, 3.5rem);     /* 56px max */

  /* Headings */
  --text-h1:          clamp(1.75rem, 3.5vw, 2.5rem);  /* 40px max */
  --text-h2:          clamp(1.5rem, 2.5vw, 2rem);     /* 32px max */
  --text-h3:          clamp(1.25rem, 2vw, 1.5rem);    /* 24px max */
  --text-h4:          1.125rem;                        /* 18px */

  /* Body */
  --text-body-lg:     1.125rem;   /* 18px — feature descriptions */
  --text-body:        1rem;       /* 16px — standard body */
  --text-body-sm:     0.875rem;   /* 14px — secondary text */

  /* Labels & Captions */
  --text-label:       0.8125rem;  /* 13px — form labels, nav items */
  --text-caption:     0.75rem;    /* 12px — metadata, timestamps */
  --text-micro:       0.6875rem;  /* 11px — badges, chips */
}
```

### 3.3 Font Weight Usage

| Weight | Use Case                                             |
| ------ | ---------------------------------------------------- |
| 300    | Decorative large display numbers, hero subtitles     |
| 400    | Body text, descriptions, form inputs                 |
| 500    | Navigation labels, sub-headings, card titles         |
| 600    | Section headings, button labels, table headers       |
| 700    | H1, H2, feature titles, CTA text                    |
| 800    | Hero display text, stat numbers, splash typography   |

### 3.4 Typography Behavior

- **Letter spacing:** Display text uses `letter-spacing: -0.03em`; headings use `-0.02em`; body is `0`; labels use `0.04em` uppercase
- **Line height:** Display = 1.1; Headings = 1.25; Body = 1.65; Captions = 1.4
- **Brand gradient text:** Hero headings can use `background-clip: text` with `--gradient-brand`

---

## 4. Motion & Animation System

### 4.1 Animation Philosophy

**Rule:** Motion must be purposeful and physics-based. Three tiers:

| Tier          | Use Case                                   | Duration     | Easing                        |
| ------------- | ------------------------------------------ | ------------ | ----------------------------- |
| **Micro**     | Button hover, focus states, toggle         | 120–180ms    | `cubic-bezier(0.4, 0, 0.2, 1)` |
| **Standard**  | Page element reveals, card hover, drawer   | 240–400ms    | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Cinematic** | Page transitions, hero load, 3D scene      | 600–1200ms   | `cubic-bezier(0.22, 1, 0.36, 1)` |

### 4.2 Framer Motion Patterns

**Page load stagger (all pages):**
```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};
```

**Card hover lift:**
```jsx
const cardHover = {
  rest: { y: 0, borderColor: 'var(--bg-border)' },
  hover: {
    y: -4,
    borderColor: 'var(--evconn-teal)',
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
  }
};
```

**Hexagon pulse (decorative elements):**
```jsx
const hexPulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.4, 0.7, 0.4],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
  }
};
```

**Number counter (dashboard stats):**
```jsx
// Use Framer Motion's useMotionValue + useTransform
// Count up from 0 to target value on scroll-enter
// Duration: 1.2s, ease: easeOut
```

**Route transitions:**
```jsx
const pageTransition = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, x: 16,  transition: { duration: 0.2 } }
};
```

### 4.3 CSS-only Micro-animations

```css
/* Button shine sweep */
.btn-primary::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  transition: left 0.4s ease;
}
.btn-primary:hover::after { left: 100%; }

/* Hex border glow on focus */
.input-field:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--evconn-teal), 0 0 16px rgba(42,191,191,0.2);
  transition: box-shadow 0.18s ease;
}

/* Teal underline reveal on nav hover */
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0;
  width: 0; height: 2px;
  background: var(--evconn-teal);
  transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
}
.nav-link:hover::after { width: 100%; }

/* Skeleton shimmer */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-elevated) 50%, var(--bg-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## 5. 3D Background & Atmospheric Effects

### 5.1 Background Strategy

3D/animated elements exist **exclusively in the background layer** (`z-index: 0`). All UI content renders on top (`z-index: 1+`). Backgrounds must never compete with content legibility.

**Two background types used across the platform:**

| Page Context               | Background Type          | Technology        |
| -------------------------- | ------------------------ | ----------------- |
| Landing / Public website   | Floating hexagon network | Three.js          |
| Dashboard / LMS pages      | Subtle hex grid pattern  | CSS + SVG         |
| Auth pages (Login/Register)| Particle nodes mesh      | Three.js          |
| Module / Content pages     | Static dark + hex accent | CSS only          |

---

### 5.2 Three.js — Floating Hexagon Network (Landing Page)

**Effect description:** A slowly rotating 3D cluster of hexagonal nodes connected by faint lines — like a data network topology. Nodes pulse gently. Lines flicker with data-flow animation. Color: teal/cyan/green matching the logo.

```javascript
// Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 1000);
camera.position.z = 40;

// Hexagonal prism geometry for nodes
const hexGeo = new THREE.CylinderGeometry(1, 1, 0.2, 6);

// Node colors sampled from brand palette
const nodeColors = ['#2ABFBF', '#1DD9D9', '#00E676', '#3B82C4', '#2563A8'];

// 80–120 nodes, randomly distributed in 3D space
// Each node: HexPrism mesh with emissive material (no light needed)
// Node size varies: 0.3 to 1.2 scale
// Nodes pulse: scale oscillates ±5% with staggered phase offsets

// Connections: LineSegments between nearby nodes (distance < 15 units)
// Line opacity: 0.08–0.15 (very faint)
// Line color: #2ABFBF at low alpha

// Animation loop:
// - Entire group rotates: Y += 0.0003, X += 0.0001 per frame
// - Each node bobs: position.y += Math.sin(time + phase) * 0.002
// - Nodes near mouse attract slightly (optional: mouse parallax ±2 units)

// Post-processing (optional, improves quality):
// - UnrealBloomPass: threshold 0.8, strength 0.4, radius 0.5
// → teal glow on bright nodes
```

**Performance target:** Stays above 60fps. Scale down node count on mobile. Use `requestAnimationFrame` correctly. Canvas is `position: fixed`, full-viewport, `pointer-events: none`.

---

### 5.3 Three.js — Particle Node Mesh (Auth Pages)

**Effect description:** Dense particle field forming a soft mesh — particles slowly drift, connected by thin lines when close. Monochromatic teal. Minimal, calming.

```javascript
// 300–500 points as BufferGeometry + PointsMaterial
// Color: #2ABFBF, size: 1.5px, opacity: 0.5
// Movement: each particle drifts with unique velocity (0.001–0.003 units/frame)
// Wrap-around: particles that leave bounds teleport to opposite side
// Connections: LineSegments updated each frame for pairs within 8 units
// Line color: #2ABFBF at 0.08 opacity
// Mouse parallax: camera shifts ±1.5 units tracking mouse position
```

---

### 5.4 CSS Hex Grid (Dashboard / LMS Pages)

For authenticated app pages where Three.js would be too heavy:

```css
/* SVG hexagonal tile as background-image */
/* Hex SVG: outline only, 1px stroke, var(--hex-teal-10) */

.app-background {
  background-color: var(--bg-base);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 2 L54 16 L54 44 L28 58 L2 44 L2 16 Z' fill='none' stroke='rgba(42,191,191,0.06)' stroke-width='1'/%3E%3Cpath d='M28 58 L54 72 L54 100 L28 114 L2 100 L2 72 Z' fill='none' stroke='rgba(42,191,191,0.06)' stroke-width='1'/%3E%3C/svg%3E");
  background-size: 56px 100px;
}

/* Add a subtle radial gradient overlay to vignette the pattern */
.app-background::before {
  content: '';
  position: fixed; inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(42,191,191,0.04) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}
```

---

### 5.5 Background Layering Architecture

```
[z: 0]  Three.js canvas / CSS hex grid      ← animated background
[z: 1]  Global gradient overlays             ← darken edges, improve legibility
[z: 2]  Page layout root                     ← all UI components
[z: 100] Navigation (fixed)
[z: 200] Modals, drawers
[z: 300] Toasts, notifications
```

---

## 6. Component Design System

### 6.1 Buttons

```
VARIANTS
────────────────────────────────────────────────────────────

Primary:
  background: var(--evconn-teal)
  color: #000
  font: Poppins 600, 14px
  padding: 10px 24px
  border-radius: 6px
  border: none
  hover: background shifts to var(--evconn-cyan), slight scale(1.02)
  active: scale(0.98)
  transition: 160ms ease

Secondary (Outline):
  background: transparent
  border: 1.5px solid var(--evconn-teal)
  color: var(--evconn-teal)
  hover: background var(--hex-teal-10), border var(--evconn-cyan)

Ghost:
  background: transparent
  color: var(--text-secondary)
  hover: color var(--text-primary), background var(--bg-overlay)

Danger:
  background: var(--state-error) at 15% opacity
  border: 1px solid var(--state-error)
  color: var(--state-error)
  hover: background var(--state-error), color #000

SUCCESS STATE (post-action):
  border-color: var(--evconn-green)
  color: var(--evconn-green)
  shows checkmark icon with Framer Motion spring scale
```

### 6.2 Cards

```
Base Card:
  background: var(--bg-surface)
  border: 1px solid var(--bg-border)
  border-radius: 12px
  padding: 24px

Interactive Card (hover):
  border-color animates to var(--evconn-teal) on hover
  slight translateY(-4px) with Framer Motion
  background shifts to var(--bg-elevated)
  top-left corner: 2px × 2px teal accent line (border-left + border-top)

Module Card:
  Left edge: 3px solid var(--evconn-teal) (status = open)
  Left edge: 3px solid var(--text-tertiary) (status = closed/draft)
  Left edge: 3px solid var(--evconn-green) (status = complete)
  Header: module number as small hex badge
  Includes: progress bar (teal fill on dark track)

Assignment Card:
  Type badge: pill with icon
    tugas_rumah → amber border
    tugas_praktikum → teal border
    study_group_task → blue border
  Format tag: MCQ (auto label) | PDF (manual label)
  Deadline: shown as countdown if <24h (amber color)
```

### 6.3 Navigation

```
Top Navigation Bar (Public Website):
  height: 64px
  background: rgba(8,12,16,0.85) + backdrop-filter: blur(12px)
  border-bottom: 1px solid var(--bg-border)
  Logo: EvConn wordmark SVG (white) — left
  Nav links: Poppins 500, 14px, var(--text-secondary)
  Active/hover: var(--evconn-teal) with underline reveal animation
  CTA button: "Login" — outline teal | "Daftar" — primary teal
  Scroll behavior: navbar gains slight teal glow at top of page

Sidebar Navigation (LMS Dashboard):
  width: 240px (expanded), 64px (collapsed)
  background: var(--bg-surface)
  border-right: 1px solid var(--bg-border)
  Section dividers: var(--bg-border) hairlines with section label in var(--text-tertiary)
  Active item: background var(--hex-teal-20), left border 3px var(--evconn-teal)
  Hover item: background var(--bg-overlay)
  Icons: 20px, teal for active, secondary for rest
  Collapse: icon-only mode with tooltips
  Logo: full at top, collapses to hex icon only
```

### 6.4 Form Elements

```
Input Fields:
  background: var(--bg-surface)
  border: 1px solid var(--bg-border)
  border-radius: 8px
  padding: 10px 14px
  font: Plus Jakarta Sans 400, 15px
  color: var(--text-primary)
  placeholder: var(--text-tertiary)

  Focus:
    border-color: var(--evconn-teal)
    box-shadow: 0 0 0 3px rgba(42,191,191,0.15)
    transition: 180ms

  Error:
    border-color: var(--state-error)
    box-shadow: 0 0 0 3px rgba(255,82,82,0.12)

  Label: Plus Jakarta Sans 500, 13px, var(--text-secondary), uppercase, tracking 0.04em

Select / Dropdown:
  Same styling as Input
  Custom chevron icon in var(--text-secondary)
  Dropdown panel: var(--bg-elevated), border var(--bg-border), border-radius 8px
  Option hover: var(--bg-overlay)
  Option selected: var(--hex-teal-20), color var(--evconn-teal)

File Upload Zone:
  border: 2px dashed var(--bg-border)
  border-radius: 12px
  padding: 32px
  center-aligned icon + text
  drag-over: border-color var(--evconn-teal), background var(--hex-teal-10)
  Framer Motion: subtle scale(1.02) on drag-over
```

### 6.5 Badges & Status Indicators

```
Status Badge (pills):
  border-radius: 100px
  padding: 3px 10px
  font: Poppins 500, 11px, uppercase, letter-spacing 0.06em

  open     → teal bg-10 + teal text
  closed   → border + secondary text
  draft    → amber bg-10 + amber text
  complete → green bg-10 + green text
  graded   → blue bg-10 + blue text
  pending  → tertiary text only

Hex Number Badge (group numbers, module numbers):
  Hexagonal clip-path shape
  background: var(--evconn-teal)
  color: #000
  font: Poppins 700, 12px
  size: 32×28px
  used as: group number indicator, module order indicator

Notification dot:
  8px circle, var(--evconn-teal), absolute top-right of icon
  Framer Motion: scale bounce on appear
```

### 6.6 Tables (Grading / Enrollment)

```
Table container: var(--bg-surface), border-radius 12px, overflow hidden
Header row: background var(--bg-elevated), Poppins 600 13px, uppercase, var(--text-secondary)
Data rows: border-bottom 1px var(--bg-border), Poppins 400 14px, height 52px
Row hover: background var(--bg-overlay)
Sticky header: position sticky, top 0, z-index 10, backdrop blur

Column: NIM/ID → JetBrains Mono 13px
Column: Score → right-aligned, Poppins 700, teal if passing
Column: Status → badge pill (see above)
Column: Actions → icon buttons, ghost style

Pagination:
  bottom of table, right-aligned
  page number buttons: outline on active page (teal)
  prev/next: ghost with chevron icon
```

### 6.7 Progress & Feedback Elements

```
Module Progress Bar:
  track: var(--bg-border), height 4px, border-radius 2px
  fill: var(--evconn-teal), animated width transition 600ms ease
  complete: fill color changes to var(--evconn-green)

Circular Progress (dashboard widget):
  SVG circle, stroke var(--evconn-teal)
  animated stroke-dashoffset on mount
  center: percentage in Poppins 700

Feedback Rating Stars:
  5 hexagonal icons (not stars — use hex shape for brand alignment)
  Inactive: var(--bg-border)
  Hover/selected: fill var(--evconn-teal) with glow
  Framer Motion: scale bounce on select

Toast Notifications:
  position: bottom-right, fixed
  background: var(--bg-elevated)
  border-left: 4px solid (success=green, error=red, info=teal, warning=amber)
  Framer Motion: slide in from right + fade, slide out on dismiss
  auto-dismiss: 4000ms
```

---

## 7. Layout & Spatial System

### 7.1 Spacing Scale

```css
:root {
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;
  --space-32: 128px;
}
```

### 7.2 Layout Grid

```css
/* Public website */
.container-public {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

/* LMS / Dashboard */
.app-layout {
  display: grid;
  grid-template-columns: 240px 1fr;   /* sidebar + main */
  grid-template-rows: 64px 1fr;       /* topbar + content */
  min-height: 100vh;
}

/* Content grid for module cards, course cards */
.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}
```

### 7.3 Border Radius Scale

```css
:root {
  --radius-sm:   4px;   /* chips, badges */
  --radius-md:   8px;   /* inputs, small cards */
  --radius-lg:  12px;   /* cards, panels */
  --radius-xl:  16px;   /* hero sections, large modals */
  --radius-full: 9999px; /* pills */
}
```

---

## 8. Page-by-Page UI Specification

### 8.1 Public Landing Page

**Background:** Three.js hexagon network (Section 5.2), full viewport, fixed.

**Sections:**

```
─── HERO ────────────────────────────────────────────────────
  Layout: full-viewport (100vh)
  Center-aligned content on dark canvas
  
  Elements (staggered Framer Motion reveal, 80ms delay each):
  1. Small teal label: "EvConn Laboratory" — pill badge, hex icon
  2. H1 Display: "Evolving Connectivity" (brand gradient text on "Connectivity")
     font: Poppins 800, clamp(2.5rem, 6vw, 5rem)
  3. Sub: "Platform LMS & Profil Laboratorium Terpadu"
     font: Plus Jakarta Sans 400, 18px, var(--text-secondary)
  4. CTA row: [Mulai Belajar →] [Lihat Program]
  5. Floating stat chips (appear last, float animation):
     "1000+ Mahasiswa" | "3 Angkatan" | "2 Mata Kuliah"

  Scroll indicator: chevron-down, pulse animation

─── ABOUT / DOMAIN OVERVIEW ─────────────────────────────────
  4-column feature grid (scroll-triggered reveal)
  Each column: hex icon + title + short desc
  Icons: teal hexagon outline with filled icon inside

─── PROGRAMS ────────────────────────────────────────────────
  Horizontal scroll cards on mobile, 3-col grid on desktop
  Each card: thumbnail, title, short description
  Card: dark surface, teal left border accent, hover lift

─── LAB NEWS ────────────────────────────────────────────────
  Featured article: large (2/3 width) + 2 small (1/3 stacked)
  Article cards: thumbnail, tag badge, title, date
  "Lihat Semua Berita" CTA

─── HALL OF FAME PREVIEW ────────────────────────────────────
  Current active generation spotlight
  Horizontal scroll of assistant hex-avatar cards
  Each card: hex-shaped avatar, name, role badge
  "Lihat Semua Generasi" CTA

─── CTA SECTION ─────────────────────────────────────────────
  Full-width section, teal-to-blue gradient mesh background
  H2 + description + [Login ke LMS] button

─── FOOTER ──────────────────────────────────────────────────
  4-column: Logo+desc | Quick links | Courses | Contact
  Social icons: GitHub, Instagram, LinkedIn
  Bottom bar: copyright, very faint teal divider
```

---

### 8.2 Hall of Fame Page

```
Header: Page title + generation selector tabs (pill tabs, teal active)

Generation Tab Content:
  Header card: generation name, year range, member count (animated counter)
  
  Role-grouped grid:
    Section label: role name in var(--text-secondary), thin teal divider
    Card grid: 4-5 per row
    
  Assistant Card (80×100px on mobile, 140×180px on desktop):
    Hex-clipped avatar (CSS clip-path hexagon)
    Teal hex border ring
    Name: Poppins 600
    Role badge: teal/blue/green pill
    Social icons: GitHub / Instagram / LinkedIn (show on hover, slide up)
    Active badge: pulse dot (green)
    Alumni badge: faded styling

  Transition between generations: Framer Motion layout animation
```

---

### 8.3 Authentication Pages (Login / Register)

```
Background: Three.js particle mesh (Section 5.3), full viewport

Layout: centered card (480px wide), no sidebar

Login Card:
  Logo at top (centered, 120px)
  "Masuk ke EvConn LMS"
  
  For students:
    Input: NIM
    Input: Password
    Note text: "Login pertama menggunakan NIM sebagai password"
  
  For assistants / admin:
    Input: Email
    Input: Password
  
  Tab switcher: "Mahasiswa" | "Asisten / Admin" (pill toggle)
  Submit: full-width primary button
  Guest: "Daftar sebagai Peserta Study Group →"

Register Card (Guest):
  Name, Email, Password, Confirm Password
  Terms checkbox
  Submit CTA

First Login — Change Password:
  Full-screen modal overlay
  Cannot dismiss (must complete)
  Old pass (pre-filled/hidden) → New pass → Confirm
  Password strength indicator (teal fill bar)
```

---

### 8.4 Student Dashboard

```
Layout: Sidebar (240px) + Top bar + Main content area

Sidebar sections:
  - Beranda
  - Praktikum [course list]
  - Study Group [course list]
  - Nilai Saya
  - Profil

Top bar: greeting "Selamat datang, {name}" + notification bell

Main content:

  ROW 1 — Stats bar (4 stat cards, animated counters):
    Modul Aktif | Tugas Menunggu | Feedback Pending | Nilai Terbaru

  ROW 2 — Active modules (card grid):
    Module card: module title, deadline countdown, progress bar
    3 status indicators: Materials ✓ | Assignments ✓ | Feedback ✓

  ROW 3 — Submission status table (filterable by course):
    Assignment | Type | Submitted | Status | Grade

  ROW 4 — Upcoming deadlines widget (timeline style):
    Vertical line with teal dots, date labels, assignment names
```

---

### 8.5 Module Detail Page (Student)

```
Breadcrumb: Course → Module N

Module header:
  Left: hex badge (module number), title, open/close datetimes
  Right: completion status ring (circular SVG progress)

Content list (vertical ordered list):
  Each item: icon (pdf/video/link/assignment) + title + type badge
  Clickable → opens in right panel or modal

  PDF Viewer: embedded in page (iframe or react-pdf)
  Video: iframe embed
  Assignment: opens assignment detail view

Assignment detail panel:
  Type badge + format badge
  Description
  Deadline timer (if active)
  Submission area:
    MCQ: question cards with radio options, submit button
    Essay+PDF: text area + drag-drop file upload zone
  Resubmit: if allowed and deadline not passed
  Grade area (if published): score pill + comment box

Feedback section (appears after all required assignments submitted):
  3 cards side-by-side: For Assistant | For Session | For Laboratory
  Each: hex-rating icons (1–5) + optional text area
  Submit all 3 as one action
  Completion animation: all 3 turn green, module completion badge appears
```

---

### 8.6 Assistant Dashboard

```
Layout: same sidebar + topbar structure, different sidebar links

Main content:

  Offering selector: dropdown at top (filter all data below)

  ROW 1 — Quick stats (animated counters):
    Total Mahasiswa | Kelompok Aktif | Menunggu Dinilai | Rata-rata Feedback

  ROW 2 — Group management panel:
    Group cards: group number (hex badge) + member count + assigned assistant
    Expand: show student list with submission + grade status per student
    Actions: add student, move student, delete group (confirm modal)

  ROW 3 — Grading queue (filterable table):
    Filter bar: Module | Group | Assignment Type | Status
    Table columns: Student | NIM | Assignment | Submitted | Status | Action
    Action: "Nilai" → opens grade drawer from right
    Grade drawer: file preview + score input + comment + draft/publish buttons

  ROW 4 — Feedback analytics:
    3 donut charts: avg rating per type (assistant / session / lab)
    Line chart: avg rating trend across modules (recharts)
    Table: per-module breakdown
```

---

### 8.7 Admin Dashboard

```
Sidebar: expanded section links for all admin areas

Content pages:
  
  User Management:
    Search + filter bar
    Table: Name | NIM/Email | Role | Status | Actions
    Create user drawer / Edit user modal
    CSV import: dropzone → preview table → confirm → progress bar → summary

  Course Management:
    Course list cards with type badge (praktikum/study group)
    Offering list per course: table with status, semester, assistant badges
    Create/edit offering: form modal

  Hall of Fame Management:
    Generation tabs (same as public view but with edit actions)
    "+ Tambah Anggota" → modal with all assistant profile fields
    Drag-to-reorder within generation (Framer Motion drag)
    Organizational role assignment: multi-select chips

  CMS Pages:
    Page editor: title + rich text (Quill or TipTap)
    Programs: card manager with drag-to-reorder
    News: article list → article editor with image gallery manager
    Gallery: grid with drag-reorder
```

---

## 9. Responsive Design System

### 9.1 Breakpoints

```css
:root {
  --bp-sm:   640px;
  --bp-md:   768px;
  --bp-lg:  1024px;
  --bp-xl:  1280px;
  --bp-2xl: 1536px;
}
```

### 9.2 Responsive Behavior Per Context

| Component             | Mobile (< 768px)                    | Desktop (≥ 1024px)              |
| --------------------- | ----------------------------------- | -------------------------------- |
| Three.js background   | Reduced particle/node count (60%)   | Full quality                     |
| Navigation            | Hamburger → bottom drawer           | Full horizontal / sidebar        |
| Sidebar               | Hidden, toggleable bottom sheet     | Fixed 240px sidebar              |
| Hero section          | Stack vertically, smaller type      | Side-by-side or full-width       |
| Cards grid            | 1 column                            | 2–4 columns                      |
| Grading table         | Horizontal scroll                   | Full table                       |
| Module content list   | Full width stack                    | Content list + side panel        |
| Stats bar             | 2×2 grid                            | 4 inline                         |

---

## 10. Accessibility Requirements

| Requirement                    | Specification                                                       |
| ------------------------------ | ------------------------------------------------------------------- |
| Color contrast (text/bg)       | Minimum 4.5:1 for body text; 3:1 for large text and UI components   |
| Focus indicators               | 3px teal ring on all interactive elements (no default browser ring) |
| Keyboard navigation            | Full keyboard support; tab order follows visual order               |
| ARIA labels                    | All icon-only buttons have `aria-label`                             |
| Screen reader                  | `role`, `aria-live` for toast notifications, status updates         |
| Motion preference              | `prefers-reduced-motion`: disable Three.js animation, CSS animations |
| Form validation                | Inline error messages; never color-only error indicators            |
| Semantic HTML                  | `<main>`, `<nav>`, `<article>`, `<section>`, `<header>`, `<footer>` |

```css
@media (prefers-reduced-motion: reduce) {
  .three-canvas { display: none; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Tech Stack Recommendations

### 11.1 Core Framework

```
React 18 + TypeScript
Next.js 14 (App Router) — for SSR on public pages, client components in LMS
```

### 11.2 Animation

| Library          | Use Case                                      |
| ---------------- | --------------------------------------------- |
| Framer Motion 11 | Page transitions, card hovers, stagger reveals, drag |
| Three.js r160    | Background 3D scenes (landing, auth)          |
| CSS Animations   | Micro-interactions, skeleton shimmer, underlines |

### 11.3 UI & Styling

```
Tailwind CSS v4     — utility classes (configured with design token overrides)
CSS Variables       — full design token system (as defined in this PRD)
Lucide React        — icon library (consistent with flat style)
```

### 11.4 Data Visualization (Dashboards)

```
Recharts            — line charts (feedback trends), bar charts (submission stats)
Custom SVG          — circular progress rings, hex badge shapes
```

### 11.5 Form & Rich Text

```
React Hook Form + Zod   — form state + validation
TipTap                  — rich text editor (news articles, CMS pages)
react-pdf               — PDF viewer (submission review)
```

### 11.6 Performance Budget

| Metric                        | Target              |
| ----------------------------- | ------------------- |
| First Contentful Paint        | < 1.5s              |
| Largest Contentful Paint      | < 2.5s              |
| Cumulative Layout Shift       | < 0.1               |
| Time to Interactive           | < 3.5s              |
| Three.js canvas target FPS    | 60fps (desktop), 30fps (mobile) |
| Bundle size (initial JS)      | < 200kb gzipped     |

### 11.7 Three.js Loading Strategy

```javascript
// Lazy load Three.js only on pages that need it
// Use dynamic import with Next.js
const HexBackground = dynamic(
  () => import('@/components/HexBackground'),
  { ssr: false, loading: () => <div className="bg-base fixed inset-0" /> }
);
```

---

*End of UI/UX PRD v1.0 — EvConn Laboratory*
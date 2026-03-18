"use client";

/**
 * Flat 2D animated network/cloud computing background.
 * Pure SVG + CSS — no canvas, no Three.js.
 *
 * Elements:
 *  • Isometric-hint dot grid
 *  • 11 server / router / container nodes with pulsing rings
 *  • Connection paths with animated dash flow
 *  • Animated data-packet dots traveling along paths
 *  • 4 Docker container boxes (isometric flat style)
 *  • 2 Cloud shapes
 *  • Floating, auto-scaled via viewBox
 */
export function NetworkBackground({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1280 720"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          {/* ── Gradients ─────────────────────────────────── */}
          <radialGradient id="nb-node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="nb-conn-teal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0891B2" stopOpacity="0" />
            <stop offset="40%" stopColor="#0891B2" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0891B2" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="nb-conn-green" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0" />
            <stop offset="50%" stopColor="#059669" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="nb-conn-blue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter for packets */}
          <filter id="nb-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* ── Isometric dot grid pattern ────────────────── */}
          {/* Diamond rhombus for isometric feel */}
          <pattern
            id="nb-iso-grid"
            width="56"
            height="32"
            patternUnits="userSpaceOnUse"
            patternTransform="translate(0 0)"
          >
            {/* Isometric lines */}
            <path
              d="M0 16 L28 0 L56 16 L28 32 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.35"
              strokeOpacity="0.18"
            />
          </pattern>
        </defs>

        {/* ── ISO GRID ────────────────────────────────────── */}
        <rect
          width="100%"
          height="100%"
          fill="url(#nb-iso-grid)"
          className="text-primary"
        />

        {/* ══════════════════════════════════════════════════
            CONNECTION PATHS  (behind nodes)
        ══════════════════════════════════════════════════ */}
        <g opacity="0.55">
          {/* N1(120,180) → N3(420,120) */}
          <path id="p-1-3" d="M120,180 C220,140 320,125 420,120"
            fill="none" stroke="url(#nb-conn-teal)" strokeWidth="1.2"
            strokeDasharray="6 4"
            style={{ animation: "dash-flow 6s linear infinite" }} />

          {/* N1(120,180) → N7(200,420) */}
          <path id="p-1-7" d="M120,180 C140,260 160,350 200,420"
            fill="none" stroke="url(#nb-conn-blue)" strokeWidth="1.2"
            strokeDasharray="5 5"
            style={{ animation: "dash-flow 7s linear infinite reverse" }} />

          {/* N3(420,120) → N5(640,220) */}
          <path id="p-3-5" d="M420,120 C500,110 580,160 640,220"
            fill="none" stroke="url(#nb-conn-teal)" strokeWidth="1.2"
            strokeDasharray="6 4"
            style={{ animation: "dash-flow 5s linear infinite" }} />

          {/* N3(420,120) → N4(640,80) */}
          <path id="p-3-4" d="M420,120 C500,90 570,80 640,80"
            fill="none" stroke="url(#nb-conn-green)" strokeWidth="1"
            strokeDasharray="4 6"
            style={{ animation: "dash-flow 8s linear infinite" }} />

          {/* N4(640,80) → N6(900,120) */}
          <path id="p-4-6" d="M640,80 C740,70 820,85 900,120"
            fill="none" stroke="url(#nb-conn-teal)" strokeWidth="1.2"
            strokeDasharray="6 4"
            style={{ animation: "dash-flow 6s linear infinite reverse" }} />

          {/* N5(640,220) → N8(900,280) */}
          <path id="p-5-8" d="M640,220 C740,230 820,260 900,280"
            fill="none" stroke="url(#nb-conn-blue)" strokeWidth="1.2"
            strokeDasharray="5 5"
            style={{ animation: "dash-flow 5.5s linear infinite" }} />

          {/* N6(900,120) → N9(1100,200) */}
          <path id="p-6-9" d="M900,120 C970,125 1040,160 1100,200"
            fill="none" stroke="url(#nb-conn-teal)" strokeWidth="1.2"
            strokeDasharray="6 4"
            style={{ animation: "dash-flow 7s linear infinite" }} />

          {/* N7(200,420) → N8(500,460) */}
          <path id="p-7-8-lo" d="M200,420 C300,430 400,450 500,460"
            fill="none" stroke="url(#nb-conn-green)" strokeWidth="1"
            strokeDasharray="4 6"
            style={{ animation: "dash-flow 9s linear infinite reverse" }} />

          {/* N8(500,460) → N10(780,520) */}
          <path id="p-8-10" d="M500,460 C600,475 700,505 780,520"
            fill="none" stroke="url(#nb-conn-blue)" strokeWidth="1.2"
            strokeDasharray="5 5"
            style={{ animation: "dash-flow 6.5s linear infinite" }} />

          {/* N8(900,280) → N11(1100,380) */}
          <path id="p-8-11" d="M900,280 C970,310 1040,350 1100,380"
            fill="none" stroke="url(#nb-conn-green)" strokeWidth="1"
            strokeDasharray="4 6"
            style={{ animation: "dash-flow 8s linear infinite reverse" }} />

          {/* N5(640,220) → N5b(640,480) vertical link */}
          <path id="p-5-mid" d="M640,220 C650,320 645,400 640,480"
            fill="none" stroke="url(#nb-conn-teal)" strokeWidth="0.9"
            strokeDasharray="3 7"
            style={{ animation: "dash-flow 10s linear infinite" }} />
        </g>

        {/* ══════════════════════════════════════════════════
            DATA PACKET DOTS  (traveling along paths)
        ══════════════════════════════════════════════════ */}
        <g filter="url(#nb-glow)">
          {/* Teal packets */}
          <circle r="3.5" fill="#0891B2" opacity="0.9">
            <animateMotion dur="5s" repeatCount="indefinite"
              path="M120,180 C220,140 320,125 420,120" />
          </circle>
          <circle r="3" fill="#0891B2" opacity="0.7">
            <animateMotion dur="5s" begin="2.5s" repeatCount="indefinite"
              path="M120,180 C220,140 320,125 420,120" />
          </circle>

          <circle r="3.5" fill="#06B6D4" opacity="0.85">
            <animateMotion dur="6s" repeatCount="indefinite"
              path="M420,120 C500,110 580,160 640,220" />
          </circle>

          <circle r="3" fill="#0891B2" opacity="0.8">
            <animateMotion dur="7s" begin="1s" repeatCount="indefinite"
              path="M640,80 C740,70 820,85 900,120" />
          </circle>
          <circle r="4" fill="#22D3EE" opacity="0.6">
            <animateMotion dur="7s" begin="3.5s" repeatCount="indefinite"
              path="M640,80 C740,70 820,85 900,120" />
          </circle>

          {/* Green packets */}
          <circle r="3" fill="#059669" opacity="0.85">
            <animateMotion dur="8s" begin="0.5s" repeatCount="indefinite"
              path="M420,120 C500,90 570,80 640,80" />
          </circle>
          <circle r="3.5" fill="#10B981" opacity="0.7">
            <animateMotion dur="9s" repeatCount="indefinite"
              path="M200,420 C300,430 400,450 500,460" />
          </circle>

          {/* Blue packets */}
          <circle r="3" fill="#2563EB" opacity="0.8">
            <animateMotion dur="5.5s" begin="1.5s" repeatCount="indefinite"
              path="M640,220 C740,230 820,260 900,280" />
          </circle>
          <circle r="4" fill="#3B82F6" opacity="0.6">
            <animateMotion dur="6.5s" begin="0s" repeatCount="indefinite"
              path="M500,460 C600,475 700,505 780,520" />
          </circle>

          <circle r="3" fill="#0891B2" opacity="0.85">
            <animateMotion dur="7s" begin="2s" repeatCount="indefinite"
              path="M900,120 C970,125 1040,160 1100,200" />
          </circle>

          <circle r="3.5" fill="#059669" opacity="0.75">
            <animateMotion dur="8s" begin="4s" repeatCount="indefinite"
              path="M900,280 C970,310 1040,350 1100,380" />
          </circle>
        </g>

        {/* ══════════════════════════════════════════════════
            NETWORK NODES  (servers / routers / endpoints)
        ══════════════════════════════════════════════════ */}
        {/* Helper: each node = outer ring + inner dot + pulse */}

        {/* N1 — Gateway / Entry point */}
        <g style={{ animation: "float-up 6s ease-in-out infinite" }}>
          <circle cx="120" cy="180" r="28" fill="#0891B2" fillOpacity="0.05"
            stroke="#0891B2" strokeWidth="0.5" strokeOpacity="0.15" />
          <circle cx="120" cy="180" r="16" fill="none"
            stroke="#0891B2" strokeWidth="1.5" strokeOpacity="0.5" />
          <circle cx="120" cy="180" r="7" fill="#0891B2" fillOpacity="0.8" />
          {/* Pulse ring */}
          <circle cx="120" cy="180" r="16" fill="none"
            stroke="#0891B2" strokeWidth="1.5" strokeOpacity="0">
            <animate attributeName="r" from="16" to="34" dur="2.5s"
              repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" from="0.5" to="0" dur="2.5s"
              repeatCount="indefinite" />
          </circle>
        </g>

        {/* N3 — Core Router */}
        <g style={{ animation: "float-down 7s ease-in-out infinite" }}>
          <circle cx="420" cy="120" r="20" fill="#0891B2" fillOpacity="0.08"
            stroke="#0891B2" strokeWidth="0.5" strokeOpacity="0.2" />
          <circle cx="420" cy="120" r="13" fill="none"
            stroke="#0891B2" strokeWidth="1.5" strokeOpacity="0.55" />
          <circle cx="420" cy="120" r="6" fill="#0891B2" fillOpacity="0.85" />
          <circle cx="420" cy="120" r="13" fill="none"
            stroke="#0891B2" strokeWidth="1" strokeOpacity="0">
            <animate attributeName="r" from="13" to="28" dur="3s"
              repeatCount="indefinite" begin="0.5s" />
            <animate attributeName="stroke-opacity" from="0.5" to="0" dur="3s"
              repeatCount="indefinite" begin="0.5s" />
          </circle>
        </g>

        {/* N4 — Load Balancer */}
        <g style={{ animation: "float-up 5s ease-in-out infinite", animationDelay: "1s" }}>
          <circle cx="640" cy="80" r="16" fill="none"
            stroke="#2563EB" strokeWidth="1.5" strokeOpacity="0.5" />
          <circle cx="640" cy="80" r="7" fill="#2563EB" fillOpacity="0.8" />
          <circle cx="640" cy="80" r="16" fill="none"
            stroke="#2563EB" strokeWidth="1" strokeOpacity="0">
            <animate attributeName="r" from="16" to="30" dur="2.8s"
              repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" from="0.5" to="0" dur="2.8s"
              repeatCount="indefinite" />
          </circle>
        </g>

        {/* N5 — API Server (center hub) */}
        <g style={{ animation: "float-down 8s ease-in-out infinite" }}>
          <circle cx="640" cy="220" r="24" fill="#0891B2" fillOpacity="0.06"
            stroke="#0891B2" strokeWidth="0.5" strokeOpacity="0.15" />
          <circle cx="640" cy="220" r="18" fill="none"
            stroke="#0891B2" strokeWidth="2" strokeOpacity="0.6" />
          <circle cx="640" cy="220" r="9" fill="#0891B2" fillOpacity="0.9" />
          {/* Rotating orbit */}
          <circle cx="640" cy="220" r="18" fill="none"
            stroke="#0891B2" strokeWidth="1.5" strokeOpacity="0">
            <animate attributeName="r" from="18" to="36" dur="2s"
              repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" from="0.6" to="0" dur="2s"
              repeatCount="indefinite" />
          </circle>
        </g>

        {/* N6 — CDN Node */}
        <g style={{ animation: "float-up 9s ease-in-out infinite", animationDelay: "2s" }}>
          <circle cx="900" cy="120" r="14" fill="none"
            stroke="#059669" strokeWidth="1.5" strokeOpacity="0.55" />
          <circle cx="900" cy="120" r="6" fill="#059669" fillOpacity="0.8" />
          <circle cx="900" cy="120" r="14" fill="none"
            stroke="#059669" strokeWidth="1" strokeOpacity="0">
            <animate attributeName="r" from="14" to="28" dur="3.5s"
              repeatCount="indefinite" begin="1s" />
            <animate attributeName="stroke-opacity" from="0.5" to="0" dur="3.5s"
              repeatCount="indefinite" begin="1s" />
          </circle>
        </g>

        {/* N7 — Database */}
        <g style={{ animation: "float-down 6.5s ease-in-out infinite", animationDelay: "0.5s" }}>
          <circle cx="200" cy="420" r="18" fill="none"
            stroke="#2563EB" strokeWidth="1.5" strokeOpacity="0.5" />
          <circle cx="200" cy="420" r="8" fill="#2563EB" fillOpacity="0.8" />
          <circle cx="200" cy="420" r="18" fill="none"
            stroke="#2563EB" strokeWidth="1" strokeOpacity="0">
            <animate attributeName="r" from="18" to="34" dur="4s"
              repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" from="0.5" to="0" dur="4s"
              repeatCount="indefinite" />
          </circle>
        </g>

        {/* N8 — Cache */}
        <g style={{ animation: "float-up 7.5s ease-in-out infinite", animationDelay: "1.5s" }}>
          <circle cx="500" cy="460" r="15" fill="none"
            stroke="#059669" strokeWidth="1.5" strokeOpacity="0.5" />
          <circle cx="500" cy="460" r="6" fill="#059669" fillOpacity="0.8" />
          <circle cx="500" cy="460" r="15" fill="none"
            stroke="#059669" strokeWidth="1" strokeOpacity="0">
            <animate attributeName="r" from="15" to="28" dur="3s"
              repeatCount="indefinite" begin="0.8s" />
            <animate attributeName="stroke-opacity" from="0.5" to="0" dur="3s"
              repeatCount="indefinite" begin="0.8s" />
          </circle>
        </g>

        {/* N8b — Message Queue */}
        <g style={{ animation: "float-down 5.5s ease-in-out infinite", animationDelay: "0.3s" }}>
          <circle cx="900" cy="280" r="16" fill="none"
            stroke="#2563EB" strokeWidth="1.5" strokeOpacity="0.5" />
          <circle cx="900" cy="280" r="7" fill="#2563EB" fillOpacity="0.8" />
          <circle cx="900" cy="280" r="16" fill="none"
            stroke="#2563EB" strokeWidth="1" strokeOpacity="0">
            <animate attributeName="r" from="16" to="30" dur="3.2s"
              repeatCount="indefinite" begin="0.3s" />
            <animate attributeName="stroke-opacity" from="0.5" to="0" dur="3.2s"
              repeatCount="indefinite" begin="0.3s" />
          </circle>
        </g>

        {/* N9 — Edge Endpoint */}
        <g style={{ animation: "float-up 8s ease-in-out infinite", animationDelay: "2.5s" }}>
          <circle cx="1100" cy="200" r="14" fill="none"
            stroke="#0891B2" strokeWidth="1.5" strokeOpacity="0.5" />
          <circle cx="1100" cy="200" r="6" fill="#0891B2" fillOpacity="0.8" />
          <circle cx="1100" cy="200" r="14" fill="none"
            stroke="#0891B2" strokeWidth="1" strokeOpacity="0">
            <animate attributeName="r" from="14" to="26" dur="3.5s"
              repeatCount="indefinite" begin="1.5s" />
            <animate attributeName="stroke-opacity" from="0.5" to="0" dur="3.5s"
              repeatCount="indefinite" begin="1.5s" />
          </circle>
        </g>

        {/* N10 — Storage */}
        <g style={{ animation: "float-down 7s ease-in-out infinite", animationDelay: "1.8s" }}>
          <circle cx="780" cy="520" r="15" fill="none"
            stroke="#059669" strokeWidth="1.5" strokeOpacity="0.5" />
          <circle cx="780" cy="520" r="6" fill="#059669" fillOpacity="0.8" />
          <circle cx="780" cy="520" r="15" fill="none"
            stroke="#059669" strokeWidth="1" strokeOpacity="0">
            <animate attributeName="r" from="15" to="28" dur="4.5s"
              repeatCount="indefinite" begin="2s" />
            <animate attributeName="stroke-opacity" from="0.5" to="0" dur="4.5s"
              repeatCount="indefinite" begin="2s" />
          </circle>
        </g>

        {/* N11 — Monitoring */}
        <g style={{ animation: "float-up 6s ease-in-out infinite", animationDelay: "3s" }}>
          <circle cx="1100" cy="380" r="13" fill="none"
            stroke="#059669" strokeWidth="1.5" strokeOpacity="0.5" />
          <circle cx="1100" cy="380" r="5.5" fill="#059669" fillOpacity="0.8" />
          <circle cx="1100" cy="380" r="13" fill="none"
            stroke="#059669" strokeWidth="1" strokeOpacity="0">
            <animate attributeName="r" from="13" to="24" dur="3.8s"
              repeatCount="indefinite" begin="2.5s" />
            <animate attributeName="stroke-opacity" from="0.5" to="0" dur="3.8s"
              repeatCount="indefinite" begin="2.5s" />
          </circle>
        </g>

        {/* ══════════════════════════════════════════════════
            DOCKER CONTAINERS  (isometric flat style)
            Each container = top face + right face + front face
        ══════════════════════════════════════════════════ */}
        {/* Container 1 — near N3, "web" service */}
        <g style={{ animation: "float-up 8s ease-in-out infinite", animationDelay: "0.8s" }}>
          {/* top face */}
          <polygon
            points="330,300 374,281 418,300 374,319"
            fill="#0891B2" fillOpacity="0.12"
            stroke="#0891B2" strokeWidth="0.8" strokeOpacity="0.4"
          />
          {/* right face */}
          <polygon
            points="374,319 418,300 418,336 374,355"
            fill="#0891B2" fillOpacity="0.07"
            stroke="#0891B2" strokeWidth="0.8" strokeOpacity="0.3"
          />
          {/* left face */}
          <polygon
            points="330,300 374,319 374,355 330,336"
            fill="#0891B2" fillOpacity="0.09"
            stroke="#0891B2" strokeWidth="0.8" strokeOpacity="0.35"
          />
        </g>

        {/* Container 2 — lower-left, "db" service */}
        <g style={{ animation: "float-down 9s ease-in-out infinite", animationDelay: "1.2s" }}>
          <polygon
            points="290,500 330,483 370,500 330,517"
            fill="#2563EB" fillOpacity="0.12"
            stroke="#2563EB" strokeWidth="0.8" strokeOpacity="0.35"
          />
          <polygon
            points="330,517 370,500 370,532 330,549"
            fill="#2563EB" fillOpacity="0.07"
            stroke="#2563EB" strokeWidth="0.8" strokeOpacity="0.25"
          />
          <polygon
            points="290,500 330,517 330,549 290,532"
            fill="#2563EB" fillOpacity="0.09"
            stroke="#2563EB" strokeWidth="0.8" strokeOpacity="0.3"
          />
        </g>

        {/* Container 3 — right-side, "api" service */}
        <g style={{ animation: "float-up 7s ease-in-out infinite", animationDelay: "2s" }}>
          <polygon
            points="960,340 1004,321 1048,340 1004,359"
            fill="#059669" fillOpacity="0.12"
            stroke="#059669" strokeWidth="0.8" strokeOpacity="0.4"
          />
          <polygon
            points="1004,359 1048,340 1048,375 1004,394"
            fill="#059669" fillOpacity="0.07"
            stroke="#059669" strokeWidth="0.8" strokeOpacity="0.25"
          />
          <polygon
            points="960,340 1004,359 1004,394 960,375"
            fill="#059669" fillOpacity="0.09"
            stroke="#059669" strokeWidth="0.8" strokeOpacity="0.3"
          />
        </g>

        {/* Container 4 — top-right, "cache" service */}
        <g style={{ animation: "float-down 6.5s ease-in-out infinite", animationDelay: "0.5s" }}>
          <polygon
            points="780,140 816,124 852,140 816,156"
            fill="#0891B2" fillOpacity="0.10"
            stroke="#0891B2" strokeWidth="0.8" strokeOpacity="0.35"
          />
          <polygon
            points="816,156 852,140 852,170 816,186"
            fill="#0891B2" fillOpacity="0.06"
            stroke="#0891B2" strokeWidth="0.8" strokeOpacity="0.25"
          />
          <polygon
            points="780,140 816,156 816,186 780,170"
            fill="#0891B2" fillOpacity="0.08"
            stroke="#0891B2" strokeWidth="0.8" strokeOpacity="0.28"
          />
        </g>

        {/* ══════════════════════════════════════════════════
            CLOUD SHAPES  (flat, stylized)
        ══════════════════════════════════════════════════ */}
        {/* Cloud 1 — top-right */}
        <g style={{ animation: "float-up 12s ease-in-out infinite", animationDelay: "1s" }}
          opacity="0.35">
          <path
            d="M1060,50 
               C1058,38 1048,30 1036,32 
               C1032,20 1020,14 1006,18
               C1000,10 986,8 976,14
               C966,10 952,14 950,26
               C940,26 932,34 934,44
               C934,54 942,60 952,60
               L1052,60
               C1060,60 1068,54 1068,46
               C1068,38 1064,50 1060,50 Z"
            fill="#0891B2" fillOpacity="0.12"
            stroke="#0891B2" strokeWidth="0.8"
          />
        </g>

        {/* Cloud 2 — bottom-left */}
        <g style={{ animation: "float-down 10s ease-in-out infinite", animationDelay: "3s" }}
          opacity="0.3">
          <path
            d="M100,640
               C98,628 90,620 80,622
               C76,612 66,606 54,610
               C50,602 38,600 30,606
               C22,602 10,606 8,618
               C0,618 -6,626 -4,634
               C-4,644 4,650 14,650
               L92,650
               C100,650 106,644 106,636
               C106,628 102,640 100,640 Z"
            fill="#059669" fillOpacity="0.12"
            stroke="#059669" strokeWidth="0.8"
          />
        </g>

        {/* ══════════════════════════════════════════════════
            FLOATING STATUS LABELS  (k8s / docker style)
        ══════════════════════════════════════════════════ */}
        <g style={{ animation: "float-up 11s ease-in-out infinite", animationDelay: "0.6s" }}
          opacity="0.4">
          <rect x="60" y="340" width="90" height="22" rx="4"
            fill="#0891B2" fillOpacity="0.08"
            stroke="#0891B2" strokeWidth="0.7" strokeOpacity="0.4" />
          <text x="105" y="355" textAnchor="middle" fontSize="8"
            fill="#0891B2" fontFamily="monospace">
            STATUS: RUNNING
          </text>
        </g>

        <g style={{ animation: "float-down 9.5s ease-in-out infinite", animationDelay: "2.2s" }}
          opacity="0.4">
          <rect x="940" y="460" width="100" height="22" rx="4"
            fill="#059669" fillOpacity="0.08"
            stroke="#059669" strokeWidth="0.7" strokeOpacity="0.4" />
          <text x="990" y="475" textAnchor="middle" fontSize="8"
            fill="#059669" fontFamily="monospace">
            REPLICAS: 3/3
          </text>
        </g>

        <g style={{ animation: "float-up 7s ease-in-out infinite", animationDelay: "4s" }}
          opacity="0.35">
          <rect x="560" y="560" width="88" height="22" rx="4"
            fill="#2563EB" fillOpacity="0.08"
            stroke="#2563EB" strokeWidth="0.7" strokeOpacity="0.35" />
          <text x="604" y="575" textAnchor="middle" fontSize="8"
            fill="#2563EB" fontFamily="monospace">
            HEALTHY ✓
          </text>
        </g>
      </svg>
    </div>
  );
}

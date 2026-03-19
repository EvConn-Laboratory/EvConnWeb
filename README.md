# EvConn Laboratory Platform

EvConn Laboratory is an integrated digital ecosystem designed for modern laboratory management, academic learning (LMS), and public engagement. It serves as the official digital presence for the EvConn Laboratory, bridging the gap between public information and internal academic operations.

## 🚀 Vision

The platform is built to:

1.  **Public CMS**: Showcase laboratory profile, programs, news, gallery, and the "Hall of Fame" (generational history).
2.  **Academic LMS**: Provide a robust Learning Management System for internal _praktikum_ activities.
3.  **Operational Workflow**: Streamline assistant tasks, including group management, grading, and feedback analytics.
4.  **Study Group**: Offer public open-learning courses to a wider community of learners.
5.  **History & Culture**: Preserve the organizational legacy through a detailed generational archive.

## 🛠 Technology Stack

### Core

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: JWT-based session management with secure password hashing.

### UI & UX

- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **3D Graphics**: [Three.js](https://threejs.org/) & [Spline](https://spline.design/) (for high-fidelity visuals)
- **Aesthetics**: Modern "Command Center" design with glassmorphism and premium dark modes.

## 🏗 System Architecture

The project is divided into four main domains:

1.  **Public CMS**: Landing page, laboratory profile, news updates, gallery, and programs.
2.  **Academic LMS**: Subject management, modules, assignments (MCQ & Essay/PDF), and grading systems.
3.  **Operational & Organizational**: Student group management, assistant role assignments, and feedback analytics.
4.  **Study Group (Public LMS)**: Open courses accessible to registered guest users and the general public.

### Role System

- **Super Admin**: Full platform control, user management, and system-wide analytics.
- **Assistant**: Manages assigned course offerings, modules, groups, and grading.
- **Student (Internal)**: Teknik Komputer students enrolled via CSV; access to _praktikum_ and learning materials.
- **Guest Student**: Public learners registered for Study Group courses.

## 📦 Project Structure

```text
evconn/
├── app/                  # Next.js App Router (Pages, Layouts, API)
├── components/           # Reusable UI components
│   ├── lms/              # LMS-specific components
│   ├── navigation/       # Sidebar, Header, etc.
│   └── ui/               # Base shadcn/ui components
├── lib/                  # Core logic and shared utilities
│   ├── actions/          # Server Actions (CRUD, Logic)
│   ├── auth/             # Session & Auth logic
│   ├── db/               # Database schema & Drizzle config
│   └── utils/            # Shared helper functions
├── public/               # Static assets (Images, Icons)
└── artifacts/            # System documentation and summaries
```

## 🛠 Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL 15+ (Local or Docker)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-org/evconn.git
    cd evconn
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    Create a `.env.local` file based on the example provided:
    ```env
    DATABASE_URL="postgres://user:password@localhost:5432/evconn"
    JWT_SECRET="your-secret-key"
    ```
4.  Push database schema:
    ```bash
    npx drizzle-kit push
    ```
5.  Run the development server:
    ```bash
    npm run dev
    ```

### Production Build

```bash
npm run build
npm start
```

## 📋 Features at a Glance

- **Multi-tenant LMS**: Support for multiple course offerings per semester.
- **Assigned Grading**: Assistants only see and grade students in their assigned groups.
- **MCQ Auto-grading**: Instant results for multiple-choice assignments.
- **Flexible Content**: Support for PDF materials, video embeds, and external links.
- **Three-way Feedback**: Mandatory module feedback for assistants, sessions, and laboratory facilities.
- **CSV Enrollment**: Bulk-import students and map them to courses automatically.
- **Hall of Fame**: Visual history of laboratory generations and assistant roles.

## 📄 License

This project is proprietary software belonging to **EvConn Laboratory**. All rights reserved.

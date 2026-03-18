# EvConn Laboratory — Project Memory

## Project Overview
Full-stack LMS + public website for EvConn Laboratory (praktikum + study groups).
- Framework: Next.js App Router (TypeScript), Tailwind CSS, Framer Motion
- Database: PostgreSQL via Drizzle ORM (docker-compose + local postgres)
- Auth: jose (JWT HS256, 7-day), bcryptjs, httpOnly cookie `evconn_session`
- Animation: Framer Motion 12, Three.js (installed, for landing/auth bg)

## Key Paths
- DB schema: `lib/db/schema/` (all tables defined including Phase 2)
- Server actions: `lib/actions/` (all Phase 1 + Phase 2 actions complete)
- Auth: `lib/auth/` (jwt.ts, session.ts, password.ts, actions.ts)
- Animations: `lib/animations/variants.ts` (fadeUp, stagger, etc.)
- Components: `components/ui/` (button, badge, input, label), `components/navigation/` (Navbar, AdminSidebar, LmsSidebar)

## Route Structure
- `app/(public)/` — Public website (Navbar + Footer layout)
- `app/(auth)/` — Auth pages (login, register, change-password)
- `app/(admin)/` — Admin panel (super_admin only guard)
- `app/(lms)/` — LMS (any authenticated user)
- `app/join/[token]/` — Study group invite (no route group)

## Phase 1 Status
**COMPLETE (backend):** All DB schema + server actions implemented
**COMPLETE (frontend):** Landing page, login/register, dashboards, nav/sidebar
**MISSING (frontend):** Most LMS pages, admin management pages, public hall-of-fame, news detail

## Phase 2 Status
**COMPLETE (backend):** All schema + actions for attendance, certificates, discussion forum, group submissions, study group invites
**IN PROGRESS (frontend):** Being built in current session

## Tailwind Class Conventions
Uses shadcn/ui semantics: `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `text-primary`, `bg-muted`, `bg-background`, `rounded-2xl`, `rounded-xl`
**DO NOT** use raw CSS variables directly in className — they're mapped via Tailwind config.

## Design System
- Dark-only theme (dark futuristic flat + hexagonal network)
- Primary: teal/cyan (`text-primary` = teal)
- Success: green, Warning: amber, Error: red
- Hex avatar clip-path: `polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`

## Key Patterns
```typescript
// Session in server components:
import { getSession } from "@/lib/auth/session"
const session = await getSession()
if (!session) redirect("/login")

// DB queries in pages:
import { db } from "@/lib/db"
import { users, ... } from "@/lib/db/schema"

// Form actions (client):
const [state, dispatch] = useActionState(someServerAction, null)
```

## Phase 1 + Phase 2 Implementation Status (as of 2026-03-17)
**Backend: 100% complete.** Frontend: 45+ pages implemented. All known gaps resolved.

### All routes implemented
**Public:** `/`, `/programs`, `/news`, `/news/[slug]`, `/gallery`, `/hall-of-fame`, `/about`, `/contact`, `/verify/[number]`, `/join/[token]`
**Auth:** `/login`, `/register`, `/change-password`
**LMS:** `/lms/dashboard`, `/lms/courses`, `/lms/courses/[id]`, `/lms/modules/[id]`, `/lms/modules/[id]/discussion`, `/lms/modules/[id]/discussion/[threadId]`, `/lms/assignments`, `/lms/grades`, `/lms/feedback`, `/lms/attendance`, `/lms/certificates`, `/lms/offerings`, `/lms/offerings/[id]/modules/[moduleId]/attendance`, `/lms/submissions`, `/lms/groups`, `/lms/profile`, `/lms/notifications`
**Admin:** `/admin/dashboard`, `/admin/users`, `/admin/users/[id]/edit`, `/admin/courses`, `/admin/courses/offerings/[id]`, `/admin/import`, `/admin/hall-of-fame`, `/admin/hall-of-fame/generations`, `/admin/hall-of-fame/assistants`, `/admin/hall-of-fame/roles`, `/admin/cms`, `/admin/cms/programs`, `/admin/cms/news`, `/admin/cms/gallery`, `/admin/cms/pages`, `/admin/certificates`

### Actions in lib/actions/users.ts
`getUsersAction`, `getUserByIdAction`, `softDeleteUserAction`, `updateUserRoleAction`, `updateUserAction`, `adminResetPasswordAction`

### Data wired to real DB (no more mocks)
- StudentDashboard: enrollment counts, module progress, assignment stats, recent modules
- AssistantDashboard: offerings, student counts, pending grading count, grading queue (top 5 ungraded essays), feedback stats (avg per module by type), avgFeedbackRating
- Public landing page: stats fetched from DB (enrollments, active offerings, generations, active assistants)
- Landing page split: `app/(public)/page.tsx` = server component, `LandingPageClient.tsx` = client component with all animations

See `details.md` for full file listing.

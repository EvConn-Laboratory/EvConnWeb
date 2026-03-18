# Laboratory Digital Platform

## Product Requirements Document

**Version:** 1.2
**Status:** Ready for ERD & API Design
**Scope:** Phase 1 MVP

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [System Domains](#2-system-domains)
3. [Role System Architecture](#3-role-system-architecture)
4. [Enrollment & Authentication](#4-enrollment--authentication)
5. [Course Architecture](#5-course-architecture)
6. [Module System](#6-module-system)
7. [Module Content System](#7-module-content-system)
8. [Assignment System](#8-assignment-system)
9. [Submission & Grading Model](#9-submission--grading-model)
10. [File Storage Architecture](#10-file-storage-architecture)
11. [Group Management](#11-group-management)
12. [Feedback System](#12-feedback-system)
13. [Study Group Domain](#13-study-group-domain)
14. [Laboratory Personnel & Hall of Fame](#14-laboratory-personnel--hall-of-fame)
15. [Public CMS](#15-public-cms)
16. [Dashboards](#16-dashboards)
17. [Audit Log](#17-audit-log)
18. [Non-Functional Requirements](#18-non-functional-requirements)
19. [End-to-End Student Journey](#19-end-to-end-student-journey)
20. [Phase 1 MVP Scope](#20-phase-1-mvp-scope)
21. [Phase 2 Expansion](#21-phase-2-expansion)

---

## 1. Product Vision

Develop an integrated **digital laboratory platform** that:

1. Serves as the **public-facing website** of the laboratory
2. Provides an **LMS for internal praktikum activities**
3. Supports **assistant operational workflow**
4. Enables **public Study Group courses** open to all learners
5. Preserves **organizational and generational history** through Hall of Fame
6. Automates enrollment, submissions, grading, and feedback processes
7. Use **Nuxt 4.4.2**, **Tailwind CSS 4.2**, **PostgreSQL through Docker**, **Three JS**, **Spline 3D**, **Framer Motion**, **shadcn/ui**

---

## 2. System Domains

| Domain   | Name                         | Description                                                      |
| -------- | ---------------------------- | ---------------------------------------------------------------- |
| Domain 1 | Public CMS                   | Landing page, lab profile, programs, news, gallery, Hall of Fame |
| Domain 2 | Academic LMS                 | Praktikum courses, modules, assignments, submissions, grading    |
| Domain 3 | Operational & Organizational | Groups, assistant management, feedback analytics                 |
| Domain 4 | Study Group (Public LMS)     | Open learning courses accessible to all registered users         |

---

## 3. Role System Architecture

Two role systems exist and **must remain independent**.

---

### 3.1 System Roles (Authorization Roles)

These roles control **permissions, route access, and data visibility**.

#### Super Admin

Full access to all domains.

Capabilities:

- Manage all CMS content (landing page, programs, news, gallery, Hall of Fame)
- Manage users and system roles
- Create and manage courses and course offerings
- Import enrollment via CSV
- Manage assistant accounts and organizational roles
- View system-wide analytics
- Access all grading and feedback data

#### Assistant

Responsible for managing assigned praktikum offerings.

Capabilities:

- Manage assigned Course Offerings
- Create, edit, and publish modules and assignments
- Manage student groups (create, edit, delete, move students)
- View and download student submissions
- Grade essay/PDF assignments and publish grades
- View feedback analytics for their sessions

#### Student (Internal)

Teknik Komputer students enrolled via CSV import.

Capabilities:

- Access enrolled Praktikum Course Offerings
- View learning materials (slides, PDFs)
- Submit Tugas Rumah and Tugas Praktikum
- Submit 3 mandatory feedback types per module
- View published grades and comments
- Self-enroll in Study Group courses

#### Guest Student (External / Public Learner)

Self-registered users from outside the department or general public.

Capabilities:

- Self-register with name, email, and password
- Access Study Group courses only
- Submit assignments within Study Group courses
- Participate in public learning activities

Restrictions:

- No access to Praktikum offerings unless explicitly granted by Admin

> **Note:** System Roles affect dashboard access, route authorization, and application-level RBAC enforcement.

---

### 3.2 Organizational Roles (Informational Only)

Used only for **display and archival purposes**. These roles have **no effect on system permissions or LMS access**.

Default roles (configurable by Admin):

| Role Name                  | Description                             |
| -------------------------- | --------------------------------------- |
| Assistant Coordinator      | Generation leader                       |
| Secretary & Treasurer      | Administrative and financial management |
| Administrator              | System and operations management        |
| Logistic                   | Equipment and resource management       |
| Practicum Coordinator      | Leads praktikum planning                |
| Practicum Member           | Assists in praktikum execution          |
| Research Group Coordinator | Leads research activities               |
| Research Group Member      | Participates in research                |
| Study Group Coordinator    | Leads study group programs              |
| Study Group Member         | Participates in study group activities  |

Admin can create **additional custom roles** as needed.

Organizational roles are displayed in:

- Hall of Fame page
- Organizational structure page
- Assistant profile pages

---

## 4. Enrollment & Authentication

---

### 4.1 Internal Enrollment — CSV Import

CSV file is exported from the external registration platform (e.g., SIAM) and imported by Admin.

**CSV Fields:**

| Field              | Description                                        |
| ------------------ | -------------------------------------------------- |
| `nama`             | Student full name                                  |
| `nim`              | Student ID (unique per enrollment)                 |
| `jurusan`          | Department / major                                 |
| `kelas`            | Class section                                      |
| `semester`         | Active semester (e.g., Ganjil 2024/2025)           |
| `hari`             | Praktikum day (e.g., Senin)                        |
| `shift`            | Time shift (e.g., Shift 1)                         |
| `kelompok`         | Initial group reference (stored, not auto-applied) |
| `nama_mata_kuliah` | Course name — mapped to Course in system           |

**Import Behavior (ordered):**

1. Validate CSV structure and required column presence
2. For each row: find or create student user account (NIM as username, NIM as initial password)
3. Validate for duplicate NIM per Course Offering — reject duplicates with error log
4. Map `nama_mata_kuliah` to existing Course record
5. Create Course Offering if matching offering does not exist
6. Insert enrollment record linking student to Course Offering
7. Store raw CSV fields (`jurusan`, `kelas`, `kelompok`) as audit reference only — not used for group logic
8. Generate import summary report: total rows, success count, skipped rows, error details per row

**Import Log stores:** file name, importer, timestamp, row counts, per-row errors (as JSON).

---

### 4.2 Manual Enrollment

Admin or Assistant can:

- Add a single student to a Course Offering
- Bulk-add a list of students
- Immediately assign a group upon enrollment
- Create a new student account if NIM does not exist

---

### 4.3 Authentication

**Internal Students:**

```
username : NIM
password : NIM (initial — must change on first login)
```

**Assistants & Admins:**

```
login via email + password
```

**Public / Guest Users:**

```
self-registration: name, email, password
```

**Technical requirements:**

- JWT-based session management
- Password hashing with bcrypt or equivalent
- `must_change_password` flag enforced at login for CSV-imported students
- Soft delete on user accounts (`deleted_at`)

---

## 5. Course Architecture

---

### 5.1 Course (Template)

A reusable subject definition. Does not carry semester-specific data.

| Field            | Description                                      |
| ---------------- | ------------------------------------------------ |
| `id`             | Unique identifier                                |
| `name`           | Course name (e.g., Jaringan Komunikasi dan Data) |
| `code`           | Course code (e.g., TK-401)                       |
| `description`    | Course overview                                  |
| `thumbnail_path` | Cover image                                      |
| `type`           | `praktikum` / `study_group`                      |
| `is_active`      | Soft activation flag                             |

---

### 5.2 Course Offering (Instance)

A specific semester/session instance of a Course. All enrollments, groups, and modules belong to an offering.

| Field            | Description                                  |
| ---------------- | -------------------------------------------- |
| `id`             | Offering identifier                          |
| `course_id`      | Reference to parent Course                   |
| `semester`       | e.g., Ganjil 2024/2025                       |
| `academic_year`  | e.g., 2024/2025                              |
| `hari`           | Day of session (NULL for Study Group)        |
| `shift`          | Shift identifier (NULL for Study Group)      |
| `enrollment_key` | Optional key for Study Group self-enrollment |
| `status`         | `draft` / `active` / `closed` / `archived`   |
| `visibility`     | `internal` / `public`                        |

**Unique constraint:** `(course_id, semester, hari, shift)` — prevents duplicate offerings.

---

### 5.3 Assistant Assignment to Offerings

Multiple assistants can be assigned to one offering. Each assistant can be further mapped to specific groups.

**offering_assistants table:**

| Field          | Description                   |
| -------------- | ----------------------------- |
| `offering_id`  | Reference to Course Offering  |
| `assistant_id` | Reference to user (assistant) |
| `is_lead`      | Lead assistant flag           |

**group_assistants table:**

| Field          | Description            |
| -------------- | ---------------------- |
| `group_id`     | Reference to group     |
| `assistant_id` | Reference to assistant |

Example mapping:

```
Assistant A → Group 1, Group 2
Assistant B → Group 3, Group 4
```

This ensures assistants access only their assigned students for grading and group management.

---

## 6. Module System

Modules represent **weekly or session-based learning units** within a Course Offering.

### 6.1 Module Fields

| Field             | Description                                       |
| ----------------- | ------------------------------------------------- |
| `id`              | Module identifier                                 |
| `offering_id`     | Parent Course Offering                            |
| `title`           | Module title (e.g., Modul 1 — Pengantar Jaringan) |
| `description`     | Overview text                                     |
| `order_index`     | Display order within offering                     |
| `open_datetime`   | When module becomes accessible to students        |
| `close_datetime`  | Deadline — submissions blocked after this         |
| `status`          | `draft` / `scheduled` / `open` / `closed`         |
| `manual_override` | Force-open or force-close regardless of schedule  |

**Constraint:** `close_datetime` must be after `open_datetime` if both are set.

---

### 6.2 Module Completion Rule

A module is marked **complete** for a student when ALL of the following are true:

```
ALL required assignments submitted (regardless of grading status)
  AND
Feedback for Assistant submitted
  AND
Feedback for Session submitted
  AND
Feedback for Laboratory submitted
```

> Completion status is cached in `module_completions` table, updated by application logic on each submission or feedback event.

---

## 7. Module Content System

Content items are **ordered learning resources** within a module. Each item has a type that determines its payload structure.

### 7.1 Content Item Fields

| Field          | Description                                       |
| -------------- | ------------------------------------------------- |
| `id`           | Content item identifier                           |
| `module_id`    | Parent module                                     |
| `type`         | Content type (see below)                          |
| `title`        | Display title                                     |
| `content_data` | Flexible JSON payload — structure varies per type |
| `order_index`  | Display order within module                       |
| `is_published` | Whether visible to students                       |

### 7.2 Supported Content Types

| Type                   | `content_data` payload example                                       |
| ---------------------- | -------------------------------------------------------------------- |
| `pdf_material`         | `{ "file_path": "...", "file_size": 1024, "page_count": 10 }`        |
| `slide_material`       | `{ "file_path": "...", "slide_count": 20 }`                          |
| `video_embed`          | `{ "embed_url": "https://...", "duration_seconds": 300 }`            |
| `external_link`        | `{ "url": "https://...", "open_in_new_tab": true }`                  |
| `assignment_reference` | `{ "assignment_id": "uuid" }` — links to an assignment in the module |

This model allows new content types to be added without schema changes.

---

## 8. Assignment System

---

### 8.1 Assignment Classification

**By purpose (type):**

| Type               | Description                                        |
| ------------------ | -------------------------------------------------- |
| `tugas_rumah`      | Pre-lab homework — completed before the session    |
| `tugas_praktikum`  | In-lab assignment — completed during/after session |
| `study_group_task` | Flexible task for Study Group courses              |

**By submission format:**

| Format      | Description                                        |
| ----------- | -------------------------------------------------- |
| `mcq`       | Multiple choice questions — auto-graded            |
| `essay_pdf` | Written answer + PDF file upload — manually graded |

---

### 8.2 Assignment Fields

| Field            | Description                                         |
| ---------------- | --------------------------------------------------- |
| `id`             | Assignment identifier                               |
| `module_id`      | Parent module                                       |
| `title`          | Assignment title                                    |
| `description`    | Instructions                                        |
| `type`           | Assignment type (see above)                         |
| `format`         | Submission format (see above)                       |
| `max_score`      | Maximum score for this assignment                   |
| `deadline`       | Overrides module `close_datetime` if set            |
| `allow_resubmit` | Allow student to replace submission before deadline |
| `is_required`    | If true, must be submitted for module completion    |
| `order_index`    | Display order within module                         |
| `is_published`   | Visible to students                                 |

---

### 8.3 MCQ Question & Option Structure

**mcq_questions:**

| Field           | Description              |
| --------------- | ------------------------ |
| `id`            | Question identifier      |
| `assignment_id` | Parent assignment        |
| `question_text` | Question content         |
| `order_index`   | Display order            |
| `points`        | Points for this question |

**mcq_options:**

| Field         | Description                        |
| ------------- | ---------------------------------- |
| `id`          | Option identifier                  |
| `question_id` | Parent question                    |
| `option_text` | Answer option text                 |
| `is_correct`  | Whether this is the correct answer |
| `order_index` | Display order                      |

MCQ scoring: `(sum of correct question points / total points) × max_score`

---

### 8.4 Submission Rules

- Each student has **one active submission slot** per assignment
- If `allow_resubmit = true`, a new submission replaces the previous (old version saved to `submission_history`)
- **Submissions blocked after deadline** (Phase 1 — no grace period)
- Late submission flag `is_late` stored for reference even if system rejects it

**Submission statuses:**

| Status      | Description                              |
| ----------- | ---------------------------------------- |
| `submitted` | Active current submission                |
| `replaced`  | Previous version, superseded by resubmit |

---

## 9. Submission & Grading Model

Submission and grade are **separate entities** to support draft grading, resubmissions, and audit trail.

---

### 9.1 Submission Table

| Field           | Description                            |
| --------------- | -------------------------------------- |
| `id`            | Submission identifier                  |
| `assignment_id` | Reference to assignment                |
| `student_id`    | Reference to student                   |
| `file_path`     | Storage path (for `essay_pdf`)         |
| `text_answer`   | Optional essay text field              |
| `submitted_at`  | Submission timestamp                   |
| `status`        | `submitted` / `replaced`               |
| `is_late`       | Whether submitted after deadline       |
| `version`       | Version number, increments on resubmit |

**Unique constraint:** `(assignment_id, student_id)` — one active submission per student per assignment.

`submission_history` table preserves all previous versions when resubmit occurs.

---

### 9.2 MCQ Answer Table

Stores individual question answers for MCQ submissions.

| Field                | Description                 |
| -------------------- | --------------------------- |
| `submission_id`      | Reference to submission     |
| `question_id`        | Reference to MCQ question   |
| `selected_option_id` | Chosen answer option        |
| `is_correct`         | Computed at submission time |

Auto-grading computes `score` when all answers are saved.

---

### 9.3 Grade Table

| Field           | Description                                        |
| --------------- | -------------------------------------------------- |
| `id`            | Grade identifier                                   |
| `submission_id` | Reference to submission (1:1 unique)               |
| `score`         | Numeric score — validated ≤ `max_score`            |
| `graded_by`     | Reference to assistant who graded                  |
| `graded_at`     | Grading timestamp                                  |
| `comment`       | Optional grading comment visible to student        |
| `status`        | `draft` / `published`                              |
| `published_at`  | Set automatically when status changes to published |

**Students can only see a grade when `status = published`.**

**Business rule:** `score` must be ≥ 0 and ≤ `assignment.max_score`. Enforced at application and database level.

---

## 10. File Storage Architecture

All files are stored **outside the database**.

### 10.1 Storage Strategy

| Phase   | Storage Method                |
| ------- | ----------------------------- |
| Phase 1 | Local Docker container volume |
| Phase 2 | S3-compatible object storage  |

### 10.2 Directory Structure

```
/storage
├── submissions/
│   └── {offering_id}/
│       └── {assignment_id}/
│           └── {student_id}/
│               └── {filename}.pdf
└── cms/
    ├── programs/
    ├── news/
    ├── assistants/
    └── gallery/
```

### 10.3 File Naming Convention (Submissions)

File names are **enforced server-side**, not by the client.

```
{nama}_{nim}_{hari}_{shift}_{courseCode}_{modulOrder}_{assignmentType}.pdf
```

Example:

```
BudiSantoso_2301234_Senin_Shift1_TK401_Modul1_TugasPraktikum.pdf
```

### 10.4 Security Rules

- Files are **never publicly accessible** by direct URL
- All file access is routed through authenticated API endpoints
- Authorization middleware validates that the requesting user owns or is authorized to view the file

---

## 11. Group Management

Groups belong to a **Course Offering**. Groups are the primary unit for assistant scoping and grading organization.

---

### 11.1 Group Rules

- **One student belongs to only one group** per Course Offering — enforced at database level
- Group numbers are **continuous within an offering** — do NOT reset per hari/shift
- The `kelompok` field from CSV is stored as reference only — assistant manages actual group assignment manually
- Deleting a group unassigns all its students (students become unassigned; must be reassigned manually)

---

### 11.2 Group Fields

| Field         | Description                                    |
| ------------- | ---------------------------------------------- |
| `id`          | Group identifier                               |
| `offering_id` | Parent Course Offering                         |
| `number`      | Group number (continuous, unique per offering) |
| `name`        | Optional label (e.g., Kelompok 1)              |

**Unique constraint:** `(offering_id, number)`

---

### 11.3 Group Management Capabilities

Assistant or Admin can:

- Create a new group (number auto-increments)
- Edit group name
- Delete group (students become unassigned)
- Add students to group
- Remove students from group
- Move students between groups
- View group roster with submission status and grade status per module

---

## 12. Feedback System

Mandatory for **Praktikum** course offerings. Optional for Study Group offerings.

---

### 12.1 Mandatory Feedback Types (Praktikum)

| #   | Type           | Key Value    | Description                                        |
| --- | -------------- | ------------ | -------------------------------------------------- |
| 1   | For Assistant  | `assistant`  | Rates assistant's teaching quality for this module |
| 2   | For Session    | `session`    | Rates the quality of the praktikum session         |
| 3   | For Laboratory | `laboratory` | Rates the overall lab environment and facilities   |

---

### 12.2 Feedback Unlock Rule

Feedback forms are **only accessible after** all `is_required = true` assignments for that module have been submitted. Grading is not required.

---

### 12.3 Feedback Record Fields

| Field          | Description                                                 |
| -------------- | ----------------------------------------------------------- |
| `student_id`   | Reference to student                                        |
| `offering_id`  | Reference to Course Offering                                |
| `module_id`    | Reference to module                                         |
| `assistant_id` | Reference to assistant being rated (for `type = assistant`) |
| `type`         | `assistant` / `session` / `laboratory`                      |
| `rating`       | Integer 1–5                                                 |
| `comment`      | Optional text comment                                       |
| `created_at`   | Submission timestamp                                        |

**Unique constraint:** `(student_id, module_id, type)` — one feedback entry per type per student per module.

---

### 12.4 Feedback Analytics (Assistant Dashboard)

- Average rating per feedback type per module
- Average assistant rating across all modules in an offering
- Minimum and maximum rating per type
- Total response count
- Rating trend across module progression

---

## 13. Study Group Domain

A public LMS layer accessible to **all registered users** — including students from other departments, cross-faculty learners, and general public.

---

### 13.1 Comparison: Praktikum vs Study Group

| Feature           | Praktikum                       | Study Group                        |
| ----------------- | ------------------------------- | ---------------------------------- |
| Access            | Internal students only          | All registered users               |
| Enrollment        | CSV import or manual by admin   | Self-enrollment (open or with key) |
| Feedback          | Mandatory (3 types)             | Optional                           |
| Group management  | Required, assistant-managed     | Optional                           |
| Grading           | Required (manual + auto-MCQ)    | Optional                           |
| Assignment types  | Tugas Rumah, Tugas Praktikum    | Flexible (`study_group_task`)      |
| Module completion | Strict (assignments + feedback) | Configurable per course            |

---

### 13.2 Study Group Enrollment Methods

| Method          | Description                                          |
| --------------- | ---------------------------------------------------- |
| Open enrollment | Any registered user can join immediately             |
| Enrollment key  | User must enter a key/code set by the course creator |
| Invite link     | _Phase 2_                                            |

---

## 14. Laboratory Personnel & Hall of Fame

This system manages **all laboratory assistants across generations** and powers the Hall of Fame on the public website. It is also integrated with **active assistant accounts in the LMS**.

---

### 14.1 Generation System

A generation represents a **cohort of laboratory assistants**.

| Field         | Description                                 |
| ------------- | ------------------------------------------- |
| `id`          | Generation identifier                       |
| `name`        | Generation label (e.g., Angkatan 10)        |
| `number`      | Numeric generation number (unique)          |
| `start_year`  | Year the generation started                 |
| `end_year`    | Year the generation ended (NULL if current) |
| `description` | Optional description                        |
| `is_active`   | TRUE if current active generation           |

**Business rule:** Maximum **20 members per generation** — enforced at application level.

---

### 14.2 Assistant Profile

Each assistant has a profile that can optionally be linked to a system user account.

| Field                | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `id`                 | Assistant profile identifier                         |
| `user_id`            | Optional reference to system user (for active users) |
| `generation_id`      | Reference to generation                              |
| `full_name`          | Display name                                         |
| `profile_photo_path` | Profile photo file path                              |
| `bio`                | Short biography                                      |
| `github_url`         | GitHub profile URL (optional)                        |
| `instagram_url`      | Instagram profile URL (optional)                     |
| `linkedin_url`       | LinkedIn profile URL (optional)                      |
| `status`             | `active` / `alumni`                                  |
| `joined_year`        | Year joined the laboratory                           |
| `end_year`           | Year left (NULL if still active)                     |
| `sort_order`         | Display order within generation                      |

**Rules:**

- Active assistants may have a linked `user_id` for LMS access
- Alumni assistants may have no system account (`user_id` can be NULL)
- Social media fields are all optional

---

### 14.3 Organizational Role Assignment

Each assistant can hold **one or more organizational roles** within their generation.

**assistant_roles mapping table:**

| Field          | Description                      |
| -------------- | -------------------------------- |
| `assistant_id` | Reference to assistant profile   |
| `role_id`      | Reference to organizational role |
| `assigned_at`  | Assignment timestamp             |

Unique constraint: `(assistant_id, role_id)`

Admin can add custom roles beyond the defaults listed in Section 3.2.

---

### 14.4 Hall of Fame Display Structure

Assistants are displayed grouped by generation and sorted by role hierarchy.

```
Generation N (e.g., Angkatan 10)
├── Assistant Coordinator
├── Secretary & Treasurer
├── Administrator
├── Logistic
├── Practicum Coordinator
│   └── Practicum Members
├── Research Group Coordinator
│   └── Research Group Members
├── Study Group Coordinator
│   └── Study Group Members
└── Other / Custom Roles
```

**Each assistant card displays:**

- Profile photo
- Full name
- Organizational role(s)
- Generation
- Active year range
- GitHub, Instagram, LinkedIn links (if set)
- Active / Alumni badge

**Sorting rules:**

- Grouped by generation (newest first or configurable)
- Roles sorted by `organizational_roles.sort_order`
- Members within same role sorted alphabetically

---

### 14.5 Admin Capabilities for Hall of Fame

- Create and edit generations
- Add assistant profile (with or without linked user account)
- Edit assistant profile fields and social media links
- Assign and remove organizational roles from an assistant
- Mark assistant as active or alumni
- Reorder display within generation
- Delete assistant profile

---

## 15. Public CMS

All content is managed through the **Admin CMS dashboard**. The public website displays read-only rendered output.

---

### 15.1 CMS Sections Overview

| Section                  | Description                                     |
| ------------------------ | ----------------------------------------------- |
| Laboratory Profile       | Lab name, description, vision, and mission      |
| Lab Programs             | List of programs run by the laboratory          |
| Laboratory News          | News articles and activity reports              |
| Gallery                  | Photos and event media                          |
| Organizational Structure | Displays active assistant generation            |
| Hall of Fame             | All generations archive (powered by Section 14) |
| Contact                  | Laboratory contact information                  |

---

### 15.2 Lab Programs

Displays programs and initiatives run by the laboratory.

**program fields:**

| Field            | Description                    |
| ---------------- | ------------------------------ |
| `id`             | Program identifier             |
| `title`          | Program title                  |
| `description`    | Short program description      |
| `thumbnail_path` | Cover image                    |
| `sort_order`     | Display order on landing page  |
| `is_published`   | Whether visible on public site |
| `created_at`     | Creation timestamp             |
| `updated_at`     | Last update timestamp          |

**Admin capabilities:** create, edit, delete, reorder, publish/unpublish programs.

Examples of programs:

- Praktikum Jaringan Komunikasi dan Data
- Cloud Computing Practicum
- Study Group Series
- Research Collaboration Programs

---

### 15.3 Laboratory News

News articles, activity reports, and announcements.

**news_articles table:**

| Field            | Description                          |
| ---------------- | ------------------------------------ |
| `id`             | Article identifier                   |
| `title`          | Article title                        |
| `slug`           | URL-friendly slug (unique)           |
| `content`        | Full article body (rich text / HTML) |
| `thumbnail_path` | Main cover image                     |
| `author_id`      | Reference to admin author            |
| `status`         | `draft` / `published`                |
| `published_at`   | Publish timestamp                    |
| `created_at`     | Creation timestamp                   |
| `updated_at`     | Last update timestamp                |

**news_images table** (additional photos per article):

| Field         | Description                  |
| ------------- | ---------------------------- |
| `id`          | Image identifier             |
| `news_id`     | Reference to parent article  |
| `image_path`  | File path                    |
| `caption`     | Optional image caption       |
| `order_index` | Display order within article |

Images can be displayed:

- Inline within the article body
- As a gallery section below the article

**Admin capabilities:** create, edit, delete, publish/unpublish articles; upload and manage article images.

---

### 15.4 Gallery

Standalone photo gallery for lab events and activities.

**cms_gallery_items table:**

| Field          | Description             |
| -------------- | ----------------------- |
| `id`           | Gallery item identifier |
| `title`        | Optional title          |
| `description`  | Optional description    |
| `file_path`    | Image file path         |
| `sort_order`   | Display order           |
| `is_published` | Visibility flag         |
| `created_at`   | Upload timestamp        |

---

### 15.5 Pages (Static Content)

Editable static pages for lab profile, vision & mission, and contact.

| Field          | Description                            |
| -------------- | -------------------------------------- |
| `id`           | Page identifier                        |
| `slug`         | Unique slug (e.g., `about`, `contact`) |
| `title`        | Page title                             |
| `content`      | Rich text / HTML content               |
| `is_published` | Visibility flag                        |
| `updated_by`   | Last editor (admin user)               |
| `updated_at`   | Last update timestamp                  |

---

## 16. Dashboards

---

### 16.1 Student Dashboard

| Widget                   | Description                                        |
| ------------------------ | -------------------------------------------------- |
| Active Praktikum Courses | Enrolled offerings with status                     |
| Study Group Courses      | Self-enrolled Study Group courses                  |
| Module Progress Tracker  | Per module: materials / assignments / feedback     |
| Submission Status        | Per assignment: not submitted / submitted / graded |
| Feedback Completion      | Which feedback types have been submitted           |
| Grade Summary            | Published scores and assistant comments            |
| Upcoming Deadlines       | Next module close dates                            |

---

### 16.2 Assistant Dashboard

| Widget                | Description                                             |
| --------------------- | ------------------------------------------------------- |
| Assigned Offerings    | List of managed Course Offerings                        |
| Student Count         | Total enrolled students per offering                    |
| Group Overview        | Group list with member counts                           |
| Pending Grading Queue | Submissions awaiting grade (filterable by group/module) |
| Submission Filters    | Filter by module, group, assignment type, status        |
| Feedback Analytics    | Avg rating per type per module; trend charts            |

---

### 16.3 Admin Dashboard

| Widget                       | Description                                       |
| ---------------------------- | ------------------------------------------------- |
| CMS Management               | Quick access to all CMS sections                  |
| User Management              | Create, edit, delete users; assign roles          |
| Course & Offering Management | Create and manage all courses                     |
| CSV Import Tool              | Import enrollment CSV with history and error logs |
| Hall of Fame Management      | Manage generations and assistant profiles         |
| System Analytics             | Total users, active enrollments, submission rates |

---

## 17. Audit Log

The system must record all critical actions for debugging, accountability, and security tracking.

### 17.1 Audit Log Fields

| Field        | Description                           |
| ------------ | ------------------------------------- |
| `id`         | Log entry identifier                  |
| `actor_id`   | User who performed the action         |
| `action`     | Action name (see list below)          |
| `entity`     | Affected table/entity name            |
| `entity_id`  | Affected record ID                    |
| `old_data`   | State before the change (JSON)        |
| `new_data`   | State after the change (JSON)         |
| `metadata`   | Extra context: IP address, request ID |
| `created_at` | Timestamp of the action               |

### 17.2 Tracked Actions

| Action                    | Description                    |
| ------------------------- | ------------------------------ |
| `user_created`            | New user account created       |
| `user_updated`            | User profile modified          |
| `role_changed`            | System role changed            |
| `csv_imported`            | CSV enrollment import executed |
| `enrollment_created`      | Student enrolled               |
| `enrollment_deleted`      | Student unenrolled             |
| `group_created`           | Group created                  |
| `group_updated`           | Group name or metadata updated |
| `group_deleted`           | Group deleted                  |
| `group_member_added`      | Student added to group         |
| `group_member_removed`    | Student removed from group     |
| `module_published`        | Module status set to open      |
| `submission_created`      | Student submission recorded    |
| `submission_replaced`     | Resubmission replaced previous |
| `grade_drafted`           | Grade saved as draft           |
| `grade_published`         | Grade published to student     |
| `grade_updated`           | Published grade edited         |
| `feedback_submitted`      | Feedback entry created         |
| `offering_status_changed` | Offering status updated        |

---

## 18. Non-Functional Requirements

---

### 18.1 Infrastructure

| Component      | Specification                       |
| -------------- | ----------------------------------- |
| Database       | PostgreSQL (default deployment)     |
| File Storage   | Local Docker volume → S3-compatible |
| Backend        | REST API with RBAC middleware       |
| Authentication | JWT tokens                          |
| Deployment     | Docker / Docker Compose             |

---

### 18.2 Security

- Role-based access control (RBAC) enforced at application layer
- Row-level data isolation: students see only their own data
- Assistants see only data from their assigned offerings and groups
- File access routed through authenticated API — no public direct URLs
- Password hashing with bcrypt or equivalent
- Soft delete on all critical records (`deleted_at`)

---

### 18.3 Performance & Scalability

- Supports **1,000+ enrolled students** per semester
- CSV import handles **500+ row files** efficiently
- Pagination required on all list views exceeding 20 items
- Indexes on all foreign keys and common query filter columns
- Module completion tracking uses cache table to avoid recomputing on every request

---

### 18.4 Data Integrity Constraints

| Constraint                                         | Enforcement Level            |
| -------------------------------------------------- | ---------------------------- |
| Unique NIM per Course Offering                     | Database UNIQUE constraint   |
| One group per student per offering                 | Database UNIQUE constraint   |
| One submission per student per assignment (active) | Database UNIQUE constraint   |
| One feedback per type per student per module       | Database UNIQUE constraint   |
| Grade score ≤ assignment max_score                 | Database trigger + app logic |
| Max 20 members per generation                      | Application level            |
| File naming convention                             | Server-side enforcement      |

---

## 19. End-to-End Student Journey (Praktikum)

| Step | Action                 | Detail                                                                    |
| ---- | ---------------------- | ------------------------------------------------------------------------- |
| 1    | External Registration  | Student registers on SIAM or equivalent external platform                 |
| 2    | CSV Received by Lab    | Lab receives CSV file with enrollment data                                |
| 3    | Admin Imports CSV      | Admin uploads CSV; accounts auto-created; enrollments inserted            |
| 4    | First Login            | Student logs in with NIM; prompted to change password                     |
| 5    | Group Assignment       | Assistant assigns student to a group within the Course Offering           |
| 6    | Module Access          | Student opens active module; views slide/PDF learning materials           |
| 7    | Submit Tugas Rumah     | Student completes pre-lab homework (MCQ or essay+PDF) before deadline     |
| 8    | Submit Tugas Praktikum | During/after lab session, student submits lab assignment                  |
| 9    | Feedback Unlocked      | After all required assignments submitted, feedback forms become available |
| 10   | Submit 3 Feedbacks     | Student fills in feedback for Assistant, Session, and Laboratory          |
| 11   | Module Marked Complete | All conditions met; module completion flag set                            |
| 12   | Assistant Grades       | Assistant reviews submission, inputs score, saves as draft or publishes   |
| 13   | Student Views Grade    | Student sees published score and assistant comment in dashboard           |

---

## 20. Phase 1 MVP Scope

| Feature                                         | Status |
| ----------------------------------------------- | ------ |
| Authentication & system roles                   |        |
| Organizational role system                      |        |
| Course & Course Offering                        |        |
| CSV enrollment import with validation           |        |
| Manual enrollment                               |        |
| Manual group management                         |        |
| Module creation with schedule/status            |        |
| Module content items (PDF, slide, links)        |        |
| Essay + PDF upload assignment                   |        |
| MCQ assignment (auto-graded)                    |        |
| Submission system with resubmit support         |        |
| Grading system (manual + auto)                  |        |
| Module completion tracking                      |        |
| 3-type mandatory feedback (Praktikum)           |        |
| Study Group public enrollment                   |        |
| Landing page CMS (pages, gallery, contact)      |        |
| Lab Programs CMS                                |        |
| Lab News CMS (articles + image gallery)         |        |
| Hall of Fame (generations + assistant profiles) |        |
| Organizational role assignment                  |        |
| Student / Assistant / Admin dashboards          |        |
| First-login password change flow                |        |
| Audit log                                       |        |
| File storage (local volume)                     |        |

---

## 21. Phase 2 Expansion

| Feature                                 | Notes                                                            |
| --------------------------------------- | ---------------------------------------------------------------- |
| Email automation                        | Enrollment confirmation, deadline reminders, grade notifications |
| Attendance tracking                     | Per-session attendance records                                   |
| Certificate generation                  | Completion certificates for courses                              |
| Discussion forum per module             | Q&A threads per module                                           |
| Collaborative group assignments         | Group-based submission support                                   |
| Mobile-responsive PWA                   | Progressive Web App for mobile learners                          |
| Advanced analytics dashboard            | Grade distributions, feedback heatmaps, trends                   |
| Invitation-based Study Group enrollment | Admin/assistant sends invite link                                |
| Bulk grading with CSV export/import     | Grade multiple submissions at once                               |
| S3-compatible file storage              | Migration from local volume                                      |
| Grace period for late submissions       | Configurable per assignment                                      |

---

_End of PRD v1.2_

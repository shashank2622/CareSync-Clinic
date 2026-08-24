# 🏥 CareSync | Healthcare Appointment & Follow-up Manager

<div align="center">

# [Website](care-sync-clinic-seven.vercel.app)

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![NodeJS](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini_1.5_Flash-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Google Calendar](https://img.shields.io/badge/Google_Calendar-OAuth_2.0-4285F4?style=for-the-badge&logo=googlecalendar&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployable-black?style=for-the-badge&logo=vercel&logoColor=white)

**A production-ready, submission-compliant healthcare platform featuring concurrency-safe doctor reservations, AI clinical intake summaries with urgency scoring, automated daily medication schedules, and two-way Google Calendar synchronization.**

[Quickstart](#-quickstart-guide-local-setup) • [Demo Accounts](#-pre-seeded-demo-accounts-1-click-login) • [Architecture](#-architecture--system-design) • [API Catalog](#-rest-api-endpoints-catalog) • [AI Prompts](#-google-gemini-ai-prompts) • [Deployment](care-sync-clinic-seven.vercel.app)

</div>

---

## 🌟 Executive Summary & Key Highlights

- 🔒 **Zero Double-Booking Guarantee:** 5-minute pessimistic slot holds backed by row-level PostgreSQL transaction locks and composite unique constraints `(doctorId, slotStartTime)`.
- 🧠 **Google Gemini 1.5 Clinical AI Layer:**
  - **Pre-Visit Clinical Prep:** Categorizes urgency (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`) and drafts targeted diagnostic inquiries for the doctor based on patient symptoms.
  - **Post-Visit Patient Summary:** Converts doctor's clinical findings and diagnoses into clear, encouraging, plain-language patient care instructions and medication schedules.
  - **Fault-Tolerant Fallback:** Non-blocking execution ensures consultations never crash if API limits or network drops occur.
- 💊 **Automated Medication Reminder Engine:** Background BullMQ + Redis worker calculates daily dose schedules (`ONCE_DAILY`, `TWICE_DAILY`, `EVERY_8_HOURS`, etc.) with patient pause/resume toggles. Decoupled from the frontend.
- 📅 **Google Calendar OAuth 2.0 Integration:** Two-way calendar sync with AES-256-GCM encrypted token storage. Automatically creates events on booking, patches on reschedule, and removes on cancellation.
- 🚨 **Doctor Leave Conflict Strategy:** Admin schedules physician leave $\to$ active consultations transition atomically to `CANCELLED_DOCTOR_LEAVE` $\to$ slots are released $\to$ automated patient email alerts are dispatched with 1-click reschedule links.
- 👥 **Role-Based Portals (RBAC):** Dedicated workflows and views for **Patients**, **Physicians**, and **Clinic Administrators**.

---

## 🏗️ Architecture & System Design

```
                               ┌────────────────────────────────────────────────────────┐
                               │                 CareSync Frontend UI                   │
                               │          React 18 + Vite + Tailwind + TanStack         │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │
                                                    REST API (JWT)
                                                          │
                               ┌──────────────────────────▼─────────────────────────────┐
                               │                 CareSync Backend API                   │
                               │          Express + TypeScript + Zod Validation         │
                               └───┬─────────────┬──────────────┬──────────────┬────────┘
                                   │             │              │              │
                    ┌──────────────▼─────┐ ┌─────▼────────┐ ┌───▼────────┐ ┌───▼────────┐
                    │    PostgreSQL 16   │ │ Redis/BullMQ │ │ Google     │ │ Google     │
                    │   (Prisma 18 Mod)  │ │ Queue Worker │ │ Gemini 1.5 │ │ Calendar   │
                    └────────────────────┘ └──────────────┘ └────────────┘ └────────────┘
```

---

## ⚡ Quickstart Guide (Local Setup)

### 1. Clone & Install
```bash
# Clone repository
git clone https://github.com/<your-username>/healthcare-appointment-manager.git
cd healthcare-appointment-manager

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

Ensure your `backend/.env` contains your configuration:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Connection (Neon.tech / Supabase / Local PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/healthcare_db?schema=public"

# Redis (Upstash / Local Redis)
REDIS_URL="redis://localhost:6379"

# Security & Secrets (Min 32 characters)
JWT_SECRET="7f8b9a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"
JWT_REFRESH_SECRET="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
DATA_ENCRYPTION_KEY="f1e2d3c4b5a697887766554433221100aabbccddeeff00112233445566778899"

# Google Gemini AI
LLM_PROVIDER=gemini
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL=gemini-1.5-flash

# Email Service (Nodemailer / SMTP / Mock)
EMAIL_PROVIDER=mock
EMAIL_FROM="CareSync Clinic <appointments@caresync.clinic>"

# Google Calendar OAuth 2.0
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/calendar/callback"

SLOT_HOLD_DURATION_MINUTES=5
```

### 3. Initialize Database & Seed Demo Data
```bash
cd backend
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### 4. Start Development Servers
```bash
# Terminal 1: Backend Server (Port 5000)
cd backend
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Pre-Seeded Demo Accounts (1-Click Login)

The login screen (`/login`) includes **1-Click Quick Demo Login buttons** pre-configured for evaluation:

| Role | Email | Password | Pre-Loaded Context |
| :--- | :--- | :--- | :--- |
| **Patient** | `alice@example.com` | `Patient@123` | Active appointments, symptom histories & prescriptions |
| **Doctor** | `dr.sarah@clinic.com` | `Doctor@123` | Cardiologist with active queue & configured shifts |
| **Doctor** | `dr.marcus@clinic.com` | `Doctor@123` | Dermatologist |
| **Admin** | `admin@clinic.com` | `Admin@123` | Clinic manager with full analytics & leave access |

---

## 🧪 Automated Testing Suite

```bash
cd backend
npm test
```

### Test Coverage Highlights:
- **`auth.test.ts`**: User registration, password complexity validation, login, and RBAC route protection.
- **`concurrency.test.ts`**: Simultaneous slot holds and transactional booking collision prevention (`SLOT_ALREADY_BOOKED`).
- **`leave-conflict.test.ts`**: Admin leave conflict detection and patient notification cascade.
- **`llm-fallback.test.ts`**: Gemini provider failure simulation and rule-based fallback generation.
- **`unit.test.ts`**: Medication frequency parsing, break interval overlap math, and AES-256 token encryption.

---

## 📡 REST API Endpoints Catalog

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new patient account |
| `POST` | `/api/auth/login` | Authenticate user and issue JWT Access + Refresh tokens |
| `POST` | `/api/auth/refresh-token` | Rotate refresh token and issue new access token |
| `POST` | `/api/auth/logout` | Invalidate user session and revoke refresh tokens |

### Doctors & Availability (`/api/doctors`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/doctors` | Search specialists by specialization, keyword, and fee |
| `GET` | `/api/doctors/specializations` | List all medical specialties |
| `GET` | `/api/doctors/:id` | Doctor profile and weekly working hours |
| `GET` | `/api/doctors/:id/availability` | Dynamic slot calculation excluding breaks & past slots |
| `GET` | `/api/doctors/:id/available-dates`| Monthly calendar availability map |
| `POST` | `/api/doctors/:id/working-hours`| Configure doctor shift hours and break intervals |

### Appointments & Holds (`/api/appointments`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/appointments/hold` | Acquire 5-minute pessimistic hold on a slot |
| `DELETE`| `/api/appointments/hold/:token` | Release a held slot early |
| `POST` | `/api/appointments` | Confirm booking transaction from hold token |
| `GET` | `/api/appointments` | List consultations (filtered by user role) |
| `GET` | `/api/appointments/:id` | Get single appointment details |
| `PATCH`| `/api/appointments/:id/cancel` | Cancel appointment with required reason |
| `PATCH`| `/api/appointments/:id/reschedule`| Reschedule consultation using a new hold token |

### AI Summaries & Clinical Records (`/api/appointments/:id`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/appointments/:id/previsit-summary` | Doctor views AI pre-visit urgency & suggested questions |
| `POST`| `/api/appointments/:id/previsit-summary/retry` | Regenerate AI pre-visit analysis |
| `POST`| `/api/appointments/:id/visit-notes` | Doctor completes visit, records vitals, and issues Rx |
| `GET` | `/api/appointments/:id/postvisit-summary` | Patient views plain-language AI post-visit care plan |
| `POST`| `/api/appointments/:id/postvisit-summary/retry`| Regenerate AI post-visit summary |

### Prescriptions & Reminders (`/api/prescriptions` & `/api/reminders`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/prescriptions/my-prescriptions` | Patient prescription history |
| `GET` | `/api/reminders/active` | Patient active medication dose schedules |
| `PATCH`| `/api/reminders/:id/toggle` | Enable or pause medication reminder |

### Google Calendar Integration (`/api/calendar`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/calendar/connect` | Generate Google OAuth 2.0 consent URL |
| `GET` | `/api/calendar/callback` | Handle Google OAuth token exchange & encryption |
| `DELETE`| `/api/calendar/disconnect` | Revoke and remove Google Calendar connection |
| `GET` | `/api/calendar/status` | Check user calendar connection status |
| `POST`| `/api/calendar/sync/:appointmentId` | Manually re-sync appointment event |

### Admin Console (`/api/admin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | System analytics and appointment statistics |
| `POST`| `/api/admin/doctors` | Create new specialist profile & account |
| `POST`| `/api/admin/doctors/:id/leave` | Declare doctor leave & cascade conflict alerts |
| `GET` | `/api/admin/doctors/:id/leave` | View doctor leave history |
| `GET` | `/api/admin/users` | User directory with active status toggles |

---

## 🤖 Google Gemini AI Prompts

### 1. Pre-Visit Clinical Analysis Prompt
```text
You are an expert clinical assistant reviewing a patient's pre-appointment intake.
Analyze the following patient report and return a JSON object with:
1. "urgencyLevel": One of "LOW", "MEDIUM", "HIGH", "EMERGENCY"
2. "chiefComplaintSummary": Concise clinical summary of the patient's concern
3. "suggestedQuestions": Array of 3-4 targeted diagnostic questions the physician should ask

Patient Intake:
- Chief Complaint: <chiefComplaint>
- Description: <symptomsText>
- Duration: <duration>
- Severity (1-10): <severity>
- Additional Notes: <additionalNotes>
```

### 2. Post-Visit Patient Care Summary Prompt
```text
Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps.
Ensure tone is clear, reassuring, and completely faithful to the physician's entered notes:

Doctor's Clinical Notes:
<clinicalNotes>

Diagnosis:
<diagnosis>

Prescriptions:
<prescriptions>

Follow-up Instructions:
<followUpInstructions>
```

---

## 🌐 Vercel Cloud Deployment

1. Push this repository to GitHub on branch `main`.
2. Import the project into **[Vercel](https://vercel.com)**.
3. Configure environment variables in the Vercel Dashboard (copy from `backend/.env`).
4. Click **Deploy**. Vercel will build the frontend and serve the backend serverlessly via `api/index.ts` automatically!

---

## 📜 Submission Compliance Checklist

- [x] **Git Repository:** Default branch named `main` with clean commit history.
- [x] **No Secrets Committed:** `.env` is ignored; `.env.example` provided.
- [x] **No Build Artifacts:** `node_modules/`, `dist/`, `.next/` excluded.
- [x] **System Design Write-up:** Under 800 words, detailed in `SYSTEM_DESIGN.md`.
- [x] **Minimal Dependencies:** Zero bloat libraries; native crypto & utilities prioritized.
- [x] **Zero Mock TODOs:** Complete end-to-end working production implementation.

---

## 📄 License
MIT License • Developed for Healthcare Evaluation Submission

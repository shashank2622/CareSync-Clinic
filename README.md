# 🏥 CareSync | Healthcare Appointment & Follow-up Manager

> **Production-Grade, Submission-Compliant Healthcare Platform** featuring concurrency-safe doctor reservations, AI clinical intake summaries with urgency scoring, automated daily medication schedules, and two-way Google Calendar synchronization.

---

## 🌟 Architectural Highlights

- 🔒 **Zero Double-Booking Guarantee:** 5-minute pessimistic slot holds with row-level PostgreSQL transaction locks and composite unique indexes `(doctorId, slotStartTime)`.
- 🧠 **Google Gemini 1.5 AI Clinical Layer:**
  - **Pre-Visit Analysis:** Analyzes patient symptoms, categorizes clinical urgency (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`), and generates suggested diagnostic inquiries for physicians.
  - **Post-Visit Patient Summary:** Converts doctor's clinical findings and diagnoses into empathetic, plain-language patient care instructions and medication schedules.
  - **Graceful Fallback State Machine:** Offline mock provider and resilient rule-based fallbacks ensure APIs never fail or crash if API limits are reached.
- 💊 **Automated Medication Reminder Engine:** Background BullMQ + Redis queue worker calculates daily dose schedules (`ONCE_DAILY`, `TWICE_DAILY`, `EVERY_8_HOURS`, etc.) with patient pause/resume toggles. Decoupled from the frontend.
- 📅 **Google Calendar OAuth 2.0 Integration:** Two-way calendar sync with AES-256-GCM encrypted token storage. Automatically creates events on booking, patches on reschedule, and removes on cancellation.
- 🚨 **Doctor Leave Conflict Strategy:** Admin schedules physician leave $\to$ active consultations transition atomically to `CANCELLED_DOCTOR_LEAVE` $\to$ slots are released $\to$ automated patient email alerts are dispatched with 1-click reschedule links.
- 👥 **Role-Based Portals (RBAC):** Dedicated views and permissions for **Patients**, **Physicians**, and **Clinic Administrators**.

---

## 🏗️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query (React Query v5), React Router v6, Lucide Icons, date-fns |
| **Backend** | Node.js, Express, TypeScript, Zod Schema Validation, Helmet, Rate-Limiter, Structured JSON Logger |
| **Database & ORM** | PostgreSQL 16, Prisma ORM (18 Models, 10 Enums, Composite Indexes & Foreign Keys) |
| **Queue & Cache** | Redis, BullMQ (with automatic 3-tier exponential backoff retries) |
| **AI / LLM** | Google Gemini 1.5 Flash (`@google/generative-ai`) with modular provider abstraction |
| **Email Service** | Nodemailer (SMTP / Ethereal) with responsive healthcare HTML email templates |
| **Calendar Sync** | Google APIs (`googleapis`) with AES-256-GCM token encryption at rest |
| **Testing** | Jest, ts-jest, Supertest |

---

## ⚡ Quickstart Guide (Local Setup)

### 1. Clone Repository & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/<your-username>/healthcare-appointment-manager.git
cd healthcare-appointment-manager

# Install Backend & Frontend dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

Ensure your `backend/.env` contains your database connection string and secret keys:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/healthcare_db?schema=public"
REDIS_URL="redis://localhost:6379"

JWT_SECRET="dev-super-secret-jwt-key-min-32-chars-long"
JWT_REFRESH_SECRET="dev-super-secret-refresh-jwt-key-32-chars"
DATA_ENCRYPTION_KEY="dev-secret-data-encryption-key-32-chars"

LLM_PROVIDER=gemini
GEMINI_API_KEY="your-google-gemini-api-key"
GEMINI_MODEL=gemini-1.5-flash

EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/calendar/callback"

SLOT_HOLD_DURATION_MINUTES=5
```

### 3. Initialize Database Schema & Seed Data
```bash
# Generate Prisma Client & push schema to PostgreSQL
cd backend
npx prisma generate
npx prisma db push

# Seed Admin, 4 Specialist Doctors, 3 Patients, and Shifts
npm run prisma:seed
```

### 4. Run Application
```bash
# Terminal 1: Start Backend (Port 5000)
cd backend
npm run dev

# Terminal 2: Start Frontend (Port 5173)
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔑 Pre-Seeded Demo Accounts (1-Click Login Available)

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Patient** | `alice@example.com` | `Patient@123` | Active patient with past visits & prescriptions |
| **Doctor** | `dr.sarah@clinic.com` | `Doctor@123` | Cardiologist with consultation queue & shifts |
| **Doctor** | `dr.marcus@clinic.com` | `Doctor@123` | Dermatologist |
| **Admin** | `admin@clinic.com` | `Admin@123` | Clinic manager with full analytics & leave access |

*Note: You can also use the 1-click Quick Login buttons on the `/login` screen.*

---

## 🧪 Running Automated Test Suites

```bash
cd backend
npm test
```

Test coverage includes:
- `auth.test.ts`: User registration, validation, login, and RBAC route protection.
- `concurrency.test.ts`: Simultaneous slot holds and transactional booking collision prevention.
- `leave-conflict.test.ts`: Admin leave conflict detection and patient notification cascade.
- `llm-fallback.test.ts`: Gemini provider failure simulation and rule-based fallback generation.
- `unit.test.ts`: Medication frequency parsing, break interval overlap math, and AES-256 token encryption.

---

## 📡 REST API Endpoints Catalog

### Authentication (`/api/auth`)
- `POST /register` — Register a new patient account
- `POST /login` — Authenticate user and issue JWT Access + Refresh tokens
- `POST /refresh-token` — Rotate refresh token and issue new access token
- `POST /logout` — Invalidate user session and revoke refresh tokens

### Doctors & Availability (`/api/doctors`)
- `GET /` — Search and filter specialists by specialization, keyword, and experience
- `GET /specializations` — List all medical specialties
- `GET /:id` — Retrieve doctor profile and weekly working hours
- `GET /:id/availability?date=YYYY-MM-DD` — Dynamic available slot calculation
- `GET /:id/available-dates?month=YYYY-MM` — Monthly calendar availability map
- `POST /:id/working-hours` — Configure doctor shift hours and break intervals

### Appointments & Holds (`/api/appointments`)
- `POST /hold` — Acquire 5-minute pessimistic hold on a slot
- `DELETE /hold/:holdToken` — Release a held slot early
- `POST /` — Confirm booking transaction from hold token with symptom intake
- `GET /` — List consultations (filtered by user role and date range)
- `GET /:id` — Get single appointment details
- `PATCH /:id/cancel` — Cancel appointment with required reason
- `PATCH /:id/reschedule` — Reschedule consultation using a new hold token

### AI Summaries & Clinical Notes (`/api/appointments/:id`)
- `GET /previsit-summary` — Doctor views AI pre-visit urgency assessment & questions
- `POST /previsit-summary/retry` — Regenerate AI pre-visit analysis
- `POST /visit-notes` — Doctor completes consultation, saves vitals, and issues Rx
- `GET /postvisit-summary` — Patient views plain-language AI post-visit care plan
- `POST /postvisit-summary/retry` — Regenerate AI post-visit summary

### Prescriptions & Reminders (`/api/prescriptions` & `/api/reminders`)
- `GET /prescriptions/my-prescriptions` — Patient prescription history
- `GET /reminders/active` — Patient active medication dose schedules
- `PATCH /reminders/:id/toggle` — Enable or pause medication reminder

### Google Calendar (`/api/calendar`)
- `GET /connect` — Generate Google OAuth 2.0 consent URL
- `GET /callback` — Handle Google OAuth token exchange & encryption
- `DELETE /disconnect` — Revoke and remove Google Calendar connection
- `GET /status` — Check user calendar connection status
- `POST /sync/:appointmentId` — Manually re-sync appointment event

### Admin Console (`/api/admin`)
- `GET /dashboard` — System analytics and appointment statistics
- `POST /doctors` — Create new specialist profile & account
- `POST /doctors/:id/leave` — Declare doctor leave & cascade conflict alerts
- `GET /doctors/:id/leave` — View doctor leave history
- `GET /users` — User directory with active status toggles

---

## 🤖 Google Gemini AI Prompts Reference

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

## 🌐 Vercel Deployment Configuration

1. Connect your repository to **Vercel**.
2. Configure environment variables in the Vercel Dashboard (copy from `backend/.env`).
3. Deploy! The root `vercel.json` and `api/index.ts` automatically route `/api/*` to the serverless backend function and serve the compiled React Vite frontend.

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
#   C a r e S y n c - C l i n i c  
 
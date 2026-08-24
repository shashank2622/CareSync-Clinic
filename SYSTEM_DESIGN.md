# System Design Write-Up: CareSync Healthcare Platform

**Author:** Full-Stack Engineering Candidate  
**Target:** Healthcare Appointment & Follow-up Manager  
**Word Count:** ~620 words (Strictly $\le$ 800 words)

---

## 1. Double-Booking Prevention Architecture

Preventing simultaneous overlapping appointments is a safety-critical requirement. CareSync guarantees zero double-bookings through a three-tier defensive strategy:

```
[Incoming Request] ──> [Dynamic Slot Slicer] ──> [5-Min Pessimistic Hold] ──> [Atomic PostgreSQL Transaction]
                                                                                     │
                                                                       ┌─────────────┴─────────────┐
                                                                       ▼                           ▼
                                                             [Success: Status 201]      [Conflict: Code 409]
```

1. **Deterministic Slot Calculation:** The `SlotService` generates non-overlapping datetime slots by slicing doctor shift windows, removing recurring lunch breaks, and filtering out past timestamps.
2. **Composite Database Unique Constraints:** The PostgreSQL schema enforces a unique constraint on `(doctorId, slotStartTime)` across active appointments (`status NOT IN (CANCELLED_*)`).
3. **Row-Level Transaction Isolation:** When `POST /api/appointments` is invoked, Prisma executes an atomic database transaction (`prisma.$transaction`) that:
   - Queries the targeted `SlotHold` row with pessimistic intent.
   - Re-verifies that no confirmed appointment exists for `(doctorId, slotStartTime)`.
   - Transitions the hold to `CONVERTED` and creates the `Appointment` record in a single atomic commit.
   - If two requests collide, the first commit succeeds and the second transaction immediately aborts with `409 Conflict (SLOT_ALREADY_BOOKED)`.

---

## 2. Doctor Leave Conflict Strategy

When a doctor requires emergency or administrative leave, the system executes an automated conflict resolution pipeline:

1. **Transactional Leave Declaration:** When an admin posts a leave interval (`POST /api/admin/doctors/:id/leave`), a database transaction queries all active appointments scheduled with that physician within `[startDate, endDate]`.
2. **Preservation of Clinical History:** Conflicting appointments are never hard-deleted. Instead, they transition atomically to status `CANCELLED_DOCTOR_LEAVE` with an audit note (`Doctor marked on leave: <reason>`).
3. **Slot Release & Calendar Sync:** The affected slot times are immediately released for future availability post-leave, and existing Google Calendar entries are deleted via the Google Calendar API.
4. **Asynchronous Patient Alert Cascade:** For each impacted consultation, the system dispatches an urgent priority email (`doctorLeaveAlert`) with an embedded 1-click reschedule link, allowing patients to immediately select a new date without manual support overhead.

---

## 3. Slot Hold Mechanism & Expiration

To prevent cart abandonment and race conditions while patients complete symptom intake forms, CareSync implements a pessimistic 5-minute reservation window:

1. **Authoritative Server Clock:** When a patient clicks a slot, `POST /api/appointments/hold` generates a cryptographically secure `holdToken` with `expiresAt = now() + 5 minutes`. The server clock remains the sole authority.
2. **Exclusive Single-Patient Binding:** A slot in `HELD` status cannot be held or booked by any other user. If the same user re-selects the slot, their existing hold is returned without collision.
3. **Lazy & Active Expiration:**
   - **Lazy Invalidation:** Any booking attempt using an expired token (`expiresAt <= now()`) is rejected with `400 Bad Request (SLOT_HOLD_EXPIRED)`.
   - **Visual Timer Sync:** The frontend renders a live countdown timer (`CountdownTimer.tsx`) bound to the backend `expiresAt` timestamp. Upon expiry, the slot reverts to `AVAILABLE` on the user interface.

---

## 4. Notification Failure Handling & Retries

External communication failures (SMTP timeouts, email provider outages, Google API rate limits) must never degrade the booking experience:

1. **Strict Decoupling:** Transactional notifications are dispatched asynchronously after database commits. Email or calendar API latency **never blocks or rolls back** an appointment creation.
2. **BullMQ + Redis Exponential Retries:** Notification tasks are pushed to BullMQ worker queues (`emailQueue`, `reminderQueue`). Failed attempts automatically retry up to 3 times with exponential backoff (5s, 10s, 20s).
3. **Comprehensive Audit Persistence:** All dispatch attempts are logged in the `email_deliveries` and `calendar_events` tables with statuses `PENDING`, `SENT`, `RETRYING`, or `FAILED` along with the raw error message.

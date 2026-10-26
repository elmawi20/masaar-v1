# Receptionist Logic Audit & QA Test Design
**Physiotherapy Clinic CRM Prototype (`PhysioFlow` / `Masaar Clinic`)**  
**Role Evaluated:** Receptionist (`currentRole === 'receptionist'`)  
**Architecture:** Browser Client (Next.js 15 App Router) → Client State (`ClinicContext.tsx`) → `localStorage` (No server or database)  
**Inspection Date:** October 2026  
**Evaluation Mode:** Source Code Logic Audit & Test Verification (Non-destructive inspection only)

---

### Audit Finding Totals
**CRITICAL: 5 | HIGH: 12 | MEDIUM: 16 | LOW: 8 | NOT VERIFIED: 4**

*Evidence Classification Definitions:*
- **RUNTIME VERIFIED:** Actually tested and reproduced in the active browser/server runtime session.
- **CODE VERIFIED:** Directly proven through deterministic analysis of the active source code.
- **INFERRED:** High-probability deduction based on code structures that requires physical user interaction or manual browser reproduction.

*Result Definitions:*
- **PASS:** System behaves in accordance with professional clinic receptionist standards.
- **FAIL:** System exhibits logic bugs, architectural flaws, data corruption, or unhandled failures.
- **NOT VERIFIED:** Test design established, but requires manual multi-device or live user interaction.
- **BUSINESS DECISION REQUIRED:** Functional behavior requires executive clinic policy definition before technical resolution.

---

## 1. Patient Registration & Management

### Test 1.1: Creating a Valid Patient
- **Expected behavior:** Receptionist inputs full name, Egyptian mobile number, age, gender, payment type, assigned physio, and initial diagnosis. System saves record, issues a unique ID, initializes default status, and displays a confirmation state.
- **Current behavior:** Form validates required fields, assigns a deterministic timestamp ID (`pat-${Date.now().toString().slice(-4)}`), assigns `status: 'active'` (or `'lead'`), updates `patients` in `ClinicContext`, and triggers a WhatsApp intake confirmation modal.
- **Evidence:** CODE VERIFIED
- **Result:** PASS
- **Severity:** NOT APPLICABLE
- **Files involved:** [PatientIntakeModal.tsx](file:///f:/SAAS/components/patients/PatientIntakeModal.tsx#L152-L215), [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L470-L495)
- **Recommended direction:** Maintain current flow; ensure patient ID generation uses UUIDv4 instead of 4-digit timestamp slice to eliminate collision risk.

---

### Test 1.2: Missing Patient Name
- **Expected behavior:** Form blocks submission, displays inline error message under the input field, and focuses the name input.
- **Current behavior:** `handleSubmit` executes `if (!fullName.trim() || !phone.trim() ...)` and triggers a native browser modal `alert('يرجى إدخال اسم المريض ورقم الهاتف.')`. No inline field validation or error highlighting exists.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** LOW
- **Files involved:** [PatientIntakeModal.tsx](file:///f:/SAAS/components/patients/PatientIntakeModal.tsx#L155-L158)
- **Recommended direction:** Replace browser `alert()` with inline form field error states using standard accessible form controls.

---

### Test 1.3: Missing Phone Number
- **Expected behavior:** Form prevents submission and clearly indicates that a primary contact phone number is mandatory.
- **Current behavior:** Blocked at submission via `!phone.trim()` check; triggers native browser `alert()`. In `EditPatientModal.tsx`, empty submit silently does nothing (`if (!fullName.trim() || !phone.trim()) return;`).
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** LOW
- **Files involved:** [PatientIntakeModal.tsx](file:///f:/SAAS/components/patients/PatientIntakeModal.tsx#L155), [EditPatientModal.tsx](file:///f:/SAAS/components/patients/EditPatientModal.tsx#L36)
- **Recommended direction:** Implement consistent inline validation with clear visual feedback across both intake and edit modals.

---

### Test 1.4: Invalid Phone Number Format (Egyptian Mobile Standards)
- **Expected behavior:** System validates Egyptian mobile structure (`010`, `011`, `012`, `015` prefix, exactly 11 digits, or international `+20` format) and rejects alphanumeric characters or invalid lengths.
- **Current behavior:** System performs zero format or regex validation. Any arbitrary string with at least 1 character (e.g., `"123"`, `"abc"`, `"000"`) is accepted and saved as a valid phone number.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** MEDIUM
- **Files involved:** [PatientIntakeModal.tsx](file:///f:/SAAS/components/patients/PatientIntakeModal.tsx#L155), [EditPatientModal.tsx](file:///f:/SAAS/components/patients/EditPatientModal.tsx#L106-L111)
- **Recommended direction:** Introduce a regex validator enforcing Egyptian telecoms standards (`/^(\+20|0)?1[0125][0-9]{8}$/`).

---

### Test 1.5: Duplicate Phone Number Registration
- **Expected behavior:** System checks if the phone number is already registered to an existing patient file and alerts the receptionist with existing file details.
- **Current behavior:** `PatientIntakeModal` checks `p.phone.replace(/\D/g, '').endsWith(normalizedInputPhone.slice(-8))`. If detected, it displays a native browser `confirm()` prompt. If the receptionist clicks "OK", the duplicate patient is created regardless, resulting in multiple active records sharing the exact same phone number. `EditPatientModal` has no duplicate detection whatsoever.
- **Evidence:** CODE VERIFIED
- **Result:** BUSINESS DECISION REQUIRED
- **Severity:** MEDIUM
- **Files involved:** [PatientIntakeModal.tsx](file:///f:/SAAS/components/patients/PatientIntakeModal.tsx#L65-L77), [PatientIntakeModal.tsx](file:///f:/SAAS/components/patients/PatientIntakeModal.tsx#L161-L168)
- **Recommended direction:** Define clinic policy: determine whether family members sharing a phone number is permitted, or if phone must be a strictly unique database key with merged patient accounts.

---

### Test 1.6: Duplicate or Similar Patient Name
- **Expected behavior:** System detects exact and phonetically or orthographically similar names (e.g., Arabic prefixes like "أحمد" vs "احمد", "عبد الرحمن" vs "عبدالرحمن") to prevent fractured patient histories.
- **Current behavior:** Performs only an exact trimmed lowercase match (`p.fullName.trim().toLowerCase() === normalizedInputName`). Does not normalize Arabic Alef/Yaa/Ta-Marbuta or detect partial matches. If matched, it allows bypass via browser `confirm()`.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** MEDIUM
- **Files involved:** [PatientIntakeModal.tsx](file:///f:/SAAS/components/patients/PatientIntakeModal.tsx#L69-L77)
- **Recommended direction:** Add Arabic text normalization utility (normalizing `أ, إ, آ` → `ا` and `ة` → `ه`) and fuzzy name matching before registration.

---

### Test 1.7: Editing a Patient Profile
- **Expected behavior:** Receptionist can edit administrative demographics (name, phone, WhatsApp, payment type, age, gender) while clinical fields (primary diagnosis) require clinical authority.
- **Current behavior:** `EditPatientModal` allows the receptionist to edit full name, phone, WhatsApp, age, gender, status, and referring doctor. However, `EditPatientModal` also exposes `primaryDiagnosis` as an unrestricted editable text field for any user (receptionist included), directly contradicting the clinical privacy masking in `PatientDirectory`.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [EditPatientModal.tsx](file:///f:/SAAS/components/patients/EditPatientModal.tsx#L27-L50), [PatientDirectory.tsx](file:///f:/SAAS/components/patients/PatientDirectory.tsx#L489-L494)
- **Recommended direction:** Restrict diagnosis field editing in `EditPatientModal` when `currentRole === 'receptionist'`, aligning with `PatientDirectory` restrictions.

---

### Test 1.8: Very Long Patient Name Handling
- **Expected behavior:** Inputs enforce reasonable character limits (e.g., max 100 characters) and UI truncates safely without breaking table or card layouts.
- **Current behavior:** No `maxLength` attribute is set on `<input>` in intake or edit modals. A 5,000-character string can be submitted and saved. In `PatientDirectory` and `EventCalendarView`, strings are styled with `truncate`, which prevents CSS layout breakage, but data payload bloats `localStorage`.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** LOW
- **Files involved:** [PatientIntakeModal.tsx](file:///f:/SAAS/components/patients/PatientIntakeModal.tsx#L92-L98), [EditPatientModal.tsx](file:///f:/SAAS/components/patients/EditPatientModal.tsx#L93-L98)
- **Recommended direction:** Add `maxLength={120}` on patient name inputs.

---

### Test 1.9: Very Long Address Handling
- **Expected behavior:** Patient intake captures physical address with structured fields (governorate, district, street) or a bounded multiline text field.
- **Current behavior:** The `Patient` data model in `types/index.ts` does NOT have an `address` property. Neither `PatientIntakeModal` nor `EditPatientModal` contains an address field. Home visit booking instructions or patient addresses must be informally typed into `notes`.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** MEDIUM
- **Files involved:** [types/index.ts](file:///f:/SAAS/types/index.ts#L33-L51), [PatientIntakeModal.tsx](file:///f:/SAAS/components/patients/PatientIntakeModal.tsx#L50-L64)
- **Recommended direction:** Add an optional `address?: string;` field to the `Patient` model and intake forms.

---

### Test 1.10: Searching Patients by Name
- **Expected behavior:** Real-time search instantly filters the patient directory by full or partial name, case-insensitively, supporting Arabic diacritics and prefixes.
- **Current behavior:** `filteredPatients` filters via `patient.fullName.toLowerCase().includes(q)`. Works well for exact substrings, but does not normalize Arabic character variants.
- **Evidence:** CODE VERIFIED
- **Result:** PASS
- **Severity:** NOT APPLICABLE
- **Files involved:** [PatientDirectory.tsx](file:///f:/SAAS/components/patients/PatientDirectory.tsx#L144-L154)
- **Recommended direction:** Enhance search with Arabic normalization helper.

---

### Test 1.11: Searching Patients by Phone Number
- **Expected behavior:** Receptionist can search by typing raw digits (e.g., `01001234567`) and find matching patients regardless of how the phone was formatted during entry.
- **Current behavior:** Filter executes `patient.phone.includes(q)`. If stored phone numbers contain spaces or punctuation (e.g., `+20 100 123 4567` in seed data) and the receptionist types `01001234567`, the search FAILS to match because it does not strip non-digits prior to comparison.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** MEDIUM
- **Files involved:** [PatientDirectory.tsx](file:///f:/SAAS/components/patients/PatientDirectory.tsx#L147)
- **Recommended direction:** Strip non-digits from both query and target phone string before comparison (`patient.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))`).

---

### Test 1.12: Patient with Zero Appointments
- **Expected behavior:** Patient card displays cleanly with "0 appointments / no visits scheduled" and provides an instant "Book Appointment" call to action.
- **Current behavior:** Patient card renders properly in `PatientDirectory` without throwing errors. Active package status and WhatsApp follow-up actions remain accessible.
- **Evidence:** CODE VERIFIED
- **Result:** PASS
- **Severity:** NOT APPLICABLE
- **Files involved:** [PatientDirectory.tsx](file:///f:/SAAS/components/patients/PatientDirectory.tsx#L389-L550)
- **Recommended direction:** No action needed.

---

### Test 1.13: Patient with Many Appointments (Scalability)
- **Expected behavior:** Patient profile displays appointment count badge, handles pagination or lazy loading, and avoids UI lag.
- **Current behavior:** Appointments are not rendered inside the patient card itself (only package counters are rendered). However, because all appointments are loaded into memory and filtered on every render, having hundreds of appointments for a single patient will slow down appointment conflict loops.
- **Evidence:** CODE VERIFIED
- **Result:** PASS
- **Severity:** LOW
- **Files involved:** [PatientDirectory.tsx](file:///f:/SAAS/components/patients/PatientDirectory.tsx#L347-L380)
- **Recommended direction:** Implement pagination when backend database integration is introduced.

---

### Test 1.14: Clearing LocalStorage Risk
- **Expected behavior:** System guards patient records against accidental deletion; clearing browser cookies does not wipe patient health records without explicit administrative confirmation or cloud sync.
- **Current behavior:** If the browser cache/localStorage is cleared by the user, browser privacy extensions, or automated cleaning tools, ALL registered patients are permanently erased. On next reload, the app silently falls back to `seedData.ts` (`INITIAL_PATIENTS`).
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L230-L245)
- **Recommended direction:** Add prominent warnings regarding prototype offline storage; implement automated JSON database backup export reminder.

---

### Test 1.15: LocalStorage Quota Exceeded Handling
- **Expected behavior:** When storage limits are approached or reached, the application detects quota exhaustion, alerts the receptionist, and prevents corrupted partial writes.
- **Current behavior:** `ClinicContext.tsx` wraps `localStorage.setItem` in a `try...catch`, but the error is caught with only `console.error('Failed to sync state to localStorage', e)`. The user receives zero warning or banner. New patients continue to exist in React RAM, leading the receptionist to believe data was saved, but upon browser refresh, all new patients are permanently lost.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L361-L363)
- **Recommended direction:** Catch `QuotaExceededError` explicitly and render a persistent modal warning that local storage is full and data cannot be saved.

---

## 2. Booking Logic & Hard-Coded Rules

### Test 2.1: Normal Booking Workflow
- **Expected behavior:** Receptionist selects patient, doctor, date, time, room, and bed. System checks doctor and bed availability, books the session, and sends doctor notification.
- **Current behavior:** Validates required inputs, checks for conflicting appointments within a 45-minute window, adds appointment with `status: 'scheduled'`, updates `appointments`, and appends a real-time notification to `notifications`.
- **Evidence:** CODE VERIFIED
- **Result:** PASS
- **Severity:** NOT APPLICABLE
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L189-L222), [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L556-L600)
- **Recommended direction:** Maintain current flow.

---

### Test 2.2: Appointment Duration Variation (30, 45, 60, 90, 120 Minutes)
- **Expected behavior:** Receptionist can select the appointment duration based on treatment type (e.g., 30-min ultrasound/electrotherapy, 45-min standard session, 60-min neuro rehab, 90-min comprehensive initial evaluation).
- **Current behavior:** **Duration is strictly hard-coded to 45 minutes.** In [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L209), `duration: 45` is hardcoded on submission. There is no dropdown, input, or configuration allowing selection of 30, 60, 90, or 120 minutes. All conflict algorithms rigidly evaluate `Math.abs(aptMinutes - newMinutes) < 45`.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L139), [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L161), [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L209)
- **Recommended direction:** Add a duration selector (`[30, 45, 60, 90, 120]` minutes) and dynamic overlap calculation: `newStart < existingEnd && newEnd > existingStart`.

---

### Test 2.3: Price Changing by Duration
- **Expected behavior:** Changing duration dynamically calculates the session fee based on clinic pricing tiers.
- **Current behavior:** The `Appointment` model has no `price` or `fee` property. Pricing exists only in `clinic.pricingConfig` and `TreatmentPackage`. Session duration has zero pricing logic attached.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [types/index.ts](file:///f:/SAAS/types/index.ts#L109-L131), [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L203-L215)
- **Recommended direction:** Add session price field to `Appointment` linked to duration and treatment category.

---

### Test 2.4: Booking an Inactive Doctor
- **Expected behavior:** System blocks booking appointments with inactive, suspended, or archived doctors.
- **Current behavior:** The `User` model has no `isActive` or `status` property. Every user in the database is permanently available in the doctor dropdown selector regardless of employment status.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** MEDIUM
- **Files involved:** [types/index.ts](file:///f:/SAAS/types/index.ts#L3-L15), [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L47-L57)
- **Recommended direction:** Add `isActive: boolean` to `User` interface and filter `users.filter(u => u.isActive && ...)`.

---

### Test 2.5: Booking Outside Doctor Working Schedule
- **Expected behavior:** Doctors have defined weekly shifts (e.g., 10:00 to 18:00); booking outside shifts triggers a warning or blocks selection.
- **Current behavior:** Users have no working shift or schedule model. Any doctor can be booked at 02:00 AM or 11:00 PM without warnings.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [types/index.ts](file:///f:/SAAS/types/index.ts#L3-L15), [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L104-L184)
- **Recommended direction:** Create a `DoctorShift` schema defining working days and hours per practitioner.

---

### Test 2.6: Booking on a Doctor's Day Off or Leave/Absence
- **Expected behavior:** System checks doctor's off-days and approved leaves, warning the receptionist if the doctor is absent.
- **Current behavior:** No day-off or leave model exists. Doctors can be booked on weekends, national holidays, or periods of sickness/leave.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** MEDIUM
- **Files involved:** [types/index.ts](file:///f:/SAAS/types/index.ts#L3-L15)
- **Recommended direction:** Introduce a leave tracking table and validate during booking.

---

### Test 2.7: Booking When Clinic is Closed
- **Expected behavior:** Form restricts time input to operating hours (e.g., 09:00 to 21:00).
- **Current behavior:** The `<input type="time" ... />` has no `min` or `max` attributes. Appointments can be scheduled at any hour outside clinic hours.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** LOW
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L390-L400)
- **Recommended direction:** Set `min="09:00"` and `max="21:00"` based on `clinic.workingHours`.

---

### Test 2.8: Booking the Same Doctor Twice at Overlapping Times
- **Expected behavior:** System strictly prevents booking doctor A with two different patients simultaneously.
- **Current behavior:** In `BookAppointmentModal`, overlapping bookings within 45 minutes are flagged with `⚠️ Scheduling Conflict: Dr. X is already booked...` and the confirm button is disabled. **However, in calendar drag-and-drop, this check is completely bypassed, allowing silent double-booking.**
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L132-L148), [EventCalendarView.tsx](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L360-L369)
- **Recommended direction:** Move conflict validation inside `rescheduleAppointment` in `ClinicContext.tsx` so all channels enforce the same rules.

---

### Test 2.9: Booking the Same Room or Bed Twice
- **Expected behavior:** Bed 1 in Room 1 cannot be occupied by two patients at the same time.
- **Current behavior:** In `BookAppointmentModal`, `bedConflict` checks matching `bedNumber` within 45 minutes and disables submission. In calendar drag-and-drop, it is bypassed.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L164-L173), [EventCalendarView.tsx](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L360-L369)
- **Recommended direction:** Enforce bed conflict validation within `ClinicContext.rescheduleAppointment`.

---

### Test 2.10: Booking Different Doctors in the Same Bed
- **Expected behavior:** Two doctors cannot treat two different patients in the exact same bed at the same time.
- **Current behavior:** `BookAppointmentModal` checks `roomApts` for `bedConflict` regardless of `physioId`. If another doctor has that bed, it reports `⚠️ Bed Occupied`. Passes in modal, bypassed in calendar drag-and-drop.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L164-L173)
- **Recommended direction:** Centralize bed reservation checks at context state level.

---

### Test 2.11: Booking with a Preferred Doctor & Suggesting Alternatives
- **Expected behavior:** Selecting a patient pre-selects their assigned/preferred physiotherapist. If that doctor is unavailable, system suggests next available practitioners.
- **Current behavior:** Modal initializes `physioId` to the first doctor in `users` array, ignoring `patient.assignedPhysioId`. If the selected doctor is booked, it displays an error banner but offers no alternative doctor suggestion.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** MEDIUM
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L59-L67), [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L142-L148)
- **Recommended direction:** When patient is selected, auto-populate `setPhysioId(patient.assignedPhysioId)`. Display chips of available alternative doctors during conflicts.

---

### Test 2.12: Initial Assessment by Qualified vs. Non-Qualified Doctor
- **Expected behavior:** Initial consultant evaluations (`consultant_assessment`) can only be booked with senior certified consultants/admins, not junior trainees or interns.
- **Current behavior:** Selecting `consultant_assessment` defaults `physioId` to `user-01` (admin), but the doctor dropdown remains completely open to ANY physiotherapist, permitting receptionists to book consultant evaluations with junior staff.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** MEDIUM
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L69-L82), [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L355-L375)
- **Recommended direction:** Filter doctor dropdown options strictly to qualified consultant roles when `sessionCategory === 'consultant_assessment'`.

---

### Test 2.13: Treatment Booking Without Prior Assessment
- **Expected behavior:** System alerts the receptionist if a new patient has had no initial assessment before booking standard physiotherapy rehabilitation.
- **Current behavior:** System allows booking standard physiotherapy sessions immediately for any patient, even if they have had zero prior assessments or medical notes.
- **Evidence:** CODE VERIFIED
- **Result:** BUSINESS DECISION REQUIRED
- **Severity:** MEDIUM
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L104-L184)
- **Recommended direction:** Define clinic business policy: decide whether an assessment is a strict system prerequisite or an advisory warning.

---

### Test 2.14: Assessment and Treatment on the Same Day / Back-to-Back
- **Expected behavior:** A patient arriving from far away can have their initial evaluation followed immediately by their first treatment session on the same day.
- **Current behavior:** **COMPLETELY BLOCKED BY SYSTEM LOGIC.** In [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L112-L130) and [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L558-L564), the single daily reservation rule checks:
  ```typescript
  const isNutA = a.sessionType === 'nutrition';
  const isNutB = data.sessionType === 'nutrition';
  return isNutA === isNutB;
  ```
  Because both `consultant_assessment` and `physiotherapy` have `sessionType !== 'nutrition'`, `isNutA === false` and `isNutB === false`, evaluating to `true`. The system throws: `⚠️ Daily Limit: Patient already has a Physiotherapy session booked on this date. Only 1 Physio and 1 Nutrition session allowed per day.` Receptionist CANNOT schedule evaluation and treatment on the same day.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L112-L130), [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L558-L564)
- **Recommended direction:** Refine rule to allow 1 assessment AND 1 therapy session on the same date: `(isAssessmentA && isAssessmentB) || (isTherapyA && isTherapyB)`.

---

### Test 2.15: Double-Clicking the Booking Confirm Button
- **Expected behavior:** Button disables immediately on first click to prevent duplicate submissions while saving.
- **Current behavior:** Button is disabled only when `currentConflict` exists. It has no `isSubmitting` guard. While `addAppointment` checks for duplicate sessions, rapid double-clicks can queue state updates before React renders the updated list.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** LOW
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L506-L516)
- **Recommended direction:** Introduce `isSubmitting` state that immediately disables the confirm button upon click.

---

### Hard-Coded Rules Inventory
1. **Appointment Duration:** Fixed at **45 minutes** in `BookAppointmentModal.tsx` (line 209) and calendar drag-and-drop.
2. **Pricing Structure:** Fixed rates in `seedData.ts`:
   - Single session: `450 EGP`
   - Initial evaluation: `600 EGP`
   - Home visit: `850 EGP`
   - Package volume discounts: `8 sessions: 10%`, `12 sessions: 15%`, `16 sessions: 20%`.
3. **Daily Reservation Limits:** Max 1 physio session and 1 nutrition session per patient per day (`BookAppointmentModal.tsx` line 122).
4. **Clinic Hours:** Assumed `09:00 to 21:00` in UI display headers, but not enforced in input boundaries.
5. **Fixed Rooms:** 4 predefined physical rooms hardcoded in `seedData.ts` (`Room 1`, `Room 2`, `Room 3`, `Gym`).

---

## 3. Appointment Selection & Front Desk Actions

### Test 3.1: Clicking an Appointment Card on Receptionist Calendar
- **Expected behavior:** Clicking an appointment card opens an action menu or drawer with options: View Details, Check-In, Reschedule, Cancel, Mark No-Show, Complete Session, Record Payment, Send WhatsApp.
- **Current behavior:** **COMPLETELY DEAD / NO ACTION.** In [ReceptionistOverview.tsx](file:///f:/SAAS/components/dashboard/ReceptionistOverview.tsx#L222-L226), `<EventCalendarView />` is rendered without passing the `onSelectAppointment` prop. In [EventCalendarView.tsx](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L646), the card click handler calls `onClick={() => onSelectAppointment?.(appt)}`. Because the prop is undefined, clicking any appointment card in the receptionist dashboard does absolutely nothing.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** CRITICAL
- **Files involved:** [ReceptionistOverview.tsx](file:///f:/SAAS/components/dashboard/ReceptionistOverview.tsx#L222-L226), [EventCalendarView.tsx](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L646)
- **Recommended direction:** Pass `onSelectAppointment={(apt) => handleOpenAppointmentActions(apt)}` to `<EventCalendarView />` in `ReceptionistOverview.tsx`.

---

### Test 3.2: Opening Appointment Details
- **Expected behavior:** Receptionist can view patient summary, doctor, treatment type, scheduled time, delay history, and package balance.
- **Current behavior:** No appointment details drawer or popover is wired to the calendar. Clicking cards has no effect.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [ReceptionistOverview.tsx](file:///f:/SAAS/components/dashboard/ReceptionistOverview.tsx#L222-L226)
- **Recommended direction:** Implement an appointment quick-view popover.

---

### Test 3.3: Patient Arrival Check-In Action
- **Expected behavior:** Receptionist clicks a "Check In" button when a patient walks into the clinic. System marks status as "Arrived / In Waiting", records arrival timestamp, calculates late/early minutes, and alerts the doctor.
- **Current behavior:** **UNREACHABLE DEAD CODE.** While `ClinicContext.tsx` contains a `checkInAppointment(id)` function (lines 696–778), **there is NOT A SINGLE BUTTON, MENU, OR ICON IN THE ENTIRE UI THAT CALLS THIS FUNCTION.** Grep across all components confirms 0 usages. Furthermore, inside `checkInAppointment`, the code sets `status: 'completed'` and immediately deducts a package session upon check-in, long before doctor treatment.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** CRITICAL
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L696-L748), [EventCalendarView.tsx](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L632-L680)
- **Recommended direction:** Add an explicit "Check In" button to appointment cards; update status to `'arrived'` (do NOT mark as `'completed'` or deduct sessions upon check-in).

---

### Test 3.4: Duplicate Check-In Prevention
- **Expected behavior:** If already checked in, the check-in button is disabled and displays "Checked In at HH:MM".
- **Current behavior:** Because no UI calls `checkInAppointment`, this cannot be triggered from the interface. At code level, calling `checkInAppointment` twice would overwrite `arrivedAt` with the current time.
- **Evidence:** CODE VERIFIED
- **Result:** NOT VERIFIED
- **Severity:** LOW
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L696-L730)
- **Recommended direction:** Guard against duplicate check-in at state level.

---

### Test 3.5: Rescheduling an Appointment via Modal
- **Expected behavior:** Receptionist opens Reschedule Modal, selects new date/time/room, and updates the booking.
- **Current behavior:** `RescheduleAppointmentModal` is imported and rendered in `ReceptionistOverview.tsx` (lines 237–242) controlled by `selectedRescheduleApt`. However, because `selectedRescheduleApt` can only be set from appointment selection (which is dead), **this modal is 100% UNREACHABLE from the front desk UI.**
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** CRITICAL
- **Files involved:** [ReceptionistOverview.tsx](file:///f:/SAAS/components/dashboard/ReceptionistOverview.tsx#L237-L242)
- **Recommended direction:** Wire appointment card click to set `selectedRescheduleApt`.

---

### Test 3.6: Appointment Cancellation from Front Desk
- **Expected behavior:** Receptionist can cancel an appointment, capture a cancellation reason, and free the slot.
- **Current behavior:** There is no cancellation modal or context menu on calendar appointment cards. Cancellation can only be performed if an appointment is opened in a modal that triggers `updateAppointmentStatus(id, 'cancelled')`. Unreachable from calendar.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [EventCalendarView.tsx](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L632-L680), [ReceptionistOverview.tsx](file:///f:/SAAS/components/dashboard/ReceptionistOverview.tsx#L220-L245)
- **Recommended direction:** Add a "Cancel Appointment" action to the appointment card menu with reason prompt.

---

### Test 3.7: Marking an Appointment as No-Show
- **Expected behavior:** Receptionist marks an unexcused absence as "No-Show", freeing the resource and logging the event.
- **Current behavior:** No UI button or trigger exists on the calendar to mark an appointment as `no-show`. The function `updateAppointmentStatus(id, 'no-show')` exists in `ClinicContext` but is never triggered from the calendar.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L602-L660)
- **Recommended direction:** Add a "Mark No-Show" button on the appointment popover.

---

### Test 3.8: Completing a Clinical Session from Front Desk
- **Expected behavior:** Completing clinical sessions should be reserved for doctors/physiotherapists documenting SOAP notes, not front desk receptionists.
- **Current behavior:** In `ReceptionistOverview.tsx` (lines 228–235), `CompleteSessionModal` is rendered and passed to `EventCalendarView.onPromptCompleteSession`. This modal prompts for clinical doctor notes, home exercises, and pain score. Allowing receptionists to document doctor clinical notes violates medical chart segregation.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [ReceptionistOverview.tsx](file:///f:/SAAS/components/dashboard/ReceptionistOverview.tsx#L228-L235), [CompleteSessionModal.tsx](file:///f:/SAAS/components/appointments/CompleteSessionModal.tsx#L20-L80)
- **Recommended direction:** Restrict `CompleteSessionModal` to `physiotherapist` and `admin` roles; front desk should only record checkout and billing.

---

### Test 3.9: Recording Payment from Front Desk
- **Expected behavior:** Receptionist can click an appointment to collect the session fee or package installment and attach a payment slip.
- **Current behavior:** In `ReceptionistOverview.tsx`, `<RecordPaymentModal />` is rendered with `packageItem={selectedPaymentPackage}` (lines 244–249). However, `selectedPaymentPackage` is never set from any calendar click. It can only be triggered from `PatientDirectory` if the patient has an active package. Single-session payments cannot be recorded.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [ReceptionistOverview.tsx](file:///f:/SAAS/components/dashboard/ReceptionistOverview.tsx#L244-L249), [PatientDirectory.tsx](file:///f:/SAAS/components/patients/PatientDirectory.tsx#L685-L695)
- **Recommended direction:** Add direct "Collect Payment" trigger to appointment cards and allow single-session payments.

---

### Test 3.10: Opening WhatsApp Reminder from Front Desk
- **Expected behavior:** Clicking WhatsApp icon opens the pre-filled message modal or WhatsApp Web directly.
- **Current behavior:** `WhatsAppEditModal` is rendered in `ReceptionistOverview.tsx` (lines 259–266), but no calendar action sets `waModalState.isOpen = true`. Completely unreachable from the calendar view.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [ReceptionistOverview.tsx](file:///f:/SAAS/components/dashboard/ReceptionistOverview.tsx#L259-L266)
- **Recommended direction:** Add a WhatsApp icon button onto appointment cards in `EventCalendarView`.

---

### Unreachable Modals & Actions in Receptionist Dashboard
1. **[RescheduleAppointmentModal.tsx](file:///f:/SAAS/components/appointments/RescheduleAppointmentModal.tsx)**: Rendered in `ReceptionistOverview.tsx:238`, but state setter is never invoked.
2. **[RecordPaymentModal.tsx](file:///f:/SAAS/components/billing/RecordPaymentModal.tsx)**: Rendered in `ReceptionistOverview.tsx:245`, state setter never invoked from calendar.
3. **[WhatsAppEditModal.tsx](file:///f:/SAAS/components/common/WhatsAppEditModal.tsx)**: Rendered in `ReceptionistOverview.tsx:260`, state setter never invoked from calendar.
4. **`checkInAppointment(id)`**: Defined in `ClinicContext.tsx:696`, has zero caller components anywhere in the codebase.

---

## 4. Status Lifecycle & State Transitions

### Data Model Statuses
Supported values in `AppointmentStatus` ([types/index.ts](file:///f:/SAAS/types/index.ts#L97)):
- `'scheduled'`
- `'completed'`
- `'cancelled'`
- `'no-show'`

*(Note: There is NO `'arrived'`, `'checked_in'`, `'waiting'`, or `'in_treatment'` status).*

---

### Status Transition Matrix
| Current Status | Target Status | Permitted in Clinic Workflow? | Handled in Code? | Package Session Impact | Missing Control / Dangerous Transition Risk |
|---|---|---|---|---|---|
| `scheduled` | `arrived` / `checked_in` | YES | NO (Status doesn't exist) | N/A | Status does not exist in data model. `checkInAppointment` sets `completed`. |
| `scheduled` | `completed` | ONLY AFTER TREATMENT | YES (Directly via `checkIn` or modal) | Deducts 1 session | **Dangerous:** Check-in marks session as complete before patient even sees doctor. |
| `scheduled` | `cancelled` | YES | YES (`updateAppointmentStatus`) | None | No cancellation reason captured; audit log missing. |
| `scheduled` | `no-show` | YES | YES (`updateAppointmentStatus`) | None | No penalty/charge policy evaluated. |
| `completed` | `scheduled` | RESTRICTED (Admin only) | YES (Unrestricted) | **INCONSISTENT:** `updateAppointmentStatus` refunds session; `rescheduleAppointment` resets to `scheduled` WITHOUT refunding! | **Dangerous:** Ordinary users can revert completed sessions. Inconsistent package refunds. |
| `completed` | `cancelled` | RESTRICTED (Admin only) | YES (Unrestricted) | Refunds 1 session | Does not check if package was already expired or billed. |
| `completed` | `no-show` | INVALID | YES (Unrestricted) | Refunds 1 session | An appointment that already happened can be marked as absent. |
| `cancelled` | `scheduled` | YES (Reactivation) | YES (Unrestricted) | None | Re-activates without re-checking doctor or room conflicts. |
| `cancelled` | `completed` | INVALID | YES (Unrestricted) | Deducts 1 session | Cancelled appointment can be marked completed directly. |
| `no-show` | `completed` | INVALID | YES (Unrestricted) | Deducts 1 session | Absent patient can be directly marked completed. |

---

### Key Findings on State Transitions
1. **Invalid Transitions Fully Unenforced:** `updateAppointmentStatus` ([ClinicContext.tsx:602-622](file:///f:/SAAS/context/ClinicContext.tsx#L602-L622)) contains zero state machine logic. Any appointment can transition from any status to any other status without role or state verification.
2. **Completed Reversion Flaw:** If an appointment was `completed`, changing it to `scheduled` or `no-show` automatically refunds 1 session to the package. However, if rescheduled via `rescheduleAppointment`, the status is overwritten to `'scheduled'` WITHOUT refunding the package session.

---

## 5. Rescheduling Logic

### Test 5.1: Rescheduling to a Free Time Slot
- **Expected behavior:** Appointment moves to the new time slot; doctor, room, and patient remain updated; notification sent.
- **Current behavior:** When dragged or updated via `rescheduleAppointment`, `startTime`, `date`, `roomOrBed`, `roomId`, and `bedNumber` are updated, and notification is sent to `notifications`.
- **Evidence:** CODE VERIFIED
- **Result:** PASS
- **Severity:** NOT APPLICABLE
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L782-L830)
- **Recommended direction:** Maintain current update structure.

---

### Test 5.2: Rescheduling to an Occupied Time Slot (Conflict Bypass)
- **Expected behavior:** System checks doctor schedule, room capacity, and bed occupancy; prevents dropping onto an occupied slot.
- **Current behavior:** **ZERO AVAILABILITY CHECKS.** In [EventCalendarView.tsx:362](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L362), dropping an appointment card directly calls `rescheduleAppointment(...)`. In `ClinicContext.tsx`, `rescheduleAppointment` contains no validation. Receptionists can drop an appointment onto a slot where the doctor is already treating another patient or the bed is already occupied, creating silent double-bookings.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** CRITICAL
- **Files involved:** [EventCalendarView.tsx](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L360-L369), [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L782-L811)
- **Recommended direction:** Integrate `checkSchedulingConflict` before applying `rescheduleAppointment`. Revert drag action if conflict is detected.

---

### Test 5.3: Changing Doctor During Reschedule
- **Expected behavior:** Reschedule allows changing the assigned doctor while verifying new doctor availability.
- **Current behavior:** In `RescheduleAppointmentModal.tsx`, the receptionist can change doctor, date, time, and room. It checks conflicts in the modal form. However, as noted in Test 3.5, this modal is unreachable from the front desk calendar.
- **Evidence:** CODE VERIFIED
- **Result:** PASS (in modal) / FAIL (unreachable from calendar)
- **Severity:** HIGH
- **Files involved:** [RescheduleAppointmentModal.tsx](file:///f:/SAAS/components/appointments/RescheduleAppointmentModal.tsx#L190-L240)
- **Recommended direction:** Connect calendar cards to open `RescheduleAppointmentModal`.

---

### Test 5.4: Rescheduling a Cancelled or Completed Appointment
- **Expected behavior:** System blocks dragging or rescheduling past completed appointments.
- **Current behavior:** Completed appointment cards on the calendar retain the `draggable` attribute. A receptionist can drag a completed appointment from yesterday into a new slot today. It updates the appointment time and resets `status: 'scheduled'`. The package deduction from the prior completion is NOT refunded, but upon completing it again, a second session will be deducted.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** CRITICAL
- **Files involved:** [EventCalendarView.tsx](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L635-L646), [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L806)
- **Recommended direction:** Disable `draggable={appt.status === 'scheduled'}` so completed and cancelled appointments cannot be dragged.

---

### Test 5.5: Preserving Original Appointment History
- **Expected behavior:** Rescheduling retains an audit trail of previous times, dates, and rescheduling reasons.
- **Current behavior:** Overwrites `startTime`, `date`, and `roomOrBed` in place. No previous history array (`rescheduleHistory`) exists on the `Appointment` object. The original scheduled time is permanently lost.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** MEDIUM
- **Files involved:** [types/index.ts](file:///f:/SAAS/types/index.ts#L109-L131), [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L797-L810)
- **Recommended direction:** Add `history?: Array<{ changedAt: string; previousDate: string; previousTime: string; reason?: string }>` to `Appointment`.

---

## 6. Cancellation, No-Show and Waitlist (CRITICAL)

### Trace: Exact Code Path When Moving an Appointment to the Waitlist
When a receptionist drags an appointment card and drops it onto the Unscheduled Waitlist container:

```
1. User drags appointment card: onDragStart in EventCalendarView.tsx (lines 636-644)
   -> sets e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'appointment', id: appt.id, ... }))
2. User drops on waitlist: handleDropOnWaitlist in EventCalendarView.tsx (lines 398-417)
   -> parses JSON payload: payload.type === 'appointment'
   -> finds appointment: const appt = appointments.find((a) => a.id === payload.id)
   -> updates patient: updatePatient(appt.patientId, { assignedPhysioId: appt.physioId })
   -> EXECUTES: deleteAppointment(payload.id)
3. deleteAppointment executed in ClinicContext.tsx (lines 832-834):
   -> setAppointments((prev) => prev.filter((a) => a.id !== id))
   -> Appointment is completely filtered out of memory.
```

---

### Questions Answered:
- **Is the appointment deleted?**
  **YES.** `deleteAppointment(payload.id)` executes `.filter((a) => a.id !== id)`. The record is permanently eradicated.
- **Is its status changed?**
  **NO.** It is NOT marked with a status like `'waitlist'` or `'unscheduled'`. It is deleted.
- **Is historical information lost?**
  **YES. COMPLETE DATA DESTRUCTION.** The appointment ID, scheduled date, original time, arrival time, delay/early minutes, room/bed assignment, doctor notes (`doctorNotes`), SOAP notes (`soapNotes`), pain score (`painScore`), attachments (`attachments`), and home exercises (`homeExercises`) are completely destroyed.
- **Is payment information affected?**
  **YES, ORPHANED.** If the session was previously marked completed, the package session that was deducted is NOT refunded. The package completed counter remains incremented, but the appointment record that justified the treatment no longer exists.
- **Can the operation be reversed?**
  **NO.** There is no undo function, no soft-delete, and no audit trail.
- **Classification:** **CRITICAL LOGIC DEFECT.**

---

### Test 6.2: Cancellation & No-Show Slots Becoming Free
- **Expected behavior:** When an appointment is cancelled or marked no-show, the time slot immediately becomes bookable for other patients.
- **Current behavior:** In `BookAppointmentModal.tsx` (lines 115, 134, 153), conflicts filter out `apt.status === 'cancelled' || apt.status === 'no-show'`. Cancelled and no-show slots correctly become available for new bookings.
- **Evidence:** CODE VERIFIED
- **Result:** PASS
- **Severity:** NOT APPLICABLE
- **Files involved:** [BookAppointmentModal.tsx](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L115)
- **Recommended direction:** Maintain current availability liberation.

---

### Test 6.3: Recording Cancellation / No-Show Reason
- **Expected behavior:** System prompts the receptionist for a reason (e.g., patient emergency, transportation issue, illness, late cancellation) for clinic KPI tracking.
- **Current behavior:** No cancellation reason prompt or field exists. `Appointment` interface has no `cancellationReason` property.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** MEDIUM
- **Files involved:** [types/index.ts](file:///f:/SAAS/types/index.ts#L109-L131), [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L602-L620)
- **Recommended direction:** Add `cancellationReason?: string;` to `Appointment` model.

---

### Test 6.4: Enforcing Clinic No-Show Policy
- **Expected behavior:** Clinic policy defines whether no-shows without 24h notice deduct a package session or charge a fee.
- **Current behavior:** Marking `no-show` has zero policy enforcement. If marked no-show from `scheduled`, no session is deducted. If marked no-show from `completed`, it actually REFUNDS the session.
- **Evidence:** CODE VERIFIED
- **Result:** BUSINESS DECISION REQUIRED
- **Severity:** HIGH
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L643-L660)
- **Recommended direction:** Establish clinic policy: decide whether late cancellations (< 24h) and no-shows consume a package session or forfeit a deposit.

---

## 7. Payments, Receipts, and Financial Balances

### Test 7.1: Package Payment Collection
- **Expected behavior:** Receptionist records full or partial package payment, chooses payment method, attaches transfer receipt image, and issues receipt.
- **Current behavior:** `RecordPaymentModal` captures amount, payment method (`instapay`, `vodafone_cash`, `fawry`, `cash`, `visa`), compresses image to WebP, creates `PaymentReceipt`, updates `amountPaid` and `balanceDue`.
- **Evidence:** CODE VERIFIED
- **Result:** PASS
- **Severity:** NOT APPLICABLE
- **Files involved:** [RecordPaymentModal.tsx](file:///f:/SAAS/components/billing/RecordPaymentModal.tsx#L96-L108), [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L507-L553)
- **Recommended direction:** Maintain current core flow.

---

### Test 7.2: Single-Session, Initial Assessment, and Diet Payments
- **Expected behavior:** Receptionist can collect payment for a single consultation, initial assessment, or diet visit for patients who do not purchase a package.
- **Current behavior:** **IMPOSSIBLE IN CURRENT ARCHITECTURE.** The payment modal (`RecordPaymentModal.tsx`) strictly requires a `packageItem: TreatmentPackage`. If `!packageItem`, it returns `null` and cannot render. There is NO functionality to bill or record payments for standalone sessions, assessments, or diet visits. Every financial transaction is forced to be a package.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [RecordPaymentModal.tsx](file:///f:/SAAS/components/billing/RecordPaymentModal.tsx#L27-L55), [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L507-L553)
- **Recommended direction:** Create an `Invoice` / `SinglePaymentModal` allowing payments linked directly to an `Appointment` or patient balance without requiring a package.

---

### Test 7.3: Zero, Negative, or Non-Numeric Payments
- **Expected behavior:** System rejects zero, negative numbers, or non-numeric inputs.
- **Current behavior:** In `RecordPaymentModal.tsx`, `handleSavePayment` checks `if (!amount || amount <= 0) return;`. Rejects non-numeric, zero, and negative inputs.
- **Evidence:** CODE VERIFIED
- **Result:** PASS
- **Severity:** NOT APPLICABLE
- **Files involved:** [RecordPaymentModal.tsx](file:///f:/SAAS/components/billing/RecordPaymentModal.tsx#L89-L94)
- **Recommended direction:** Maintain validation.

---

### Test 7.4: Overpayment Handling (Payment Greater than Balance Due)
- **Expected behavior:** If a patient pays more than the outstanding balance, system prevents excess payment or credits the difference to the patient's account as credit balance.
- **Current behavior:** In [ClinicContext.tsx:517-518](file:///f:/SAAS/context/ClinicContext.tsx#L517-L518):
  ```typescript
  const newAmountPaid = pkg.amountPaid + amount;
  const newBalanceDue = Math.max(0, pkg.totalPrice - newAmountPaid);
  ```
  If a patient owes `500 EGP` and pays `1,000 EGP`, `newAmountPaid` becomes `pkg.totalPrice + 500`, and `newBalanceDue` is clamped to `0`. **The excess 500 EGP is absorbed silently.** No patient credit balance is created, and the clinic's package ledger shows `amountPaid > totalPrice` with no record of clinic liability to the patient.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L517-L523)
- **Recommended direction:** Block payments exceeding `balanceDue` unless explicitly depositing to a `patientCredit` balance entity.

---

### Test 7.5: Receipt Numbering & Collision Risk
- **Expected behavior:** Receipts have sequential, tamper-proof, auditable invoice numbers (e.g., `INV-2026-0001`).
- **Current behavior:** In [ClinicContext.tsx:525](file:///f:/SAAS/context/ClinicContext.tsx#L525), receipt ID is generated as:
  ```typescript
  id: `rcpt-${Date.now().toString().slice(-6)}`
  ```
  Taking only the last 6 digits of milliseconds causes collisions every 16.6 minutes and produces non-sequential numbers that fail fiscal accounting standards.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** MEDIUM
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L524-L536)
- **Recommended direction:** Implement sequential numbering (`INV-YYYY-XXXXX`).

---

### Test 7.6: Payment Editing, Voiding, and Corrections
- **Expected behavior:** If a receptionist enters 4,500 EGP instead of 450 EGP, authorized users can void or issue a refund correction with audit notes.
- **Current behavior:** There are NO functions to edit, void, or delete payment receipts in `ClinicContext.tsx`. Recorded payments are permanent in the UI and can only be altered by opening browser DevTools and editing raw JSON in `localStorage`.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L507-L553)
- **Recommended direction:** Add `voidPaymentReceipt(receiptId, reason)` with admin role restriction and audit logging.

---

### Financial Ledger Drift Analysis
In the current architecture, payment data is redundantly stored across multiple locations:
1. `TreatmentPackage.amountPaid` (stored scalar number)
2. `TreatmentPackage.balanceDue` (stored scalar number)
3. `TreatmentPackage.receipts` (nested array)
4. `paymentReceipts` (global context array in `STORAGE_KEYS.RECEIPTS`)

**Drift Proven:** `TreatmentPackage.amountPaid` is NOT derived dynamically by summing `receipts.reduce((sum, r) => sum + r.amount, 0)`. If a receipt is added, deleted, or corrupted, the package total and the receipt ledger diverge permanently with zero automated reconciliation.

---

## 8. Clinical Access vs. Receptionist Permissions

### Privacy Policy vs. Implementation Contradiction Matrix
| Clinical Data Item | Intended Receptionist Access | Current UI Implementation | Vulnerability / Contradiction |
|---|---|---|---|
| **Primary Medical Diagnosis** | Restricted to medical staff | Masked in `PatientDirectory` (`🔒 Restricted`) | **Leaked in plain text** in: 1) `RescheduleAppointmentModal.tsx:124`, 2) `UrgentAlertsModal.tsx:75`, 3) Calendar waitlist drawer, 4) `EditPatientModal.tsx:27` (where receptionist can edit it). |
| **Doctor SOAP Notes** | Medical staff only | Hidden from directory | Stored in unencrypted client state; editable if `CompleteSessionModal` is opened. |
| **Pain Scores (1-10)** | Medical staff only | Not displayed in front desk tables | Editable if receptionist triggers session completion modal. |
| **Medical Documents (X-Rays, MRIs)** | Medical staff / Admin | Receptionist can view and upload scans in `PatientDocumentModal` | No distinction between billing receipts and medical diagnostic radiology. |
| **Diet Notes & InBody Metrics** | Diet Doctor / Admin | Filtered in diet view | Accessible if receptionist switches to Diet tab. |
| **Doctor Treatment Notes** | Medical staff only | Exposed in calendar off-hour indicators | Stored in plain text in appointment objects. |

---

### Summary of Privacy Findings
While the application displays a badge `🔒 Medical Diagnosis Restricted (Medical Staff Only)` in the `PatientDirectory` when logged in as a receptionist, the patient's full clinical diagnosis is simultaneously displayed in plain text in the waitlist drawer, the reschedule modal, the alerts modal, and the edit modal. The masking in the directory is purely cosmetic and does not enforce data privacy.

---

## 9. Audit History & System Accountability

### Audit Coverage by Receptionist Action
| Receptionist Action | System Function | Produces Audit Entry? | Log Action Code | Log Details Recorded |
|---|---|---|---|---|
| Patient Registration | `addPatient` | **NO** | None | None |
| Patient Profile Edit | `updatePatient` | **NO** | None | None |
| Appointment Booking | `addAppointment` | **NO** | None (Only doctor notification) | None |
| Appointment Reschedule | `rescheduleAppointment` | **NO** | None (Only doctor notification) | None |
| Appointment Cancellation | `updateAppointmentStatus` | **NO** | None (Only doctor notification) | None |
| Mark No-Show | `updateAppointmentStatus` | **NO** | None (Only doctor notification) | None |
| Patient Check-In | `checkInAppointment` | **NO** | None (Only doctor notification) | None |
| Collecting Payment | `recordPackagePayment` | **NO** | None | None |
| Uploading Document | `uploadPatientDocument` | **NO** | None | None |
| Deleting Appointment | `deleteAppointment` | **NO** | None | None |
| Logging Cash Expense | `addExpense` | **YES** | `LOG_EXPENSE` | Title and amount |
| Editing Cash Expense | `updateExpense` | **YES** | `EDIT_EXPENSE` | Author and title |
| Exporting Patients CSV | CSV Export Button | **YES** | `EXPORT_PATIENTS` | Count of exported rows |

---

### Audit Security & Tampering
- **Can ordinary users edit or remove audit entries?**
  **YES.** All audit logs are stored in plain text in browser `localStorage.getItem('masaar_audit_logs')`. Any user or receptionist can press F12, open the browser console, and execute:
  ```javascript
  localStorage.removeItem('masaar_audit_logs');
  ```
  or modify the JSON array directly. There is zero cryptographic signing, hashing, or immutability.

---

## 10. Data Persistence, Corruption & Prototype Risks

### Test 10.1: Malformed LocalStorage JSON Recovery
- **Expected behavior:** If one stored entity has a JSON syntax issue, system isolates the corrupted key and preserves all other keys.
- **Current behavior:** In [ClinicContext.tsx:321-325](file:///f:/SAAS/context/ClinicContext.tsx#L321-L325), the initialization is wrapped in a monolithic `try...catch`:
  ```typescript
  } catch (e) {
    console.warn('Failed to parse saved state from localStorage, falling back to seed data', e);
  }
  ```
  If any JSON parsing error occurs, the entire context falls back to `seedData.ts`. On the subsequent render, the auto-sync `useEffect` fires and overwrites ALL keys with seed data, wiping all real patients, appointments, and payments.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L320-L326)
- **Recommended direction:** Isolate `try...catch` blocks per individual storage key.

---

### Test 10.2: LocalStorage 5MB Quota Exceeded by Base64 Files
- **Expected behavior:** Medical scans and payment receipt images are uploaded to object storage (e.g., S3/Cloudinary), storing only URLs in localStorage.
- **Current behavior:** `PatientDocumentModal` and `RecordPaymentModal` convert uploaded images into Base64 strings stored directly inside the `patients` and `paymentReceipts` arrays in `localStorage`. Because browser `localStorage` is capped at approximately 5MB total across all keys, uploading 20 to 30 patient scans will completely exhaust the quota and trigger silent save failures for all subsequent clinic operations.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [PatientDocumentModal.tsx](file:///f:/SAAS/components/patients/PatientDocumentModal.tsx#L40-L75), [RecordPaymentModal.tsx](file:///f:/SAAS/components/billing/RecordPaymentModal.tsx#L60-L87)
- **Recommended direction:** Store images in IndexedDB or cloud storage; do not store Base64 strings in `localStorage`.

---

### Test 10.3: Multi-Tab Concurrency & Desynchronization
- **Expected behavior:** Opening the app in two tabs keeps both tabs in sync using `window.addEventListener('storage', ...)` or BroadcastChannel.
- **Current behavior:** No storage event listener is implemented in `ClinicContext.tsx`. If Receptionist Tab A books an appointment, Tab B has no knowledge of it. When Tab B performs any action, its outdated memory state overwrites Tab A's changes in `localStorage`, leading to silent data loss.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L230-L380)
- **Recommended direction:** Implement a `storage` event listener to synchronize state across open browser tabs.

---

### Test 10.4: System Reset / Purge Function in User Interface
- **Expected behavior:** System reset is restricted to Super Admins behind multi-factor authentication or password confirmation.
- **Current behavior:** In [AppShell.tsx:739](file:///f:/SAAS/components/layout/AppShell.tsx#L739), a "Reset System Data" button calls `resetDemoData()`. In [ClinicContext.tsx:1064-1084](file:///f:/SAAS/context/ClinicContext.tsx#L1064-L1084), `resetDemoData()` executes `localStorage.clear()` and replaces all production data with seed data. It is easily accessible in the UI menu.
- **Evidence:** CODE VERIFIED
- **Result:** FAIL
- **Severity:** HIGH
- **Files involved:** [AppShell.tsx](file:///f:/SAAS/components/layout/AppShell.tsx#L739), [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L1064-L1084)
- **Recommended direction:** Remove `resetDemoData` from production UI or guard behind strict administrative authorization.

---

### Test 10.5: Multi-Device Isolation
- **Expected behavior:** Prototype documentation explicitly warns that data is local to the current browser and cannot sync to other clinic computers without a centralized backend database.
- **Current behavior:** Because data lives strictly in browser `localStorage`, opening the CRM on the doctor's tablet or another receptionist PC shows only the initial seed data. Actions taken on one machine do not reflect on another.
- **Evidence:** CODE VERIFIED
- **Result:** BUSINESS DECISION REQUIRED
- **Severity:** HIGH
- **Files involved:** [ClinicContext.tsx](file:///f:/SAAS/context/ClinicContext.tsx#L350-L365)
- **Recommended direction:** Prioritize backend API and database integration (e.g., PostgreSQL / Supabase) to enable multi-device clinic operations.

---

## Summary of Findings by Priority

### Critical Logic Bugs
1. **Permanent Data Loss on Waitlist Drop:** Dragging an appointment to the Unscheduled Waitlist executes `deleteAppointment(id)`, permanently deleting the appointment, its history, notes, and attachments from existence with no undo and no audit record ([EventCalendarView.tsx:413](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L413)).
2. **Premature Session Completion on Check-In:** `ClinicContext.checkInAppointment` automatically marks the appointment as `status: 'completed'` and immediately deducts 1 session from the patient's package upon arrival, before the doctor has treated the patient ([ClinicContext.tsx:722-748](file:///f:/SAAS/context/ClinicContext.tsx#L722-L748)).
3. **Dead Calendar Cards & Unreachable Receptionist Modals:** `ReceptionistOverview.tsx` renders `<EventCalendarView />` without passing `onSelectAppointment`. Clicking appointment cards does nothing, and all front desk action modals (`RescheduleAppointmentModal`, `RecordPaymentModal`, `WhatsAppEditModal`) are 100% unreachable dead code ([ReceptionistOverview.tsx:222-266](file:///f:/SAAS/components/dashboard/ReceptionistOverview.tsx#L222-L266)).
4. **Rescheduling Availability Bypass:** Calendar drag-and-drop rescheduling calls `rescheduleAppointment` directly without doctor availability, bed capacity, or daily limit checks, allowing silent double-booking ([EventCalendarView.tsx:362](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L362)).
5. **Silent Quota Data Loss:** `localStorage` quota exceeded errors are caught with only `console.error`. The UI continues to appear functional, but all subsequent changes are silently lost upon refresh ([ClinicContext.tsx:361-363](file:///f:/SAAS/context/ClinicContext.tsx#L361-L363)).

---

### High Logic Bugs
1. **Assessment + Treatment Blocked on Same Day:** `addAppointment` enforces 1 session per category using `isNutA === isNutB`. Because both assessment and therapy have `isNut === false`, scheduling an initial evaluation and first treatment on the same day is strictly blocked ([BookAppointmentModal.tsx:122](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L122)).
2. **Fixed 45-Minute Duration:** System duration is rigidly hardcoded to 45 minutes; variable durations (30, 60, 90, 120 minutes) cannot be scheduled ([BookAppointmentModal.tsx:209](file:///f:/SAAS/components/appointments/BookAppointmentModal.tsx#L209)).
3. **Payments Exclusively Restricted to Packages:** Standalone single sessions, initial consultations, and diet visits cannot be billed or paid without creating a package ([RecordPaymentModal.tsx:27-55](file:///f:/SAAS/components/billing/RecordPaymentModal.tsx#L27-L55)).
4. **Silent Overpayment Absorption:** Paying more than `balanceDue` clamps the balance to 0 without crediting the patient or recording clinic debt ([ClinicContext.tsx:517-518](file:///f:/SAAS/context/ClinicContext.tsx#L517-L518)).
5. **Completed Appointment Dragging:** Completed appointments can be dragged to new slots, resetting status to `'scheduled'` without refunding the previously consumed package session ([EventCalendarView.tsx:635-646](file:///f:/SAAS/components/calendar/EventCalendarView.tsx#L635-L646)).
6. **Multi-Tab Desynchronization:** Multiple open browser tabs overwrite each other's changes due to lack of a `storage` listener ([ClinicContext.tsx:350-380](file:///f:/SAAS/context/ClinicContext.tsx#L350-L380)).
7. **One-Click Factory Reset in Main Menu:** `resetDemoData()` is exposed in the UI and wipes all data with `localStorage.clear()` ([AppShell.tsx:739](file:///f:/SAAS/components/layout/AppShell.tsx#L739)).
8. **Missing Doctor Availability Models:** Inactive doctors, off-days, and off-hour times can be booked without restriction ([types/index.ts:3-15](file:///f:/SAAS/types/index.ts#L3-L15)).
9. **Clinical Privacy Leaks:** Patient diagnosis is masked in `PatientDirectory` but exposed in plain text in reschedule modals, waitlist cards, and edit modals ([PatientDirectory.tsx:492](file:///f:/SAAS/components/patients/PatientDirectory.tsx#L492), [RescheduleAppointmentModal.tsx:124](file:///f:/SAAS/components/appointments/RescheduleAppointmentModal.tsx#L124)).
10. **Lack of Core Receptionist Audit Logging:** Patient creation, edits, bookings, reschedules, check-ins, cancellations, and payments produce zero audit entries ([ClinicContext.tsx:979-1062](file:///f:/SAAS/context/ClinicContext.tsx#L979-L1062)).
11. **Clinical Session Completion by Receptionist:** Front desk can complete sessions and author doctor notes in `CompleteSessionModal` ([ReceptionistOverview.tsx:228-235](file:///f:/SAAS/components/dashboard/ReceptionistOverview.tsx#L228-L235)).
12. **Base64 Document Storage Bloat:** Storing raw WebP images in `localStorage` quickly triggers browser storage exhaustion ([RecordPaymentModal.tsx:79](file:///f:/SAAS/components/billing/RecordPaymentModal.tsx#L79)).

---

### Business Decisions Required
1. **Duplicate Phone Policy:** Decide whether multiple family members can share a single phone number or if phone must be a strictly unique patient key.
2. **Assessment Prerequisite:** Decide whether completing an initial assessment is a strict prerequisite before booking therapy sessions.
3. **No-Show & Late Cancellation Policy:** Decide whether no-shows or cancellations within 24 hours forfeit a package session or incur a penalty fee.
4. **Multi-Device & Cloud Strategy:** Decide timeline for migrating from prototype browser `localStorage` to a centralized backend database (e.g., PostgreSQL/Supabase).

---

### Tests That Require Manual Confirmation
1. **Physical Browser Touch Gestures:** Drag-and-drop behavior on iPad/touchscreen receptionist terminals.
2. **Print/Export Fidelity:** CSV exports in Microsoft Excel Arabic encoding (UTF-8 BOM).
3. **Low-Memory Device Crash Limits:** Number of Base64 documents before Safari/Chrome mobile tab crashes.
4. **WhatsApp Web URL Launching:** Deep-link triggering on Windows desktop vs. mobile browsers.

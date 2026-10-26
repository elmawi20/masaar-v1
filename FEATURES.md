# CLINIC PRODUCT FEATURE SPECIFICATION (FEATURES.MD)
## Masaar Physiotherapy, Rehabilitation & Clinical Nutrition Center

---

## 1. Overview

### 1.1 Clinic Domain & Mission
The system is a comprehensive, multi-role Clinical Practice Management and Electronic Medical Records (EMR) platform tailored for outpatient physiotherapy clinics, sports rehabilitation centers, and medical clinical nutrition practices operating in the Egyptian private healthcare sector. 

The platform coordinates front-desk operations, automated patient flow, multi-room physical therapy scheduling, clinical SOAP charting, InBody metabolic tracking, custom treatment package lifecycles, point-of-sale receipting, clinic operating expenses, commission calculations, and audit governance.

### 1.2 Clinic Profile & Operating Parameters
- **Clinic Name:** Masaar Clinic (عيادة مسار)
- **Branch:** Main Center (الفرع الرئيسي)
- **Location:** 14 Road 213, Degla, Maadi, Cairo, Egypt (١٤ شارع ٢١٣، دجلة، المعادي، القاهرة)
- **Primary Contact Phone:** +201002345678
- **Primary Currency:** Egyptian Pound (EGP / ج.م)
- **Operating Hours:** 09:00 AM to 09:00 PM (12-hour operational window daily)
- **Default Scheduling Interval:** 15-minute granularity (supporting session durations from 15 to 180 minutes)
- **Facility Capacity:** 4 dedicated treatment rooms accommodating 6 simultaneous treatment beds/stations.

### 1.3 Localization & Language Support
- **Dual Language Architecture:** Complete native support for both Modern Standard Arabic (العربية) and Professional Medical English.
- **Dynamic Bidirectional Mirroring:** Instant bidirectional toggling between Right-to-Left (RTL) layout direction for Arabic and Left-to-Right (LTR) layout direction for English.
- **Cultural & Regional Adaptation:**
  - Egyptian mobile phone formatting and validation (`01XXXXXXXXX` and `+201XXXXXXXXX`).
  - Egyptian financial rounding and currency rendering (`EGP` / `ج.م`).
  - Culturally appropriate Arabic clinical terminology alongside standardized English medical abbreviations.
  - Zero-cost direct WhatsApp messaging formatted specifically for Egyptian telecommunication channels.

### 1.4 Visual Theme & Ergonomics
- **Dual Visual Theme System:** Deep Dark Mode and Clean Light Mode, accessible across all screens via a single toggle.
- **Accessibility & Contrast:** High-contrast clinical indicators, distinct color-coded appointment bubble tags, and role-based chromatic branding (Receptionist in Deep Teal, Physiotherapy in Emerald Green, Clinical Nutrition in Vivid Amber, and Administration in Rich Violet/Slate).

---

## 2. User Roles & Permissions Matrix

The platform enforces a role-based access control matrix across 6 distinct user profiles:

```
+-------------------+--------------------+-------------------+---------------------+
| Role Profile      | Primary Domain     | Visibility Scope  | Administrative Auth |
+-------------------+--------------------+-------------------+---------------------+
| Admin             | Owner / Consultant | Full Clinic-Wide  | Full Privileges     |
| Dev               | Systems Engineer   | Full Diagnostics  | Full Privileges     |
| Co-Admin          | Executive Partner  | Operations/Ledger | Full Privileges     |
| Receptionist      | Front Desk / Desk  | Front-Desk Focus  | Operational Only    |
| Physiotherapist   | Physical Therapy   | Assigned Patients | Clinical Only       |
| Diet Doctor       | Clinical Nutrition | Diet & Nutrition  | Clinical Only       |
+-------------------+--------------------+-------------------+---------------------+
```

### 2.1 Admin (Clinic Owner & Head Consultant Doctor)
- **What they see:** Complete clinic-wide financial dashboards, net revenue metrics, doctor commission breakdowns, entire patient directory, full appointments calendar across all rooms, treatment packages ledger, petty cash and facility expenses ledger, voided receipts log, system security configurations, and full immutable audit logs.
- **What they can do:**
  - Create, edit, and discharge patients.
  - Book, reschedule, cancel, and complete appointments.
  - Change appointment prices even after payments have been recorded.
  - Extend treatment package expiration dates with mandatory logged justifications.
  - Collect payments and void issued payment receipts with mandatory logged reasons.
  - Manage clinic staff profiles, assign commission rates, and update user login passwords.
  - Configure clinic pricing, standard package tiers, treatment rooms, and bed counts.
  - Log, edit, and delete clinic operating expenses.
  - Process doctor commission payouts and register them automatically as clinic expenses.
  - Export CSV reports (Patients, Receipts, Expenses) and generate full JSON clinic database backups.
  - Toggle geofence security controls and simulator parameters.
- **What is hidden:** Nothing. Complete, unrestricted authority.

### 2.2 Dev (Lead Systems Architect & Security Engineer)
- **What they see:** Identical clinical and financial visibility to the Admin, supplemented with developer diagnostic panels, location simulator overrides, and raw security telemetry.
- **What they can do:** All administrative actions, data maintenance operations, and security sandbox testing.
- **What is hidden:** Nothing.

### 2.3 Co-Admin (Managing Partner & Operations Director)
- **What they see:** All financial metrics, operational KPIs, staff caseloads, billing transactions, expense tracking, and facility settings.
- **What they can do:** Identical to Admin in daily operations: record payments, void receipts, extend packages, update appointment prices, log expenses, and export financial data.
- **What is hidden:** Cannot delete primary owner credentials.

### 2.4 Receptionist (Head of Front Desk & Patient Relations)
- **What they see:** Front Desk daily operational overview, today's appointments schedule, calendar resource grid, patient directory, lead statuses, package balances, today's petty cash expenses, and front desk notifications.
- **What they can do:**
  - Register new patients with automatic Egyptian phone uniqueness verification.
  - Book, reschedule, and cancel appointments with mandatory category reasons.
  - Check in arriving patients (marks arrival timestamp without deducting treatment packages).
  - Move appointments to and from the scheduling waitlist.
  - Collect payments for appointments, packages, or direct patient accounts.
  - Log today's clinic expenses (e.g. coffee, emergency medical supplies, water).
  - Trigger personalized WhatsApp confirmations, intake welcomes, and schedule updates.
- **What is hidden / restricted:**
  - **No Clinical Access:** Cannot view or edit doctor SOAP clinical notes, confidential diagnoses, or medical document attachments.
  - **No Historical Expenses:** Cannot view expenses from prior days or months; cannot edit or delete logged expenses.
  - **No Receipt Voiding:** Strictly blocked from voiding receipts (must request Admin intervention).
  - **No Post-Payment Price Changes:** Cannot modify an appointment's price once a payment has been registered.
  - **No Package Extensions:** Cannot extend expired or forfeited treatment packages.
  - **No Staff or Pricing Configuration:** Cannot modify doctor commission rates, standard package tiers, or clinic settings.

### 2.5 Physiotherapist (Specialist Physical Therapist)
- **What they see:** Daily clinical schedule of assigned patients, patient medical history, primary diagnoses, precautions/alerts banner, treatment package session balances, prescribed home exercises, patient documents (X-rays, MRI scans, prescriptions), and clinical notifications.
- **What they can do:**
  - View assigned patients for today and upcoming dates.
  - Review medical scans and physician referral prescriptions within a protected viewer.
  - Complete therapy sessions, record post-session doctor notes, and attach clinical scans.
  - Prescribe and update home exercise routines.
  - Mark patient no-shows or undo accidental no-shows.
  - Reschedule therapy sessions.
- **What is hidden / restricted:**
  - **Geofence Restricted:** Access is strictly blocked if the doctor is outside the clinic Wi-Fi network.
  - **Patient Isolation:** Cannot see other doctors' patients unless assigned to them.
  - **Financial Shield:** Cannot see clinic financial totals, revenue breakdowns, billing methods, or other doctors' commissions.
  - **No System Settings:** Cannot access staff settings, pricing rules, or expense registers.

### 2.6 Diet Doctor (Clinical Nutrition & Medical Diet Consultant)
- **What they see:** Clinical nutrition workspace, assigned nutrition consultations, patient InBody records, dietary history, body composition analytics (Weight, Skeletal Muscle Mass, Body Fat Percentage, Visceral Fat, BMI, BMR), target macro distribution, and nutrition protocol plans.
- **What they can do:**
  - Record new InBody body composition measurements and set target weights.
  - Prescribe specialized nutritional protocols (e.g. Ketogenic, Low Carb Anti-Inflammatory, Intermittent Fasting, Diabetic Management, Post-Bariatric, Sports Athletic).
  - Define daily caloric goals, protein grams, carbohydrate grams, and dietary fat grams.
  - Review patient medical lab reports.
  - Complete dietary consultations and mark sessions done.
- **What is hidden / restricted:**
  - **Geofence Restricted:** Access is blocked outside clinic Wi-Fi.
  - **No Physiotherapy Charting:** Cannot alter physical therapy SOAP notes or orthopedic protocols.
  - **No Clinic Financials:** Billing ledgers, clinic expenses, and executive financials are hidden.

---

## 3. Screens and Dashboards

### 3.1 Global Application Shell & Top Navigation Bar
- **Clinic Branding Display:** Shows clinic logo, Arabic name (`عيادة مسار`), English name (`Masaar`), and branch tag.
- **Urgent Alerts Button:** Bell icon with counter badge displaying the number of patients with low package balances (≤ 1 session) or unpaid overdue balances. Clicking opens the Urgent Alerts Drawer.
- **Notifications Center:** Bell icon with counter badge displaying real-time patient arrivals, patient delay warnings, reschedule alerts, and cancellations.
- **Language Switcher:** Instant toggle between `العربية (RTL)` and `English (LTR)`.
- **Theme Switcher:** Moon/Sun icon toggling between Dark Mode and Light Mode.
- **Active User Badge & Quick Switcher:** Displays current user name, role badge, and initials avatar. Clicking opens the Staff Role Switcher and Authentication Modal.
- **Role-Aware Navigation Tabs:** Dynamically renders only the tabs permitted for the active role:
  - Receptionist: `Front Desk Overview`, `Appointments Calendar`, `Patients Directory`, `Completed Cases`, `Treatment Packages`.
  - Physiotherapist: `Clinical Workspace`, `Appointments Calendar`, `My Patients`, `Completed Cases`.
  - Diet Doctor: `Nutrition Workspace`, `Appointments Calendar`, `My Patients`, `Completed Cases`.
  - Admin / Co-Admin: `Executive Dashboard`, `Appointments Calendar`, `Patients Directory`, `Completed Cases`, `Treatment Packages`, `Management Console`.

---

### 3.2 Receptionist Dashboard (Front Desk Overview)
- **Today's Metric Summary Cards:**
  - Scheduled Appointments count.
  - Arrived Patients count (checked in and in waiting area).
  - Completed Sessions count.
  - Cancelled & No-Show counts.
  - Doctor daily workload alerts (warns if a doctor reaches 10 sessions/day).
- **Quick Action Bar:**
  - `+ New Patient Intake`: Opens patient registration wizard.
  - `+ Book Appointment`: Opens booking modal.
  - `+ Today's Expense`: Opens petty cash logger for front-desk daily expenses.
- **Urgent Follow-up Widget:** Scrollable list of patients whose packages have only 1 session remaining or have pending payment balances, complete with one-click WhatsApp reminder triggers.
- **Integrated Calendar Grid View:** Direct visual calendar showing today's bed utilization with clickable appointment bubbles. Clicking an appointment opens the Front Desk Action Popover.
- **Front Desk Action Popover Menu:**
  - `View Patient Details`: Displays diagnosis, doctor, package balance, and contact info.
  - `Check In Patient`: Marks patient as arrived with current timestamp.
  - `Reschedule`: Opens reschedule modal with conflict check.
  - `Collect Payment`: Opens receipt collection modal linked directly to the appointment or package.
  - `Cancel Appointment`: Opens cancellation reason prompt.
  - `Mark No-Show`: Opens no-show reason prompt.
  - `Send WhatsApp`: Opens WhatsApp message editor with contextual template.

---

### 3.3 Physiotherapist Clinical Dashboard
- **Geofence Security Banner:** Active when access is permitted; if outside clinic network, displays a security lock screen blocking patient records.
- **Doctor Hero Profile Card:** Displays doctor name, PhD/specialty title, initials avatar, and today's clinical workload progress meter (Total Cases, Completed Cases, Remaining Cases).
- **Interactive Date Selector:** Defaults to today, allowing switching to upcoming dates to review future schedules.
- **Patient Treatment Queue Cards:** Ordered by scheduled time, displaying:
  - Appointment time badge (12-hour format with AM/PM).
  - Treatment location (e.g. `Room 1 - Bed 1`).
  - Session status pill (`Scheduled`, `Arrived`, `Completed`, `No-Show`).
  - Patient full name, age, gender, and phone number.
  - Primary diagnosis badge (e.g. `ACL Reconstruction Rehab (Week 6)`).
  - High-priority Medical Precautions Banner (e.g. `Hypertension Controlled`, `Pacemaker`).
  - Treatment Package meter (completed vs. total sessions, remaining balance).
  - Prescribed home exercise regimen.
  - `Medical Docs` button: Opens patient prescriptions and imaging viewer.
  - Clinical action buttons: `No-Show`, `Undo No-Show`, `Reschedule`, and `Start / Complete Session`.

---

### 3.4 Diet Doctor Clinical Nutrition Dashboard
- **Geofence Security Shield:** Enforces clinic-only network access for metabolic records.
- **Nutrition Overview Banner:** Shows consulting doctor details and today's consultation count.
- **Nutrition Protocol Filter Bar:** Filter cases by protocol (`All`, `Anti-Inflammatory Low Carb`, `Ketogenic`, `Intermittent Fasting`, `Diabetic Management`, `Sports Athletic`, `Post-Bariatric`).
- **Body Composition & InBody History Table:**
  - Patient name and assessment date.
  - Current weight (kg) and Target weight (kg).
  - Skeletal Muscle Mass (kg) and Body Fat Percentage (%).
  - Visceral Fat level and BMI calculation.
  - Basal Metabolic Rate (BMR in kcal) and Prescribed Daily Calorie Goal.
  - Macronutrient targets (Protein grams, Carb grams, Fat grams).
  - Active dietary protocol badge.
- **Nutrition Action Controls:**
  - `+ New InBody Assessment`: Opens modal to record full bioimpedance measurements and macronutrient goals.
  - `Patient Medical Documents`: Opens secure lab and bloodwork viewer.
  - `Complete Consultation`: Confirms consultation completion and deducts session.

---

### 3.5 Executive Admin Overview Dashboard
- **Timeframe Filter Engine:** Quick-switch between `Today`, `Custom Date Range`, `Month`, `Year`, and `All Time`.
- **Top Financial KPI Cards:**
  - `Collected Revenue`: Sum of non-voided receipts in selected period (EGP).
  - `Clinic Operating Expenses`: Sum of recorded expenses in period (EGP).
  - `Net Operating Profit`: Revenue minus Expenses (EGP).
  - `Outstanding Balance Due`: Total receivables across all active patient packages (EGP).
  - `Completed Therapy Sessions`: Total sessions fulfilled and deducted.
  - `Active Patients Volume`: Total active patients under treatment.
- **Selected Day Financial Deep-Dive:** Daily net revenue breakdown displaying gross collections minus daily petty expenses.
- **Collection Channels Distribution Card:** Visual percentage and amount breakdown by payment channel (`InstaPay`, `Vodafone Cash`, `Cash`, `Visa / Card`, `Fawry`).
- **Physiotherapy Staff Caseload & Commission Register:**
  - Staff member name, title, and assigned active patient volume.
  - Total sessions completed in period.
  - Configured commission rate (% or fixed session rate).
  - Total commission earned (EGP).
  - `Payout Commission` button: Generates an expense record and audit log upon payout confirmation.
- **Collections & Payment Receipts Table:**
  - Sequential receipt number (e.g. `INV-2026-00001`).
  - Date and timestamp.
  - Patient name.
  - Item/Package covered.
  - Collected amount (EGP).
  - Payment method badge.
  - Staff member who collected the funds.
  - Attached bank transfer screenshot / bill thumbnail (opens full-screen viewer).
  - Struck-through styling for voided receipts with `[VOIDED]` badge and cancellation reason.
  - `Void Receipt` button (Admin/Co-Admin only).
- **Data Export & Backup Actions:** One-click CSV export buttons for Patients, Receipts, and Expenses, plus a full JSON clinic system backup export.

---

### 3.6 Appointments & Resource Calendar Grid Screen
- **Multi-Resource Room & Bed Grid:**
  - Horizontal Columns: Configured clinic treatment rooms and beds (e.g. `Room 1 - Bed 1`, `Room 1 - Bed 2`, `Room 2 - Bed 1`, `Room 3`, `Room 4`).
  - Vertical Rows: Hourly time slots from 09:00 AM to 09:00 PM.
  - Off-Hour Indicator: Precise red line indicators for appointments starting at non-zero minutes (e.g. 10:15 or 11:30).
- **Interactive Drag-and-Drop Scheduling:**
  - Dragging an appointment card to a new room or time slot checks for doctor/bed conflicts and updates the schedule.
  - Dropping an appointment onto the Waitlist sidebar un-schedules the appointment and changes its status to `waitlisted` without deleting the record.
  - Dragging a patient card from the Waitlist sidebar onto an open slot books the appointment immediately.
- **Calendar Search Bar:** Real-time search by patient name, filtering matching appointments on the grid.
- **Right Sidebar (Waitlist & Quick Patient Roster):**
  - Displays waitlisted patients waiting for room openings.
  - Allows quick scheduling by dragging directly onto the calendar grid.

---

### 3.7 Patient Directory & EMR Screen
- **Directory Search & Filter Bar:**
  - Keyword search across patient name, Egyptian mobile number, WhatsApp, and primary diagnosis.
  - Patient status filter (`All`, `Active`, `Lead`).
  - Attending Doctor filter.
  - Clinical Need category filter (`All`, `Physiotherapy`, `Nutrition`, `Head Consultant Assessment`).
- **Patient Record Cards:**
  - Patient circular avatar with initials.
  - Full legal name (supports inline editing for Admin/Receptionist).
  - Age and gender.
  - Direct click-to-call phone and direct click-to-WhatsApp link.
  - Billing type badge (`Package`, `Cash`, `Insurance` with insurance company name).
  - Assigned physiotherapist / doctor.
  - Primary clinical diagnosis (supports inline editing for Doctors/Admin).
  - Medical precautions and alert pills.
  - Package progress meter (completed vs. total sessions, remaining sessions, pending balance).
  - Documents counter badge (shows number of attached prescriptions and scans).
- **Patient Actions:**
  - `Edit Profile`: Opens full patient edit modal.
  - `Book Session`: Quick-books an appointment for this patient.
  - `Docs & Scans`: Opens secure medical documents modal.
  - `WhatsApp`: Opens WhatsApp message composer.
  - `Export CSV`: Exports the full patient directory to CSV.

---

### 3.8 Completed Cases & Clinical Logs Screen
- **Case Filter Controls:** Filter by specific date, search by patient name/phone/notes, and filter by attending doctor.
- **Completed Session Records:**
  - Date and time completed.
  - Patient name and attending doctor.
  - Package session count deducted.
  - Doctor's clinical observation notes (visible to Doctors/Admins; hidden from Receptionists).
  - Attached session documents and imaging.
  - `Edit Clinical Notes`: Allows attending doctor to refine clinical notes.
  - `Re-open / Undo Completed`: Reverts status to scheduled and restores the deducted package session.

---

### 3.9 Treatment Packages & Revenue Ledger Screen
- **Package Ledger Cards:**
  - Package title and patient name.
  - Purchase date and expiry date.
  - Expiry status badge: Displays `Active`, `X days left`, `Completed`, or `Forfeited (Expired)`.
  - Session balance progress bar: Completed sessions vs. total sessions, highlighting remaining count.
  - Financial balance summary: Total package price, amount paid to date, and outstanding balance due.
  - `Collect Bill`: Opens payment modal to collect outstanding balance.
  - `Extend`: Admin-only action to extend package validity by custom days with a required reason.

---

### 3.10 Administrative Management Console
A tabbed administrative control center featuring 6 configuration panels:
1. **Doctors & Staff Management:** View all staff, add new staff profiles, edit contact/specialty details, update login passwords, and remove staff members.
2. **Doctor Commissions:** Configure custom commission percentages (%) or fixed per-session amounts (EGP), and issue payout disbursements.
3. **Clinic Session Pricing:** Configure standard baseline clinic rates for Single Sessions, Initial Head Consultant Assessments, and Home Care Visits.
4. **Standard Package Tiers:** Create, edit, and deactivate standard clinic package templates (e.g. 6-Session Targeted, 10-Session Comprehensive, 12-Session Sports Rehab, 16-Session Neuro Recovery).
5. **Rooms & Beds Configuration:** Add, rename, and activate/deactivate treatment rooms and set bed capacities.
6. **Clinic Profile, Working Hours & Geofence Security:** Update clinic name, branch, Cairo address, phone, working hours, and configure Wi-Fi SSID geofence parameters. Includes database reset and backup tools.

---

### 3.11 Clinic Expenses Console
- **View Toggle:** `Expenses Ledger` vs. `Equipment & Capital Assets Register`.
- **Role Scoping:** Receptionist sees only today's expenses; Admin/Co-Admin can filter by today, current month, or all time.
- **Expense Records Table:** Title, category, amount (EGP), payment method, date, logged by, mandatory reason, and edit history log.
- **Actions:** Add expense, edit expense amount with reason, delete expense (Admin only), and export expenses to CSV.

---

## 4. Features by Module

---

### Module 1: Patient Management & Registration

#### Feature 1: Comprehensive Patient Registration Wizard
- **Description:** Allows receptionists and administrators to register new patients and leads with clinical intake data.
- **Form Fields:**
  1. `Full Name` (Text, Required): Patient legal full name. Soft-checks for existing similar names.
  2. `Egyptian Mobile Phone` (Text, Required): Validates format `/^(\+20|0)?1[0125][0-9]{8}$/`. Normalizes number and blocks duplicate registrations.
  3. `WhatsApp Number` (Text, Optional): Auto-mirrored from phone; accepts alternate WhatsApp contact.
  4. `Age` (Number, Required, 1-120): Patient age in years.
  5. `Gender` (Select, Required): Options: `Male` (ذكر), `Female` (أنثى).
  6. `Status` (Select, Required): Options: `Active Patient` (مريض نشط), `Prospective Lead` (عميل مرتقب).
  7. `Payment Arrangement` (Select, Required): Options: `Cash / Per-Session` (نقدي / كاش), `Treatment Package` (باقة جلسات), `Medical Insurance` (تأمين طبي).
  8. `Insurance Company Name` (Text, Conditional): Visible and required only if Payment Arrangement is `Medical Insurance`.
  9. `Referring Physician / Channel` (Text, Optional): Referring doctor name, hospital, or social media channel.
  10. `Primary Clinical Diagnosis` (Text or Quick Tag, Required): Free-text input plus 8 quick-select clinical chips (e.g. ACL Rehab, Lumbar Disc Herniation, Frozen Shoulder, Cervical Radiculopathy, Ankle Sprain, Patellofemoral Syndrome, Tennis Elbow, Stroke Rehab).
  11. `Assigned Treating Doctor` (Select, Required): Dropdown of active physiotherapists and consultant doctors.
  12. `Medical Safety Alerts` (Multi-Select Checkboxes, Optional): Options: `Diabetic`, `Pacemaker`, `Hypertension`, `Osteoporosis`, `Fall Risk`, `Prior Meniscus Surgery`.
  13. `General Clinical Notes` (Textarea, Optional): Administrative or intake notes.
  14. `Package Enrollment Checkbox` (Boolean Toggle): If checked, displays package fields (Package Name, Session Count, Total Price EGP, Deposit Paid EGP, Payment Method).

#### Feature 2: Egyptian Phone Uniqueness & Normalization Engine
- **Description:** Prevents duplicate patient profiles by canonicalizing phone numbers before comparison (stripping spaces, symbols, international prefix `+20`, and leading `0` to match standard 11 digits `01XXXXXXXXX`).
- **Behavior:** If a duplicate phone is detected, the registration/edit button is disabled, and an alert card displays the existing patient's full name, ID, and an **"Open patient file"** navigation button.

#### Feature 3: Patient Profile Editing & Role-Based Guardrails
- **Description:** Modal to update patient demographics, phone numbers, payment types, and diagnoses.
- **Rules:** Validates Egyptian phone format and enforces uniqueness against all other patients. Inline diagnosis editing is restricted to clinical staff and admins.

#### Feature 4: Patient Medical Documents & Scan Archive (With Anti-Screenshot Shield)
- **Description:** Dedicated secure document drawer for each patient storing doctor prescriptions, X-rays, MRI scans, and lab reports.
- **Document Upload Form Fields:**
  1. `Document Title` (Text, Required): Name of scan or report.
  2. `Document Category` (Select, Required): Options: `Doctor Prescription` (روشتة طبيب بشري), `X-Ray Scan` (أشعة سينية X-Ray), `MRI Scan` (رنين مغناطيسي MRI), `Lab Report` (تقرير معمل / تحاليل), `Other Medical Document` (مستند طبي آخر).
  3. `Clinical Notes` (Textarea, Optional): Radiologist comments or doctor impressions.
  4. `File Upload / Camera Capture` (File Input, Required): Accepts images, automatically compressed via Client-Side Canvas to WebP (< 50 KB).
- **Anti-Screenshot Shield:** If window focus is lost or `PrintScreen` / `Ctrl+P` / `Ctrl+S` keystrokes are pressed, the viewer immediately blurs the document and shows a privacy warning watermark with the staff member's name and timestamp.

#### Feature 5: Patient Discharge & Case Archive
- **Description:** When all sessions of a treatment package are completed, the patient can be discharged to the Completed Cases archive, preserving historical SOAP notes, pain scores, and imaging.

---

### Module 2: Appointment Scheduling & Calendar Resource Engine

#### Feature 6: Room & Bed Multi-Resource Calendar
- **Description:** Real-time scheduling grid displaying 4 treatment rooms across 6 physical beds/stations from 09:00 AM to 09:00 PM.
- **Resource Matrix:**
  - Room 1: Bed 1 (Electrotherapy), Bed 2 (Manual Therapy)
  - Room 2: Bed 1 (Shockwave), Bed 2 (Laser / Cryo)
  - Room 3: Bed 1 (Consultant Assessment)
  - Room 4: Bed 1 (Clinical Nutrition & InBody)

#### Feature 7: Flexible Booking Modal
- **Description:** Allows front-desk and doctors to schedule appointments.
- **Form Fields:**
  1. `Session Category` (Radio Toggle, Required): Options: `Physiotherapy` (علاج طبيعي), `Clinical Nutrition` (تغذية علاجية), `Consultant Assessment` (كشف استشاري أول). Auto-filters doctor and sets baseline price.
  2. `Patient` (Select / Search, Required): Dropdown of active patients and leads.
  3. `Attending Doctor` (Select, Required): Filtered by category.
  4. `Appointment Date` (Date Picker, Required, YYYY-MM-DD).
  5. `Start Time` (Time Picker, Required, 15-minute increments between 09:00 and 21:00).
  6. `Session Duration` (Number, Required, 15-min steps, min 15, max 180, default 45 mins).
  7. `Session Price` (Number EGP, Required, entered freely by receptionist; no hardcoded fixed list).
  8. `Treatment Room` (Select, Required): Dropdown of active clinic rooms.
  9. `Bed / Station Number` (Select, Required): Dropdown based on room bed capacity (Bed 1, Bed 2).
- **Post-Booking Action:** Instant confirmation screen offering a one-click WhatsApp appointment reminder with pre-filled details.

#### Feature 8: Centralized Conflict & Constraint Detection Engine
- **Description:** Centralized validation logic enforcing 5 clinical conflict checks prior to booking or rescheduling:
  1. `Doctor Overlap Check`: Ensures the attending doctor is not double-booked (`newStart < existingEnd && newEnd > existingStart`).
  2. `Bed Overlap Check`: Ensures the specific room bed is not occupied during the time interval.
  3. `Doctor Daily Workload Cap`: Limits doctors to a maximum of 10 appointments per day.
  4. `Package Expiration Check`: Blocks booking sessions dated after the patient's package expiry date.
  5. `Working Hours Enforcement`: Prevents scheduling outside the 09:00 AM – 09:00 PM window.

#### Feature 9: Drag-and-Drop Appointment Rescheduling
- **Description:** Enables drag-and-drop manipulation of appointments on the calendar grid. Moving an appointment triggers conflict verification. If a conflict occurs, the drop is cancelled and the reason is displayed.

#### Feature 10: Scheduling Waitlist Management
- **Description:** Unscheduled or walk-in patients can be moved to the calendar waitlist sidebar. Dropping an appointment onto the waitlist updates its status to `waitlisted` without deleting the record. Dragging from the waitlist to an open slot restores and books the appointment.

#### Feature 11: Patient Check-In Workflow
- **Description:** When a patient arrives at reception, the receptionist clicks "Check In" from the appointment popover. This sets status to `arrived` and stores the arrival timestamp (`arrivedAt`). It does NOT deduct a package session (deduction is reserved for doctor session completion).

#### Feature 12: Appointment Reschedule Modal
- **Description:** Allows modifying appointment date, time, duration, room/bed, and price.
- **Price Lock Rule:** If a payment has already been recorded for this appointment, the price input is locked (`🔒 Paid (Admin only)`). Only an Admin or Co-Admin can unlock and modify the price.

#### Feature 13: Standardized Cancellation & No-Show Reason Tracking
- **Description:** Cancellations and no-shows require formal classification to be logged to patient history and audit records.
- **Reason Prompt Fields:**
  1. `Reason Category` (Select, Required):
     - `patient_request` (طلب المريض / Patient Request)
     - `illness` (مرض أو وعكة صحية / Illness)
     - `transport` (مواصلات أو عائق طريق / Transport)
     - `emergency` (ظرف عائلي / طارئ / Emergency)
     - `no_contact` (تعذر التواصل مع المريض / No Contact)
     - `other` (سبب آخر / Other)
  2. `Additional Notes` (Textarea, Optional): Specific context.
- **Timestamps:** Records `cancelledAt` + `cancellationReason` or `markedNoShowAt` + `noShowReason`.

---

### Module 3: Clinical Documentation & Electronic Medical Records (EMR)

#### Feature 14: Doctor Session Completion & Clinical Charting Modal
- **Description:** Attending physiotherapists and consultants document session outcomes upon completion.
- **Form Fields:**
  1. `Doctor's Clinical Notes` (Textarea, Required): Treatment modalities applied (e.g. Ultrasound, TENS, manual mobilization, dry needling) and patient response. Includes a quick `Set N/A` button.
  2. `Session Document / Scan Attachments` (Text input + file attach, Optional): Attaches post-session scans or reports.
- **Session Deduction:** Submitting marks appointment as `completed` and automatically decrements 1 session from the patient's active package.
- **Receptionist Guardrail:** If an Admin/Receptionist confirms completion from front-desk mode, it marks completion without exposing or requiring clinical SOAP charting.

#### Feature 15: SOAP Clinical Notes Structure
- **Description:** Structured EMR charting supporting Subjective, Objective, Assessment, and Plan fields:
  - `Subjective (S)`: Patient's reported symptoms, pain location, and functional complaints.
  - `Objective (O)`: Range of motion (ROM) degrees, manual muscle testing (MMT) scores, palpation findings, special orthopedic tests.
  - `Assessment (A)`: Clinical diagnosis progression and tissue healing status.
  - `Plan (P)`: Next session modalities, progression criteria, and frequency.

#### Feature 16: Numerical Pain Rating Scale (NPRS 1-10)
- **Description:** Visual 1-10 pain score recorded per completed session to measure recovery trajectories over time.

#### Feature 17: Prescribed Home Exercise Routine (Home Rx)
- **Description:** Doctors assign specific stretching, strengthening, and postural drills displayed on the patient's file.

---

### Module 4: Clinical Nutrition & Metabolic Health Management

#### Feature 18: Bioimpedance & InBody Assessment Logger
- **Description:** Dedicated consultation modal for the Diet Doctor to record body composition metrics and nutritional regimens.
- **Form Fields:**
  1. `Patient` (Select, Required): Patient receiving nutritional counseling.
  2. `Current Weight` (Number, Required, kg).
  3. `Target Goal Weight` (Number, Required, kg).
  4. `Skeletal Muscle Mass` (Number, Required, kg).
  5. `Body Fat Percentage` (Number, Required, %).
  6. `Visceral Fat Level` (Number, Required, 1-20 rating).
  7. `BMI` (Body Mass Index, Auto-calculated from weight and height).
  8. `BMR` (Basal Metabolic Rate in kcal, Auto-calculated).
  9. `Prescribed Daily Caloric Target` (Number, Required, kcal/day).
  10. `Protein Target` (Number, Required, grams/day).
  11. `Carbohydrates Target` (Number, Required, grams/day).
  12. `Dietary Fats Target` (Number, Required, grams/day).
  13. `Prescribed Nutrition Protocol` (Select, Required): Options:
      - `Medical Ketogenic (Keto)`
      - `Anti-Inflammatory Low Carb`
      - `Intermittent Fasting`
      - `Sports Nutrition & Muscle Hypertrophy`
      - `Diabetic & Insulin Resistance Protocol`
      - `Post-Bariatric Surgery Care`

---

### Module 5: Treatment Packages & Sessions Ledger

#### Feature 19: Manual Package Creation with Free Pricing
- **Description:** Packages are created manually without rigid forced tier assumptions or locked discounts.
- **Fields:** Package Name, Total Session Count (freely entered), Total Package Price EGP (freely entered), Advance Deposit Paid EGP, and Payment Method.

#### Feature 20: 60-Day Expiration & Auto-Forfeiture Lifecycle
- **Description:** Every treatment package records a `purchaseDate` and calculates an `expiryDate` equal to `purchaseDate + 60 days`.
- **Behavior:**
  - Active packages display an active **"X days left"** pill.
  - Booking sessions dated after `expiryDate` is blocked.
  - Once the calendar date passes `expiryDate`, remaining uncompleted sessions are automatically marked as `forfeited`.

#### Feature 21: Admin-Only Package Expiry Extension
- **Description:** Allows an Admin or Co-Admin to extend a package's validity period.
- **Form Fields:**
  1. `Additional Days to Extend` (Number, Required, 1 to 365 days, default 30).
  2. `Extension Reason` (Textarea, Required): Mandatory administrative justification (e.g. patient surgery, travel, medical hiatus).
- **Behavior:** Updates `expiryDate`, restores forfeited packages to active status, and writes an audit log entry.

#### Feature 22: Dynamic Package Financial Ledger
- **Description:** Package `amountPaid` and `balanceDue` are dynamically calculated by summing all linked non-voided receipts (`totalPrice - sum(receipts)`).

---

### Module 6: Billing, Payments & Receipt Management

#### Feature 23: Multi-Entity Flexible Payment Recording
- **Description:** Allows collecting payments linked to:
  1. A Treatment Package (settling package installments).
  2. A Specific Appointment (single therapy session, assessment, diet visit).
  3. A Direct Patient Account (general deposit or advance payment).
- **Form Fields:**
  1. `Payment Amount` (Number EGP, Required, greater than 0).
  2. `Payment Method` (Select, Required): Options: `InstaPay` (إنستاباي), `Vodafone Cash` (فودافون كاش), `Cash` (نقدي / كاش), `Visa / Card` (فيزا / بطاقة بنكية), `Fawry` (فوري).
  3. `Transfer Screenshot / Bill Image Upload` (File / Camera, Optional): Automatically compressed via Canvas to WebP (< 50 KB).
  4. `Internal Payment Notes` (Textarea, Optional): Transaction reference or payer notes.

#### Feature 24: Overpayment Prevention Guardrail
- **Description:** If a payment is recorded against a package or appointment, the system compares the entered amount against the remaining balance. If `amount > remainingBalance`, the submission is blocked with an explicit error message (e.g. `Payment amount (500 EGP) exceeds remaining balance (300 EGP)`).

#### Feature 25: Sequential Receipt Numbering System
- **Description:** Generates unique, strictly sequential receipt numbers per fiscal year in the standardized format `INV-YYYY-XXXXX` (e.g. `INV-2026-00001`, `INV-2026-00002`).

#### Feature 26: Admin-Only Receipt Voiding Workflow
- **Description:** Enables Admins to void an erroneously recorded receipt.
- **Form Fields:**
  1. `Void Reason` (Textarea, Required): Mandatory explanation (e.g. entered wrong amount, duplicate transfer, patient refund).
- **Behavior:** Marks `isVoided = true`, stores `voidedAt`, `voidedBy`, and `voidReason`. The receipt remains permanently visible on the ledger struck-through with a `[VOIDED]` badge and is automatically deducted from all revenue totals.

#### Feature 27: Visual Appointment Payment Status Indicators
- **Description:** Displays payment status pills across calendar cards and appointment popovers:
  - `Package` (Teal): Covered under an active package.
  - `Paid` (Emerald): Fully paid per-session booking.
  - `Due` (Amber): Partially paid with outstanding balance.
  - `Unpaid` (Rose): No payment recorded yet.

---

### Module 7: Clinic Expenses, Petty Cash & Equipment Asset Tracking

#### Feature 28: Petty Cash & Operating Expense Logger
- **Description:** Allows recording facility operating expenses and medical supplies.
- **Form Fields:**
  1. `Expense Title` (Text, Required): Description of item purchased.
  2. `Amount` (Number EGP, Required, greater than 0).
  3. `Category` (Select, Required):
     - `Medical & Therapy Supplies` (supplies)
     - `Equipment & Machines Asset` (equipment)
     - `Facility Maintenance` (maintenance)
     - `Clinic Rent & Lease` (rent)
     - `Utilities: Electricity, Water & Internet` (utilities)
     - `Doctor Commission Payout` (doctor_payout)
     - `Staff Salaries` (salaries)
     - `Hospitality & Patient Coffee` (hospitality)
     - `Advertising & Marketing` (marketing)
     - `Miscellaneous Other` (other)
  4. `Payment Method` (Select, Required): Cash, InstaPay, Vodafone Cash, Visa, Fawry.
  5. `Date` (Date, Required, defaults to today).
  6. `Reason / Justification` (Textarea, Required): Mandatory business reason for expense.
  7. `Notes` (Text, Optional).

#### Feature 29: Expense Edit Tracking & Audit Log
- **Description:** When an Admin edits an expense amount, the system requires a reason and stores an immutable audit history entry (`editedAt`, `editedBy`, `userRole`, `previousAmount`, `newAmount`, `reason`).

#### Feature 30: Receptionist Expense Scope Isolation
- **Description:** Receptionists can only log and view expenses recorded for today's date (`date === today`). Historical months and past financial records are hidden.

#### Feature 31: Capital Equipment Asset Register
- **Description:** Dedicated filter isolating capital assets (`equipment` and `maintenance`) to track clinic machinery investments (e.g. Ultrasound units, Shockwave devices, Parallel bars).

---

### Module 8: Staff Administration, Security & Access Control

#### Feature 32: Staff Directory & Profile Administration
- **Description:** Admin panel to manage clinic employees.
- **Form Fields (Add Staff):**
  1. `Full Name` (Text, Required).
  2. `Email Address` (Email, Required).
  3. `Egyptian Phone Number` (Text, Optional).
  4. `Clinical Specialty / Position` (Text, Required).
  5. `System Role` (Select, Required): `Admin`, `Co-Admin`, `Receptionist`, `Physiotherapist`, `Diet Doctor`, `Dev`.
  6. `Commission Rate` (Number %, Optional, 0-100%).
  7. `Initial Password` (Password, Required).
  8. `Password Hint` (Text, Optional).

#### Feature 33: Staff Password Management & Reset
- **Description:** Admin modal to update any staff member's password, with password confirmation validation and optional hint updates.

#### Feature 34: Doctor Commission Engine & Expense Payout Integration
- **Description:** Calculates earned commissions based on completed sessions multiplied by baseline rates and doctor commission rates. Clicking "Payout Commission" prompts for confirmation, logs an expense under `doctor_payout`, and writes an audit log.

#### Feature 35: Treatment Room & Bed Capacity Manager
- **Description:** Allows adding, renaming, activating/deactivating rooms, and configuring bed counts (1 or 2 beds per room).

#### Feature 36: Wi-Fi SSID & IP Geofence Security Guard
- **Description:** Clinical data protection rule restricting physiotherapists and diet doctors from accessing patient charts unless connected to the clinic's authorized Wi-Fi network (`Masaar_Staff_5G`). Includes an administrative testing simulator override toggle.

#### Feature 37: User Switcher & Fast Role Gateway
- **Description:** Modal accessible from the top navigation bar allowing quick role switching by entering the staff member's password.

---

### Module 9: Notifications, Real-Time Alerts & Follow-Ups

#### Feature 38: Real-Time Patient Arrival & Lateness Notifications
- **Description:** Automatically generates alerts when:
  1. A patient checks in at reception (`Patient Arrived: In Waiting Area`).
  2. A patient arrives late past their scheduled time (`Late Arrival: X minutes late`).
  3. An appointment is rescheduled or cancelled.
- **Behavior:** Displayed in the top notification bell dropdown with dismiss controls.

#### Feature 39: Low-Balance & Renewal Alert Engine
- **Description:** Proactively identifies patients whose packages have ≤ 1 session remaining or have overdue balances. Accessible via the top alert bell icon.

---

### Module 10: Zero-Cost WhatsApp Communication Engine

The platform integrates directly with WhatsApp Web and mobile apps via zero-cost `https://wa.me/` protocol links.

#### Feature 40: WhatsApp Message Customizer Modal
- **Description:** Allows reviewing and editing message text before launching WhatsApp.

#### Verbatim WhatsApp Message Templates:

##### Template 1: Welcome & Patient Intake Confirmation (`welcomeIntake`)
- **Arabic Version:**
```text
مرحباً {patientName} 👋
أهلاً بك في عيادة {clinicName}.
تم تسجيل بياناتك بنجاح وسيتواصل معك الفريق لتأكيد مواعيد جلساتك.
نتمنى لك دوام الصحة والعافية!
```
- **English Version:**
```text
Hello {patientName},
Welcome to {clinicName}. Your intake has been registered successfully. Our team will contact you shortly to confirm your session schedule.
Wishing you a rapid recovery!
```

##### Template 2: Upcoming Appointment Reminder (`appointmentReminder`)
- **Arabic Version:**
```text
تذكير بموعد الجلسة 🩺

أهلاً {patientName}،
نذكرك بموعد جلستك القادمة مع {doctorName} في {clinicName}:
📅 التاريخ: {date}
⏰ الوقت: {time}

يرجى الحضور قبل الموعد بـ 10 دقائق. لتأكيد أو تعديل الموعد برجاء الرد على هذه الرسالة.
```
- **English Version:**
```text
Session Reminder 🩺

Dear {patientName},
This is a reminder for your upcoming session with {doctorName} at {clinicName}:
📅 Date: {date}
⏰ Time: {time}

Please arrive 10 minutes prior. To confirm or reschedule, reply directly to this message.
```

##### Template 3: Appointment Reschedule Notice (`rescheduleNotice`)
- **Arabic Version:**
```text
تعديل موعد جلسة العلاج الطبيعي 🔄

أهلاً {patientName}،
تم تعديل موعد جلستك مع {doctorName} في مركز {clinicName}:
📅 التاريخ: {date}
⏰ الموعد الجديد: {newTime} (الموعد السابق: {oldTime})

يسعدنا تأكيدك للموعد الجديد!
```
- **English Version:**
```text
Appointment Rescheduled 🔄

Dear {patientName},
Your session with {doctorName} at {clinicName} has been adjusted:
📅 Date: {date}
⏰ New Time: {newTime} (Previously: {oldTime})

Please let us know if this time suits you!
```

##### Template 4: Low Session Balance & Package Renewal Alert (`lowSessionAlert`)
- **Arabic Version:**
```text
أهلاً {patientName} 🌸
نحيطك علماً بأنه متبقي لديك ({remainingSessions}) جلسة فقط من باقة العلاج الطبيعي الخاصة بك:
"{packageName}".

لضمان استمرار الخطة العلاجية دون انقطاع، يسعدنا تجديد الباقة وتثبيت مواعيدك مع الأخصائي المعالج. مركز {clinicName}.
```
- **English Version:**
```text
Dear {patientName} 🌸
Friendly notice from {clinicName}: You have only ({remainingSessions}) session(s) left in your package: "{packageName}".
To guarantee uninterrupted recovery, we are glad to assist you with renewing your package.
```

##### Template 5: Pending Balance Due Reminder (`balanceDueReminder`)
- **Arabic Version:**
```text
أهلاً {patientName} 📋
تحية طيبة من مركز {clinicName}.
نود تذكيرك بالرصيد المتبقي على باقة العلاج الطبيعي ({packageName}):
المبلغ المستحق: {balanceDue} ج.م.

يمكنك السداد عبر إنستاباي (InstaPay) أو فودافون كاش أو بالعيادة نقداً/فيزا.
لأي استفسار يسعدنا تواصلك دائماً!
```
- **English Version:**
```text
Dear {patientName} 📋
Greetings from {clinicName}.
Friendly reminder regarding the pending balance for package ({packageName}):
Amount Due: {balanceDue} EGP.
Payment can be made via InstaPay, Vodafone Cash, or in-clinic (Cash/Card). Thank you!
```

---

### Module 11: Business Intelligence, CSV Data Exports & Audit Trail

#### Feature 41: Patient Directory CSV Export
- **Columns (Arabic):** `المعرف`, `الاسم بالكامل`, `الهاتف (مصري)`, `نوع الدفع`, `العمر`, `النوع`, `الحالة`, `التشخيص`, `إجمالي الجلسات`, `المتبقي`, `الرصيد المستحق (ج.م)`.
- **Columns (English):** `ID`, `Full Name`, `Phone (Egyptian)`, `Payment Type`, `Age`, `Gender`, `Status`, `Diagnosis`, `Total Sessions`, `Remaining`, `Balance Due (EGP)`.

#### Feature 42: Financial Receipts CSV Export
- **Columns (Arabic):** `المعرف`, `التاريخ والوقت`, `المريض`, `الباقة`, `المبلغ (ج.م)`, `طريقة الدفع`, `المسؤول`, `ملاحظات`.
- **Columns (English):** `Receipt ID`, `Date & Time`, `Patient Name`, `Package`, `Amount (EGP)`, `Payment Method`, `Collected By`, `Notes`.

#### Feature 43: Operating Expenses CSV Export
- **Columns (Arabic):** `المعرف`, `التاريخ`, `العنوان والوصف`, `سبب ومبرر الصرف`, `التصنيف`, `المبلغ (ج.م)`, `طريقة الدفع`, `المسؤول`.
- **Columns (English):** `Expense ID`, `Date`, `Title & Description`, `Reason / Justification`, `Category`, `Amount (EGP)`, `Payment Method`, `Logged By`.

#### Feature 44: Complete JSON Database Backup Export
- **Description:** Generates a full formatted JSON backup file containing clinic profile, patients, appointments, packages, receipts, rooms, expenses, and audit logs.

#### Feature 45: Comprehensive Immutable Audit Trail
- **Description:** System-wide audit logging tracking:
  - `Who`: User ID, Name, Role.
  - `When`: ISO timestamp.
  - `What`: Action identifier and detailed text description.
  - `Before / After`: Data snapshots capturing pre-change and post-change states.
- **Audited Events:** Patient Creation, Patient Editing, Appointment Booking, Rescheduling, Cancellation, No-Show, Patient Check-In, Payment Collection, Receipt Voiding, Package Expiry Extension, Doctor Commission Payout, Expense Creation/Editing, and Security Configuration Changes.

---

## 5. Data Entities & Schema Specifications

```
+-----------------------------------------------------------------------------------+
|                              ENTITY RELATIONSHIP MAP                              |
|                                                                                   |
|  [ Clinic ]                                                                       |
|     |-- has many --> [ ClinicRoom ] -- has many --> [ Bed (1..2) ]                |
|     |-- has many --> [ User (Staff) ]                                             |
|     |-- has many --> [ Patient ]                                                  |
|                         |-- has many --> [ TreatmentPackage ]                     |
|                         |-- has many --> [ Appointment ]                          |
|                         |-- has many --> [ PaymentReceipt ]                       |
|                         |-- has many --> [ PatientDocument ]                      |
|                         |-- has many --> [ InBodyRecord ]                         |
|     |-- has many --> [ ClinicExpense ] -- tracks --> [ ExpenseEditHistory ]       |
|     |-- has many --> [ AuditLog ]                                                 |
|     |-- has many --> [ ClinicNotification ]                                       |
+-----------------------------------------------------------------------------------+
```

### 5.1 Clinic Profile (`Clinic`)
- `id`: Unique identifier string.
- `name`: English clinic name.
- `nameAr`: Arabic clinic name.
- `branch`: English branch designation.
- `branchAr`: Arabic branch designation.
- `address`: Full clinic street address in English.
- `addressAr`: Full clinic street address in Arabic.
- `phone`: Primary clinic landline/mobile contact.
- `currency`: Primary financial currency code (`EGP`).
- `pricingConfig`: Sub-entity containing baseline single session price, assessment price, home visit price.
- `workingHours`: Sub-entity containing start hour (9), end hour (21), slot duration minutes (60).
- `securityConfig`: Sub-entity containing geofence enabled boolean, authorized clinic Wi-Fi SSID, allowed IP addresses array, location simulator state (`inside_clinic` / `outside_clinic`).

### 5.2 User / Staff Member (`User`)
- `id`: Unique staff identifier.
- `clinicId`: Foreign key linking to clinic.
- `name`: Staff full legal name.
- `email`: Official login email address.
- `role`: One of 6 system roles (`admin`, `co_admin`, `receptionist`, `physiotherapist`, `diet_doctor`, `dev`).
- `specialty`: Clinical title, degree, or job function.
- `commissionRate`: Doctor commission percentage (e.g. 25%) or session amount.
- `avatar`: Initials string used for avatars.
- `phone`: Mobile phone contact.
- `password`: System access password.
- `passwordHint`: Administrative reminder hint.

### 5.3 Patient / Lead (`Patient`)
- `id`: Unique patient identifier (e.g. `pat-01`).
- `clinicId`: Clinic identifier.
- `fullName`: Full legal name.
- `phone`: Normalized Egyptian mobile number.
- `whatsapp`: WhatsApp contact number.
- `age`: Age in years.
- `gender`: Gender (`male` / `female`).
- `status`: Patient lifecycle state (`active` / `lead`).
- `paymentType`: Primary billing arrangement (`package` / `cash` / `insurance`).
- `insuranceCompany`: Name of insurance provider if applicable.
- `referringDoctor`: Referring specialist, clinic, or source.
- `primaryDiagnosis`: Medical diagnosis.
- `assignedPhysioId`: ID of primary attending physiotherapist.
- `medicalAlerts`: Array of medical risk alert strings.
- `notes`: General intake notes.
- `documents`: Embedded array of attached patient medical documents.
- `createdAt`: ISO registration timestamp.

### 5.4 Patient Medical Document (`PatientDocument`)
- `id`: Unique document identifier.
- `patientId`: Linking patient ID.
- `clinicId`: Clinic ID.
- `title`: Document title or scan name.
- `type`: Document category (`prescription`, `xray`, `mri`, `lab_report`, `other`).
- `fileData`: Base64 compressed image string (WebP format).
- `uploadedAt`: ISO upload timestamp.
- `uploadedBy`: Name or role of staff member who uploaded document.
- `notes`: Clinical interpretation notes.

### 5.5 Treatment Package (`TreatmentPackage`)
- `id`: Unique package identifier.
- `clinicId`: Clinic ID.
- `patientId`: Foreign key to patient.
- `packageName`: Descriptive protocol name.
- `totalSessions`: Total purchased therapy sessions count.
- `completedSessions`: Fulfilled sessions count.
- `remainingSessions`: Sessions remaining to be fulfilled.
- `totalPrice`: Total contractual package price (EGP).
- `amountPaid`: Sum of linked non-voided receipts (EGP).
- `balanceDue`: Outstanding receivables (`totalPrice - amountPaid`).
- `paymentMethod`: Initial payment method.
- `status`: Package status (`active`, `completed`, `expired`, `forfeited`).
- `startDate`: Package start date string (YYYY-MM-DD).
- `purchaseDate`: Official date of enrollment.
- `expiryDate`: Validity cutoff date (`purchaseDate + 60 days`).
- `receipts`: Embedded or associated array of payment receipts.

### 5.6 Appointment (`Appointment`)
- `id`: Unique appointment identifier.
- `clinicId`: Clinic ID.
- `patientId`: Linked patient ID.
- `physioId`: Attending doctor ID.
- `packageId`: Optional linked treatment package ID.
- `date`: Appointment date (YYYY-MM-DD).
- `startTime`: Start time string (HH:MM, 24-hour format).
- `duration`: Session duration in minutes (15-min increments, 15 to 180).
- `price`: Session price in EGP (required, entered at booking).
- `roomOrBed`: Human-readable room and bed label.
- `roomId`: Specific treatment room ID.
- `bedNumber`: Specific bed number (1 or 2).
- `status`: Scheduling state (`scheduled`, `arrived`, `completed`, `cancelled`, `no-show`, `waitlisted`).
- `sessionType`: Clinical category (`physiotherapy`, `nutrition`, `consultant_assessment`).
- `arrivedAt`: Patient check-in timestamp.
- `delayMinutes`: Calculated minutes late if checked in past scheduled time.
- `earlyMinutes`: Calculated minutes early.
- `painScore`: 1-10 numerical pain rating score.
- `soapNotes`: Sub-entity containing Subjective, Objective, Assessment, Plan.
- `doctorNotes`: Post-session clinical observation text.
- `homeExercises`: Prescribed home exercise routine text.
- `attachments`: Array of attached document or scan strings.
- `cancellationReason`: Reason text for cancellation.
- `cancelledAt`: Timestamp when cancelled.
- `noShowReason`: Reason text for no-show.
- `markedNoShowAt`: Timestamp when marked no-show.

### 5.7 Payment Receipt (`PaymentReceipt`)
- `id`: Unique receipt record ID.
- `clinicId`: Clinic ID.
- `receiptNumber`: Sequential invoice code (e.g. `INV-2026-00001`).
- `packageId`: Optional linked package ID.
- `appointmentId`: Optional linked appointment ID.
- `patientId`: Linked patient ID.
- `amount`: Collected amount in EGP.
- `paymentMethod`: Payment channel (`instapay`, `vodafone_cash`, `fawry`, `cash`, `visa`).
- `date`: ISO timestamp or YYYY-MM-DD date.
- `receiptImage`: Base64 compressed transfer screenshot.
- `notes`: Payment description or reference number.
- `collectedBy`: Name of receptionist or cashier.
- `isVoided`: Boolean flag indicating if receipt was voided.
- `voidedAt`: Timestamp when voided.
- `voidedBy`: Admin name who voided receipt.
- `voidReason`: Mandatory reason text explaining why receipt was voided.

### 5.8 Clinic Expense & Asset (`ClinicExpense`)
- `id`: Unique expense ID.
- `clinicId`: Clinic ID.
- `title`: Item description or vendor name.
- `amount`: Expense amount in EGP.
- `category`: Expense category (`supplies`, `equipment`, `maintenance`, `utilities`, `rent`, `marketing`, `salaries`, `hospitality`, `doctor_payout`, `other`).
- `paymentMethod`: Payment channel.
- `date`: Date of expenditure (YYYY-MM-DD).
- `loggedBy`: Name of staff member who entered expense.
- `loggedById`: ID of user who entered expense.
- `reason`: Mandatory business justification text.
- `receiptImage`: Base64 receipt image.
- `notes`: Internal notes.
- `editHistory`: Array of edit history entries tracking amount adjustments.
- `createdAt`: ISO creation timestamp.
- `updatedAt`: ISO modification timestamp.

### 5.9 Bioimpedance InBody Record (`InBodyRecord`)
- `id`: Unique record ID.
- `patientId`: Linked patient ID.
- `date`: Date of measurement.
- `weightKg`: Total body weight in kilograms.
- `targetWeightKg`: Clinical goal weight in kilograms.
- `skeletalMuscleMassKg`: Skeletal muscle mass in kilograms.
- `bodyFatPercentage`: Body fat percentage.
- `visceralFatLevel`: Visceral adipose tissue rating (1-20).
- `bmi`: Calculated Body Mass Index.
- `bmrKcal`: Calculated Basal Metabolic Rate in kilocalories.
- `dailyCalorieTarget`: Prescribed daily caloric intake.
- `proteinGrams`: Daily protein target in grams.
- `carbsGrams`: Daily carbohydrate target in grams.
- `fatsGrams`: Daily dietary fat target in grams.
- `protocol`: Selected nutritional protocol code.

### 5.10 Audit Log Entry (`AuditLog`)
- `id`: Unique audit log ID.
- `clinicId`: Clinic ID.
- `userId`: ID of actor who triggered event.
- `userName`: Full name of actor.
- `userRole`: Role of actor at time of event.
- `action`: Standardized event code (e.g. `patient_create`, `booking`, `void`, `package_extension`).
- `details`: Human-readable summary of action.
- `before`: Snapshot of entity state prior to action.
- `after`: Snapshot of entity state following action.
- `timestamp`: ISO timestamp of event.

---

## 6. Business Rules, Constraints & Validation Logic

### 6.1 Patient Rules
- **Phone Uniqueness:** Every patient must have a unique phone number. Numbers are normalized (`normalizeEgyptianPhone`) to match standard 11 digits `01XXXXXXXXX`. If an identical number exists, registration is blocked.
- **Egyptian Format Validation:** Phone numbers must match `/^(\+20|0)?1[0125][0-9]{8}$/`.
- **Duplicate Name Warning:** If an intake name matches an existing patient, the user receives a confirmation warning dialog but is not blocked.
- **Prior Assessment Exemption:** Patients are NOT required to undergo a prior consultant evaluation before booking physiotherapy treatment sessions.

### 6.2 Scheduling & Calendar Overlap Rules
- **Time Interval Overlap Equation:** Two appointments for the same doctor or the same room bed conflict if and only if:
  $$\text{NewStart} < \text{ExistingEnd} \quad \text{AND} \quad \text{NewEnd} > \text{ExistingStart}$$
  where $\text{End} = \text{Start} + \text{Duration}$.
- **Daily Doctor Caseload Limit:** A doctor cannot exceed 10 appointments per day.
- **Room Bed Capacity:** Rooms with 2 beds allow up to 2 concurrent bookings; rooms with 1 bed allow only 1.
- **Waitlist Behavior:** Moving an appointment to the waitlist sets status to `waitlisted` and preserves duration and price; it does NOT delete the record.

### 6.3 Treatment Package Lifecycle Rules
- **Free Package Pricing:** Session counts and package prices are entered manually with no rigid tiers.
- **60-Day Validity Window:** Expiry date is calculated as `purchaseDate + 60 days`.
- **Post-Expiry Booking Block:** The scheduling engine blocks booking sessions on dates after `expiryDate`.
- **Forfeiture Rule:** If the current date exceeds `expiryDate` and remaining sessions exist, status becomes `forfeited`.
- **Admin Extension Rule:** Only Admins/Co-Admins can extend packages. A non-empty reason is required and logged to audit.
- **Session Deduction Rule:** Package sessions are deducted ONLY upon doctor session completion. Check-in, cancellation, and no-show NEVER deduct sessions.

### 6.4 Billing & Revenue Integrity Rules
- **Overpayment Guardrail:** Payments exceeding remaining balance (`amount > remainingBalance`) are strictly blocked.
- **Dynamic Balances:** `amountPaid` and `balanceDue` are dynamically calculated from non-voided receipts.
- **Sequential Invoices:** Receipt numbers follow `INV-YYYY-XXXXX`, incrementing sequentially.
- **Voiding Rule:** Only Admins/Co-Admins can void receipts. Voiding requires a mandatory reason, excludes the receipt from revenue totals, displays it struck-through, and logs the action to audit.
- **Price Modification Lock:** If a payment exists for an appointment, only an Admin can change its price.

### 6.5 Clinical & Operational Rules
- **Geofence Enforcement:** Physiotherapists and Diet Doctors are blocked from opening patient charts if connected outside the authorized clinic Wi-Fi network.
- **Receptionist Clinical Masking:** Receptionists cannot view or edit doctor clinical SOAP notes or medical document attachments.
- **Receptionist Expense Scope:** Receptionists can only log and view expenses dated today (`date === today`).
- **Audit Logging Mandate:** All critical clinical, financial, and scheduling actions must write an audit record with before/after snapshots.

---

## 7. Feature Implementation Status Matrix

The following matrix documents the operational status of every feature in the codebase:

```
+----+---------------------------------------------------+--------------------+
| #  | Feature Name                                      | Status             |
+----+---------------------------------------------------+--------------------+
| 1  | Patient Registration Wizard                       | WORKING            |
| 2  | Egyptian Phone Uniqueness & Normalization         | WORKING            |
| 3  | Patient Profile Editing & Guardrails              | WORKING            |
| 4  | Patient Documents & Scans (Anti-Screenshot)       | WORKING            |
| 5  | Patient Discharge & Case Archive                  | WORKING            |
| 6  | Multi-Resource Room & Bed Calendar Grid           | WORKING            |
| 7  | Flexible Appointment Booking Modal                | WORKING            |
| 8  | Centralized Conflict & Constraint Detection       | WORKING            |
| 9  | Drag-and-Drop Appointment Rescheduling            | WORKING            |
| 10 | Scheduling Waitlist Management                    | WORKING            |
| 11 | Patient Arrival Check-In Workflow                 | WORKING            |
| 12 | Appointment Reschedule Modal with Price Lock      | WORKING            |
| 13 | Cancellation & No-Show Reason Tracking            | WORKING            |
| 14 | Doctor Session Completion & Charting Modal        | WORKING            |
| 15 | Structured SOAP Clinical Notes                    | WORKING            |
| 16 | Numerical Pain Rating Scale (NPRS 1-10)           | WORKING            |
| 17 | Home Exercise Regimen Prescription                | WORKING            |
| 18 | InBody Bioimpedance & Nutrition Protocol Logger   | WORKING            |
| 19 | Manual Package Creation with Free Pricing         | WORKING            |
| 20 | 60-Day Package Expiry & Forfeiture Engine         | WORKING            |
| 21 | Admin-Only Package Expiry Extension               | WORKING            |
| 22 | Dynamic Package Financial Ledger                  | WORKING            |
| 23 | Multi-Entity Flexible Payment Recording           | WORKING            |
| 24 | Overpayment Prevention Guardrail                  | WORKING            |
| 25 | Sequential Receipt Numbering System               | WORKING            |
| 26 | Admin-Only Receipt Voiding Workflow               | WORKING            |
| 27 | Visual Appointment Payment Status Indicators      | WORKING            |
| 28 | Petty Cash & Operating Expense Logger             | WORKING            |
| 29 | Expense Edit History & Reason Tracking            | WORKING            |
| 30 | Receptionist Expense Scope Isolation              | WORKING            |
| 31 | Capital Equipment Asset Register                  | WORKING            |
| 32 | Staff Directory & Employee Administration         | WORKING            |
| 33 | Staff Password Management & Reset                 | WORKING            |
| 34 | Doctor Commission Calculation & Payout Logger     | WORKING            |
| 35 | Treatment Room & Bed Capacity Manager             | WORKING            |
| 36 | Wi-Fi SSID & IP Geofence Security Guard           | WORKING            |
| 37 | User Switcher & Fast Role Gateway                 | WORKING            |
| 38 | Real-Time Patient Arrival & Lateness Alerts       | WORKING            |
| 39 | Low-Balance & Package Renewal Alert Engine        | WORKING            |
| 40 | WhatsApp Message Customizer Modal                 | WORKING            |
| 41 | Patient Directory CSV Data Export                 | WORKING            |
| 42 | Financial Receipts CSV Data Export                | WORKING            |
| 43 | Operating Expenses CSV Data Export                | WORKING            |
| 44 | Complete JSON Clinic Database Backup Export        | WORKING            |
| 45 | Comprehensive Immutable Audit Trail               | WORKING            |
+----+---------------------------------------------------+--------------------+
```

---

## 8. Default & Demo Data Reference

### 8.1 Clinic Profile Reference
- **Clinic ID:** `clinic-cairo-01`
- **Name:** Masaar Clinic (عيادة مسار)
- **Branch:** Main Center (الفرع الرئيسي)
- **Address:** 14 Road 213, Degla, Maadi, Cairo, Egypt
- **Phone:** +201002345678
- **Currency:** EGP (ج.م)
- **Baseline Pricing:**
  - Single Therapy Session: 450 EGP
  - Initial Evaluation / Consultant Assessment: 600 EGP
  - Home Visit Session: 850 EGP

### 8.2 Treatment Rooms & Bed Capacities
- **Room 1 (غرفة ١):** 2 Beds (Bed 1, Bed 2) — Electrotherapy & Manual Therapy.
- **Room 2 (غرفة ٢):** 2 Beds (Bed 1, Bed 2) — Shockwave, Laser & Cryotherapy.
- **Room 3 (غرفة ٣):** 1 Bed (Bed 1) — Head Consultant Assessment & Neuro.
- **Room 4 (غرفة ٤):** 1 Bed (Bed 1) — Clinical Nutrition & InBody Unit.

### 8.3 Standard Demo User Accounts
1. **Dr. Tarek Mansour (Admin / Owner):**
   - Role: `admin`
   - Specialty: Consultant Orthopedic & Sports Physio (PhD)
   - Email: `tarek.mansour@masarclinic.eg`
   - Password: `admin`
2. **Mariam El-Shennawy (Receptionist):**
   - Role: `receptionist`
   - Specialty: Head of Front Desk & Patient Relations
   - Email: `mariam.reception@masarclinic.eg`
   - Password: `front`
3. **Dr. Ahmed Radwan (Physiotherapist):**
   - Role: `physiotherapist`
   - Specialty: Senior Sports Injury & Spine Specialist
   - Email: `ahmed.radwan@masarclinic.eg`
   - Commission: 25%
   - Password: `doc`
4. **Dr. Nourhan Adel (Physiotherapist):**
   - Role: `physiotherapist`
   - Specialty: Pediatric & Neurological Rehab Specialist
   - Email: `nourhan.adel@masarclinic.eg`
   - Commission: 20%
   - Password: `doc`
5. **Eng. Karim El-Sayed (Co-Admin):**
   - Role: `co_admin`
   - Specialty: Managing Partner & Executive Operations
   - Email: `karim.partner@masarclinic.eg`
   - Password: `coadmin`
6. **Dr. Salma Hegazy (Diet Doctor):**
   - Role: `diet_doctor`
   - Specialty: Clinical Nutrition & Medical Diet Consultant
   - Email: `salma.nutrition@masarclinic.eg`
   - Commission: 30%
   - Password: `doc`
7. **Eng. Mostafa (Lead Systems Dev):**
   - Role: `dev`
   - Specialty: Lead Systems Architect & Security Engineer
   - Email: `dev@masarclinic.eg`
   - Password: `admin`

### 8.4 Standard Package Templates (Reference Tiers)
1. **6-Session Targeted Recovery (باقة التعافي المركز):** 2,500 EGP (Acute sprains, localized joint relief).
2. **10-Session Comprehensive Rehab (باقة التأهيل المتكامل):** 4,000 EGP (Lumbar disc herniation, sciatica).
3. **12-Session Sports & Post-Op Protocol (باقة الرياضيين وما بعد الجراحة):** 4,800 EGP (ACL rehab, rotator cuff).
4. **16-Session Neurological Neuro-Facilitation (باقة التأهيل العصبي والحركي):** 6,800 EGP (Stroke recovery, balance).

---

## 9. Open Questions & Future Database Integration Notes

The following architectural and business considerations are identified for implementation when the PostgreSQL/server backend replaces client-side storage:

1. **Multi-Branch Tenant Partitioning:**
   - *Current Behavior:* Clinic ID is currently structured as `clinic-cairo-01`.
   - *Database Recommendation:* Enforce row-level tenant security (RLS) on all database tables partitioned by `clinic_id` and `branch_id` to support future multi-branch clinic expansions.
2. **Electronic Invoicing Integration (ETA Egypt):**
   - *Current Behavior:* Sequential receipts (`INV-YYYY-XXXXX`) are generated internally.
   - *Database Recommendation:* Integrate an asynchronous webhook queue to submit receipts to the Egyptian Tax Authority (ETA) e-Invoicing API for formal B2C tax compliance.
3. **SMS & Official WhatsApp Cloud API Fallback:**
   - *Current Behavior:* WhatsApp links rely on the client browser opening `https://wa.me/`.
   - *Database Recommendation:* Complement client-side messaging with server-side WhatsApp Cloud API webhooks (Meta Graph API) to dispatch automated unattended reminders 24 hours prior to appointments.
4. **Document Storage Migration:**
   - *Current Behavior:* Image scans and receipts are compressed to WebP format and stored in memory.
   - *Database Recommendation:* Store file uploads in private S3/GCS object storage buckets with pre-signed expiration URLs and anti-hotlinking tokens to scale storage efficiently.
5. **Real-Time WebSocket Sync for Calendars:**
   - *Current Behavior:* Clinic context manages state locally in the user session.
   - *Database Recommendation:* Implement WebSocket room broadcasts (e.g. Supabase Realtime or Socket.io) so that when a receptionist checks in a patient or reschedules a slot, all doctors' screens update instantly without manual refreshing.

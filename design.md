# Masaar CRM - UI/UX Design Specification

## 1. Global Theming & Aesthetics
The CRM utilizes a modern, premium aesthetic inspired by Shadcn UI and Radix primitives, featuring a dual-theme (Dark/Light) system, rounded corners, and soft contrast.

*   **Dark Mode (Default):** 
    *   Backgrounds: Soft, modern dark slate/zinc (`#09090b` or `#18181b`).
    *   Borders: Thin, subtle, low-contrast dark gray (`#27272a` or `zinc-800`).
    *   Text: High-contrast white/off-white for primary, muted zinc for secondary.
*   **Light Mode:**
    *   Backgrounds: Airy off-white/light gray (`#f9f9f9` or `zinc-50`).
    *   Borders: Light gray (`#e4e4e7` or `zinc-200`).
    *   Text: Dark slate (`#18181b`) for primary, medium gray for secondary.
*   **Typography:** Clean geometric sans-serif (Inter or Roboto) across all modes.
*   **Shapes:** Extensive use of pill shapes (`rounded-full`) for actions and bubble/soft-box shapes (`rounded-xl` / `12px-16px`) for structural containers.

## 2. Layout & Navigation
*   **Top Header:**
    *   **Brand:** "Masaar" in bold sans-serif with a subtle medical wave/heartbeat icon on the far left.
    *   **Theme Toggle:** A subtle Sun/Moon (☀️/🌙) icon button to switch between Light and Dark modes.
    *   **Action Buttons:** Pill-shaped (`rounded-full`). 
        *   Primary actions (like "+ Add event"): High contrast neutral (White bg in dark mode, Black bg in light mode).
        *   Secondary actions ("+ New Patient", "+ Today's Expense"): Outlined or soft tinted backgrounds.
    *   **Alerts & Language:** Pill-shaped toggle for "العربية" and a muted amber/yellow pill badge for "1 Alerts".
*   **Left Sidebar:**
    *   Blends seamlessly with the main background (separated only by a 1px subtle border).
    *   Active menu items (e.g., "Front Desk") use a slightly contrasted background shade (`bg-zinc-800` in dark, `bg-zinc-200` in light) to ground the user's location.

## 3. Daily Schedule & Grid
*   **Container:** The main "Daily Schedule" box features soft rounded corners (`rounded-xl`).
*   **Grid System:** Faint border lines separate time slots and rooms. Avoid harsh, boxy grids.
*   **Time Indicator:** A bright, thin horizontal red line spans across the grid to indicate the exact current time.

## 4. Appointment Cards (The "Bubble" View)
Appointments are rendered as "floating" pills/bubbles within their grid cells, featuring margins on all sides so they do not touch the grid lines.

*   **Typography Hierarchy:** Patient name is prominent (`font-semibold`), while the doctor's name beneath it is smaller and slightly faded (`text-sm`, lower opacity).
*   **Avatars:** A small, circular contrast badge containing the patient/doctor initials (e.g., "MT", "MK") sits on the top right of each card.
*   **Patient Categorization (Color-Coding System):**
    Each appointment card maps its styling to a `patientType` property:
    *   **Cash (`cash`):** 
        *   Style: Soft green background tint.
        *   Border: Thick green left border (`border-l-4 border-green-600`).
        *   Badge: Optional `$ Cash` pill or green dot.
    *   **Insurance (`insurance`):** 
        *   Style: Soft blue background tint.
        *   Border: Thick blue left border (`border-l-4 border-blue-600`).
        *   Badge: Small shield `🛡️ Insurance` label.
    *   **Package (`package`):** 
        *   Style: Soft purple background tint.
        *   Border: Thick purple left border (`border-l-4 border-purple-600`).
        *   Badge: Small box `📦 Package` label.

## 5. Empty States
*   **Patient List (Right Sidebar):** 
    *   When no unscheduled patients exist, display a deliberate empty state.
    *   Use a muted background block (e.g., `bg-zinc-900` in dark mode, `bg-zinc-100` in light mode).
    *   Include a faded, low-opacity icon (like a clipboard or empty calendar) centered above the text "No unscheduled patients currently."

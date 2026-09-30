# 2FA Manager Route Plan

## Overview
Create a new route (`/2fa`) and top navigation link in the application to manage Two-Factor Authentication (TOTP) accounts. Users can add accounts with an account Name and a 2FA secret key. The accounts are persisted as an array in `localStorage`. For security, the raw 2FA secret is never displayed in the UI after saving. Each entry presents the account name, the current live 6-digit TOTP code, a 1-click copy button with visual feedback, and a global countdown clock indicating seconds remaining before code expiration (RFC 6238 30-second cycle). The interface adheres to DaisyUI v5 components and the project's design system.

## Project Type
WEB

## Success Criteria
- **Top Navigation**: Link to "2FA" added in `src/routes/__root.tsx` navbar with active route styling (`menu-active`).
- **Route Setup**: `/2fa` route created with TanStack Router (`src/routes/2fa.tsx`).
- **Form to Append Entries**: Form with 2 fields:
  - `Name`: e.g. "GitHub", "AWS", "Google".
  - `2FA Secret`: Base32 secret string (with auto-trimming and space/dash removal) or `otpauth://` URI support.
- **Storage & Security**:
  - Saved as an array of entries in `localStorage` under `luke_tools_2fa_entries`.
  - The raw secret string is hidden from the UI after submission (never rendered in the entry cards).
- **Live Code Display & Copying**:
  - Calculates and renders current 6-digit TOTP code formatted cleanly (e.g. `123 456`) in monospace.
  - One-click copy button copies the 6-digit code to clipboard with "Copied!" visual feedback.
- **Countdown Clock**:
  - Displays remaining seconds (0-30s) in the current TOTP period.
  - Uses DaisyUI radial/progress component with visual warning as expiry approaches (< 5s).
  - Codes automatically recalculate synchronously across all entries upon cycle reset.
- **Management & Safety**:
  - Ability to delete individual entries with confirmation.
  - Empty state UI with helpful instructions when no entries exist.
- **Design & UI**:
  - Matches DaisyUI v5 cards, buttons, badges, and input controls.
  - Respects dark and light modes defined in `index.css` and `__root.tsx`.

## Tech Stack
- **Framework**: React 19 + Vite 8 + TypeScript
- **Routing**: TanStack Router (`@tanstack/react-router`)
- **Styling**: TailwindCSS v4 + DaisyUI v5
- **Icons**: `lucide-react` (already installed)
- **TOTP / Crypto**: `otpauth` (lightweight, zero-node-dependency, standard RFC 6238 compliance) or Web Crypto API (`crypto.subtle`)

## File Structure
```text
src/
  routes/
    __root.tsx               (Update: Add 2FA link in top navbar)
    2fa.tsx                  (New: TanStack Route component for 2FA manager)
  components/
    2fa/
      TwoFactorForm.tsx      (New: Form to add account name & secret)
      TwoFactorList.tsx      (New: Grid/List of 2FA cards)
      TwoFactorCard.tsx      (New: Single card with live code, copy button, delete)
      TwoFactorCountdown.tsx (New: Visual 30-second countdown indicator)
  lib/
    totp.ts                  (New: TOTP generation, validation, and storage helpers)
```

## Task Breakdown

### 1. Install or Implement TOTP Engine & Data Types
- **Task ID**: `totp-engine`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`, `app-builder`
- **Priority**: P0
- **Dependencies**: None
- **INPUT**:
  - Install `otpauth` using `pnpm add otpauth` (or create a Web Crypto implementation in `src/lib/totp.ts`).
  - Define `TwoFactorEntry` interface:
    ```ts
    export interface TwoFactorEntry {
      id: string;
      name: string;
      secret: string; // Base32 secret string (stored in localStorage)
      createdAt: number;
    }
    ```
  - Implement helper functions in `src/lib/totp.ts`:
    - `generateTOTP(secret: string): string`: Computes current 6-digit code.
    - `getTimeRemaining(): number`: Returns seconds remaining in current 30s period.
    - `cleanSecret(input: string): string`: Normalizes pasted secrets (removes spaces, parses `otpauth://` URIs).
    - `loadEntries(): TwoFactorEntry[]`: Loads and validates from `localStorage`.
    - `saveEntries(entries: TwoFactorEntry[]): void`: Persists array to `localStorage`.
- **OUTPUT**: Reusable `src/lib/totp.ts` with unit-tested math and storage logic.
- **VERIFY**: Run typecheck `npx tsc --noEmit`. Verify standard RFC 6238 test vector secret produces expected 6-digit code.

---

### 2. Update Top Navigation in `__root.tsx`
- **Task ID**: `nav-update`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`, `ui-styling`
- **Priority**: P1
- **Dependencies**: None
- **INPUT**:
  - Edit `src/routes/__root.tsx`.
  - Add navigation item under `ul.menu.menu-horizontal`:
    ```tsx
    <li>
      <Link
        to="/2fa"
        activeProps={{ className: "menu-active" }}
      >
        2FA
      </Link>
    </li>
    ```
- **OUTPUT**: 2FA link available in desktop & mobile navbar layout.
- **VERIFY**: Navbar displays "2FA" link and highlights active state when on `/2fa`.

---

### 3. Create Countdown & Entry Components
- **Task ID**: `components-countdown-card`
- **Agent**: `frontend-specialist`
- **Skills**: `ui-ux-pro-max`, `frontend-design`
- **Priority**: P1
- **Dependencies**: `totp-engine`
- **INPUT**:
  - Create `src/components/2fa/TwoFactorCountdown.tsx`:
    - DaisyUI `radial-progress` or circular countdown display.
    - Changes color to warning/accent when `< 5s` remaining.
    - Syncs with a `1000ms` interval timer.
  - Create `src/components/2fa/TwoFactorCard.tsx`:
    - Displays entry `name` and current 6-digit code.
    - Formats code with center space (`XXX XXX`) and `font-mono tracking-wider text-2xl font-bold`.
    - One-click copy button: Copies code to clipboard and shows "Copied!" with check icon for 2 seconds.
    - Delete button with trash icon and confirmation step.
    - Ensure raw secret is NOT rendered anywhere in DOM.
- **OUTPUT**: Polished, accessible card and countdown components.
- **VERIFY**: Code changes synchronously when countdown resets; copy action works cleanly.

---

### 4. Create TwoFactorForm & TwoFactorList
- **Task ID**: `components-form-list`
- **Agent**: `frontend-specialist`
- **Skills**: `ui-ux-pro-max`, `clean-code`
- **Priority**: P2
- **Dependencies**: `components-countdown-card`
- **INPUT**:
  - Create `src/components/2fa/TwoFactorForm.tsx`:
    - 2 fields: Name (text input) and 2FA (secret key input with paste convenience).
    - Secret input can use `type="password"` or toggleable mask so it's not visible over shoulder while entering.
    - Client-side validation: Name required, valid base32 characters.
    - "Add Entry" button (`btn btn-primary`).
    - Clear inputs immediately upon successful append.
  - Create `src/components/2fa/TwoFactorList.tsx`:
    - Responsive grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`).
    - Empty state when 0 entries: card explaining how to add an account with an icon.
- **OUTPUT**: Complete form and list views using DaisyUI tokens.
- **VERIFY**: Appending adds card to list, clears form, and saves to `localStorage`.

---

### 5. Create Route Page `src/routes/2fa.tsx`
- **Task ID**: `route-page`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`, `clean-code`
- **Priority**: P2
- **Dependencies**: `components-form-list`, `nav-update`
- **INPUT**:
  - Create `src/routes/2fa.tsx` with `createFileRoute("/2fa")`.
  - State management for entries list (initialized from `localStorage`).
  - Timer hook that updates seconds remaining every second and triggers recalculation of TOTP codes.
  - Layout:
    - Header with page title, description, and global countdown badge.
    - Collapse / Drawer or Side-by-Side layout: Form card on left/top, 2FA cards list on right/bottom.
- **OUTPUT**: Fully functional `/2fa` route.
- **VERIFY**: Page compiles without errors and TanStack router registers `/2fa`.

---

## Phase X: Verification
- [ ] Code formatting & lint: `pnpm run lint`
- [ ] TypeScript check: `npx tsc -b`
- [ ] Build verification: `pnpm run build`
- [ ] Functional checks:
  - [ ] Add entry with Name and Secret
  - [ ] Verify secret is NOT visible in the DOM or UI
  - [ ] Verify 6-digit TOTP code matches standard authenticator app (e.g. Google Authenticator)
  - [ ] Verify countdown clock counts down from 30 to 0 and codes refresh at 0
  - [ ] Verify copy button copies 6 digits and displays feedback
  - [ ] Verify entries persist across page reload (`localStorage`)
  - [ ] Verify entry deletion removes item from `localStorage`
  - [ ] Verify dark / light theme consistency

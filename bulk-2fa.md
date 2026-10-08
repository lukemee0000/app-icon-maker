# Bulk 2FA Route Plan

## Overview
Implement a dedicated Bulk 2FA page (`/bulk-2fa`) that enables users to paste a 2-column table directly from Microsoft Excel, Google Sheets, or CSV/TSV data:
- **Column 1**: Account Name
- **Column 2**: 2FA Secret String (Base32 key or `otpauth://` URI)

The user can click an **Import** button to parse and validate the data. Upon import, the right-hand panel displays a table featuring:
- **Col 1**: Account Name
- **Col 2**: Live 6-digit 2FA Code with an interactive **Copy** button (with visual feedback) and real-time 30-second TOTP rollover countdown.

The interface follows the project's TailwindCSS v4 + DaisyUI v5 design system and dark/light mode standards.

## Project Type
WEB

## Success Criteria
- [x] Top Navigation: Add `/bulk-2fa` route link to the navbar in `src/routes/__root.tsx`.
- [x] Route Creation: TanStack route file `src/routes/bulk-2fa.tsx`.
- [x] Excel Paste Parser:
  - Robust tab-separated (`\t`), comma-separated (`,`), semicolon, and pipe parsing.
  - Automatic detection and stripping of header rows (e.g., "Name\tSecret").
  - Cleaning of 2FA secrets (handling spaces, hyphens, lowercase conversion, and `otpauth://` URIs).
  - Validation with inline error/success diagnostics before importing.
  - One-click sample data generator and clear button.
- [x] Import Action:
  - Option to Append to existing list or Replace list.
  - LocalStorage persistence under `luke_tools_bulk_2fa_entries`.
- [x] Right-Side Live 2FA Table:
  - Responsive table layout (Name, Live 2FA Code with Copy button).
  - Live 6-digit TOTP calculation updating synchronously every second.
  - Synchronized countdown progress ring / badge showing remaining seconds (0-30s).
  - Copy-to-clipboard functionality with "Copied!" tooltip / state feedback.
  - Search filter by account name for large imports.
  - Bulk actions: "Copy All Codes" and "Clear List".
- [x] Quality & Standards:
  - 0 Biome lint errors and warnings.
  - 0 TypeScript compiler errors (`tsc -b`).
  - Full DaisyUI v5 styling consistency.

import * as OTPAuth from "otpauth";

export interface TwoFactorEntry {
	id: string;
	name: string;
	secret: string; // Base32 secret string (stored in localStorage)
	createdAt: number;
}

export const STORAGE_KEY = "luke_tools_2fa_entries";

/**
 * Normalizes input: handles otpauth:// URIs as well as raw Base32 keys.
 * Removes spaces, hyphens, and standardizes to uppercase.
 */
export function sanitizeSecretInput(input: string): {
	name?: string;
	secret: string;
} {
	const trimmed = input.trim();
	if (trimmed.startsWith("otpauth://")) {
		try {
			const parsed = OTPAuth.URI.parse(trimmed);
			if (parsed instanceof OTPAuth.TOTP) {
				const issuer = parsed.issuer ? `${parsed.issuer}` : "";
				const label = parsed.label ? `${parsed.label}` : "";
				const suggestedName = issuer
					? label && !label.includes(issuer)
						? `${issuer} (${label})`
						: issuer || label
					: label;

				return {
					name: suggestedName || undefined,
					secret: parsed.secret.base32,
				};
			}
		} catch {
			// If URI parse fails, fallback to standard cleaning
		}
	}

	// Remove common spacing or dashes in 2FA keys e.g. "JBSW Y3DP EHPK 3PXP"
	const cleaned = trimmed.replace(/[\s-]/g, "").toUpperCase();
	return { secret: cleaned };
}

/**
 * Validates if the secret is a decodable Base32 secret.
 */
export function validateSecret(secret: string): boolean {
	if (!secret || secret.length < 8) return false;
	try {
		const s = OTPAuth.Secret.fromBase32(secret);
		return s.bytes.length > 0;
	} catch {
		return false;
	}
}

/**
 * Generates the current 6-digit TOTP code for a given base32 secret.
 */
export function generateTOTPCode(secret: string): string {
	try {
		const totp = new OTPAuth.TOTP({
			algorithm: "SHA1",
			digits: 6,
			period: 30,
			secret: OTPAuth.Secret.fromBase32(secret),
		});
		return totp.generate();
	} catch {
		return "------";
	}
}

/**
 * Returns remaining seconds until next 30-second rollover.
 */
export function getSecondsRemaining(period = 30): number {
	const epoch = Math.floor(Date.now() / 1000);
	const rem = period - (epoch % period);
	return rem === 0 ? period : rem;
}

/**
 * Safe loader from localStorage.
 */
export function loadStoredEntries(): TwoFactorEntry[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			return parsed.filter(
				(item): item is TwoFactorEntry =>
					typeof item === "object" &&
					item !== null &&
					typeof item.id === "string" &&
					typeof item.name === "string" &&
					typeof item.secret === "string",
			);
		}
	} catch (e) {
		console.error("Failed to load 2FA entries from localStorage", e);
	}
	return [];
}

/**
 * Safe persister to localStorage.
 */
export function saveStoredEntries(entries: TwoFactorEntry[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
	} catch (e) {
		console.error("Failed to save 2FA entries to localStorage", e);
	}
}

export const BULK_STORAGE_KEY = "luke_tools_bulk_2fa_entries";

export interface Parsed2FaRow {
	id: string;
	name: string;
	secret: string;
	isValid: boolean;
	error?: string;
	rawLine: string;
}

export interface ParseExcelResult {
	rows: Parsed2FaRow[];
	validCount: number;
	invalidCount: number;
	hasHeader: boolean;
}

/**
 * Formats a 6-digit code into "123 456" for enhanced readability.
 */
export function formatTotpDisplay(code: string): string {
	if (code.length === 6) {
		return `${code.slice(0, 3)} ${code.slice(3)}`;
	}
	return code;
}

/**
 * Parses a 2-column paste from Excel (tab-separated), Google Sheets, or CSV.
 * Col 1: Name
 * Col 2: 2FA String (secret or otpauth URI)
 */
export function parseExcel2FaPaste(text: string): ParseExcelResult {
	const rawLines = text.split(/\r?\n/);
	const rows: Parsed2FaRow[] = [];
	let hasHeader = false;

	for (let i = 0; i < rawLines.length; i++) {
		const rawLine = rawLines[i].trim();
		if (!rawLine) continue;

		let col1 = "";
		let col2 = "";

		if (rawLine.includes("\t")) {
			const parts = rawLine.split("\t");
			col1 = parts[0]?.trim() ?? "";
			col2 = parts.slice(1).join("\t").trim();
		} else if (rawLine.includes(",")) {
			const parts = rawLine.split(",");
			col1 = parts[0]?.trim() ?? "";
			col2 = parts.slice(1).join(",").trim();
		} else if (rawLine.includes(";")) {
			const parts = rawLine.split(";");
			col1 = parts[0]?.trim() ?? "";
			col2 = parts.slice(1).join(";").trim();
		} else if (rawLine.includes("|")) {
			const parts = rawLine.split("|");
			col1 = parts[0]?.trim() ?? "";
			col2 = parts.slice(1).join("|").trim();
		} else {
			const parts = rawLine.split(/\s+/);
			if (parts.length >= 2) {
				col2 = parts[parts.length - 1];
				col1 = parts.slice(0, -1).join(" ");
			} else {
				col1 = rawLine;
				col2 = "";
			}
		}

		// Strip surrounding quotation marks if present
		col1 = col1.replace(/^["']|["']$/g, "").trim();
		col2 = col2.replace(/^["']|["']$/g, "").trim();

		const lowerCol1 = col1.toLowerCase();
		const lowerCol2 = col2.toLowerCase();
		const isHeaderCandidate =
			(lowerCol1 === "name" ||
				lowerCol1 === "account" ||
				lowerCol1 === "title" ||
				lowerCol1 === "label" ||
				lowerCol1 === "service") &&
			(lowerCol2.includes("2fa") ||
				lowerCol2.includes("secret") ||
				lowerCol2.includes("key") ||
				lowerCol2.includes("code") ||
				lowerCol2.includes("totp") ||
				lowerCol2.includes("string"));

		if (i === 0 && isHeaderCandidate) {
			hasHeader = true;
			continue;
		}

		if (!col1 && !col2) continue;

		let finalName = col1;
		let finalSecret = "";
		let isValid = true;
		let error: string | undefined;

		if (!col2) {
			isValid = false;
			error = "Missing 2FA secret";
		} else {
			const { name: uriName, secret } = sanitizeSecretInput(col2);
			finalSecret = secret;

			if (!finalName && uriName) {
				finalName = uriName;
			}

			if (!validateSecret(finalSecret)) {
				isValid = false;
				error = "Invalid 2FA secret (base32 required)";
			}
		}

		if (!finalName) {
			isValid = false;
			error = error
				? `${error} & missing account name`
				: "Missing account name";
		}

		rows.push({
			id: `row-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			name: finalName || `Account #${rows.length + 1}`,
			secret: finalSecret,
			isValid,
			error,
			rawLine,
		});
	}

	const validCount = rows.filter((r) => r.isValid).length;
	const invalidCount = rows.length - validCount;

	return {
		rows,
		validCount,
		invalidCount,
		hasHeader,
	};
}

/**
 * Safe loader for bulk entries from localStorage.
 */
export function loadBulkStoredEntries(): TwoFactorEntry[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(BULK_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			return parsed.filter(
				(item): item is TwoFactorEntry =>
					typeof item === "object" &&
					item !== null &&
					typeof item.id === "string" &&
					typeof item.name === "string" &&
					typeof item.secret === "string",
			);
		}
	} catch (e) {
		console.error("Failed to load bulk 2FA entries from localStorage", e);
	}
	return [];
}

/**
 * Safe persister for bulk entries to localStorage.
 */
export function saveBulkStoredEntries(entries: TwoFactorEntry[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(BULK_STORAGE_KEY, JSON.stringify(entries));
	} catch (e) {
		console.error("Failed to save bulk 2FA entries to localStorage", e);
	}
}

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

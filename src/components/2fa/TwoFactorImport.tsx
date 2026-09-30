import { FileJson, Upload } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
	sanitizeSecretInput,
	type TwoFactorEntry,
	validateSecret,
} from "../../lib/totp";

interface TwoFactorImportProps {
	existingEntries: TwoFactorEntry[];
	onImportEntries: (entries: TwoFactorEntry[]) => void;
}

export function TwoFactorImport({
	existingEntries,
	onImportEntries,
}: TwoFactorImportProps) {
	const [jsonInput, setJsonInput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const handleImport = (e?: FormEvent) => {
		if (e) e.preventDefault();
		setError(null);
		setSuccessMessage(null);

		const trimmed = jsonInput.trim();
		if (!trimmed) {
			setError("Please paste JSON content to import.");
			return;
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(trimmed);
		} catch (err) {
			setError(
				`Invalid JSON: ${err instanceof Error ? err.message : "Syntax error"}`,
			);
			return;
		}

		// Handle array, or object with entries/accounts/data array, or single object
		let items: unknown[] = [];
		if (Array.isArray(parsed)) {
			items = parsed;
		} else if (parsed && typeof parsed === "object") {
			const obj = parsed as Record<string, unknown>;
			if (Array.isArray(obj.entries)) {
				items = obj.entries;
			} else if (Array.isArray(obj.accounts)) {
				items = obj.accounts;
			} else if (Array.isArray(obj.data)) {
				items = obj.data;
			} else {
				items = [parsed];
			}
		}

		const existing2faKeys = new Set(existingEntries.map((e) => e.secret));
		const existingIds = new Set(existingEntries.map((e) => e.id));
		const importedEntries: TwoFactorEntry[] = [];
		let duplicateCount = 0;

		for (const item of items) {
			if (!item || typeof item !== "object") continue;

			const candidate = item as Record<string, unknown>;
			const rawSecret =
				typeof candidate.secret === "string"
					? candidate.secret
					: typeof candidate.key === "string"
						? candidate.key
						: typeof candidate.uri === "string"
							? candidate.uri
							: typeof candidate.otpauth === "string"
								? candidate.otpauth
								: "";

			if (!rawSecret) continue;

			const { name: parsedName, secret } = sanitizeSecretInput(rawSecret);
			if (!validateSecret(secret)) continue;

			// Prevent duplicates using 2FA secret key in Set
			if (existing2faKeys.has(secret)) {
				duplicateCount++;
				continue;
			}
			existing2faKeys.add(secret);

			const rawName =
				typeof candidate.name === "string"
					? candidate.name
					: typeof candidate.account === "string"
						? candidate.account
						: typeof candidate.issuer === "string"
							? candidate.issuer
							: "";

			const finalName = (rawName || parsedName || "Imported Account").trim();

			let id =
				typeof candidate.id === "string" && candidate.id.trim()
					? candidate.id.trim()
					: "";

			if (!id || existingIds.has(id)) {
				id = crypto.randomUUID
					? crypto.randomUUID()
					: `2fa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
			}
			existingIds.add(id);

			const createdAt =
				typeof candidate.createdAt === "number" &&
				!Number.isNaN(candidate.createdAt)
					? candidate.createdAt
					: Date.now();

			importedEntries.push({
				id,
				name: finalName,
				secret,
				createdAt,
			});
		}

		if (importedEntries.length === 0) {
			if (duplicateCount > 0) {
				setError(
					`No new accounts added. ${duplicateCount} duplicate ${
						duplicateCount === 1 ? "account was" : "accounts were"
					} skipped.`,
				);
			} else {
				setError(
					"No valid 2FA entries found in the JSON. Please ensure each item has a valid secret key or otpauth URI.",
				);
			}
			return;
		}

		onImportEntries(importedEntries);
		setJsonInput("");
		setSuccessMessage(
			`Successfully imported ${importedEntries.length} ${
				importedEntries.length === 1 ? "account" : "accounts"
			}!${
				duplicateCount > 0
					? ` (${duplicateCount} duplicate ${
							duplicateCount === 1 ? "entry" : "entries"
						} skipped)`
					: ""
			}`,
		);
	};

	return (
		<div className="card bg-base-200 shadow-sm border border-base-content/10">
			<div className="card-body p-4 sm:p-6">
				<div className="flex items-center gap-2 mb-1">
					<FileJson className="w-5 h-5 text-primary" />
					<h2 className="card-title text-base sm:text-lg">
						Import 2FA Accounts
					</h2>
				</div>

				<p className="text-xs text-base-content/60">
					Paste JSON to append accounts to your current list without
					overwriting.
				</p>

				{error && (
					<div
						role="alert"
						className="alert alert-error text-xs py-2 my-2 rounded-lg"
					>
						<span>{error}</span>
					</div>
				)}

				{successMessage && (
					<div
						role="alert"
						className="alert alert-success text-xs py-2 my-2 rounded-lg text-success-content"
					>
						<span>{successMessage}</span>
					</div>
				)}

				<form onSubmit={handleImport} className="space-y-4 mt-2">
					<fieldset className="fieldset">
						<legend className="fieldset-legend font-medium text-xs">
							JSON Data
						</legend>
						<textarea
							id="2fa-json-import"
							className="textarea textarea-bordered w-full font-mono text-xs bg-base-100 h-28 resize-y placeholder:text-base-content/40 leading-relaxed"
							placeholder={`[\n  {\n    "name": "GitHub",\n    "secret": "JBSWY3DPEHPK3PXP"\n  }\n]`}
							value={jsonInput}
							onChange={(e) => {
								setJsonInput(e.target.value);
								if (error) setError(null);
								if (successMessage) setSuccessMessage(null);
							}}
							spellCheck={false}
							required
						/>
					</fieldset>

					<div className="pt-1">
						<button
							type="submit"
							disabled={!jsonInput.trim()}
							className="btn btn-primary btn-sm sm:btn-md w-full gap-2 shadow-sm"
						>
							<Upload className="w-4 h-4" />
							<span>Import</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

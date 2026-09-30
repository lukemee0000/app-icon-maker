import { Eye, EyeOff, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
	sanitizeSecretInput,
	type TwoFactorEntry,
	validateSecret,
} from "../../lib/totp";

interface TwoFactorFormProps {
	onAddEntry: (entry: TwoFactorEntry) => void;
}

export function TwoFactorForm({ onAddEntry }: TwoFactorFormProps) {
	const [name, setName] = useState("");
	const [secretInput, setSecretInput] = useState("");
	const [showSecret, setShowSecret] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSecretChange = (val: string) => {
		setSecretInput(val);
		setError(null);

		// If user pastes an otpauth:// URI, auto-populate the account name if empty
		if (val.trim().startsWith("otpauth://")) {
			const sanitized = sanitizeSecretInput(val);
			if (sanitized.name && !name.trim()) {
				setName(sanitized.name);
			}
		}
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const trimmedName = name.trim();
		const { name: parsedName, secret } = sanitizeSecretInput(secretInput);
		const finalName = trimmedName || parsedName || "";

		if (!finalName) {
			setError("Please provide a name or label for this account.");
			return;
		}

		if (!validateSecret(secret)) {
			setError(
				"Invalid 2FA secret key. Please ensure it is a valid Base32 key (A-Z, 2-7) or otpauth:// URI.",
			);
			return;
		}

		const newEntry: TwoFactorEntry = {
			id: crypto.randomUUID
				? crypto.randomUUID()
				: `2fa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			name: finalName,
			secret,
			createdAt: Date.now(),
		};

		onAddEntry(newEntry);

		// Reset form immediately
		setName("");
		setSecretInput("");
		setShowSecret(false);
		setError(null);
	};

	return (
		<div className="card bg-base-200 shadow-sm border border-base-content/10">
			<div className="card-body p-4 sm:p-6">
				<div className="flex items-center gap-2 mb-1">
					<h2 className="card-title text-base sm:text-lg">Add 2FA Account</h2>
				</div>

				{error && (
					<div className="alert alert-error text-xs py-2 my-2 rounded-lg">
						<span>{error}</span>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4 mt-2">
					<div className="form-control">
						<label htmlFor="2fa-name" className="label py-1">
							<span className="label-text font-medium text-xs">
								Account Name
							</span>
						</label>
						<input
							id="2fa-name"
							type="text"
							placeholder="e.g. GitHub, Google, AWS"
							className="input input-bordered input-sm sm:input-md w-full bg-base-100"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								setError(null);
							}}
							maxLength={60}
							required
						/>
					</div>

					<div className="form-control">
						<label
							htmlFor="2fa-secret"
							className="label py-1 flex justify-between items-center"
						>
							<span className="label-text font-medium text-xs">
								2FA Secret Key
							</span>
						</label>
						<div className="relative">
							<input
								id="2fa-secret"
								type={showSecret ? "text" : "password"}
								placeholder="e.g. JBSWY3DPEHPK3PXP or otpauth://..."
								className="input input-bordered input-sm sm:input-md w-full pr-10 font-mono text-xs sm:text-sm bg-base-100"
								value={secretInput}
								onChange={(e) => handleSecretChange(e.target.value)}
								autoComplete="off"
								spellCheck={false}
								required
							/>
							<button
								type="button"
								onClick={() => setShowSecret(!showSecret)}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors p-1"
								title={showSecret ? "Hide secret" : "Show secret"}
								aria-label={showSecret ? "Hide secret" : "Show secret"}
							>
								{showSecret ? (
									<EyeOff className="w-4 h-4" />
								) : (
									<Eye className="w-4 h-4" />
								)}
							</button>
						</div>
						<div className="label pt-2">
							<span className="label-text-alt text-xs text-base-content/50">
								Supports Base32 strings and otpauth:// URI scheme
							</span>
						</div>
					</div>

					<div className="pt-2">
						<button
							type="submit"
							className="btn btn-primary btn-sm sm:btn-md w-full gap-2 shadow-sm"
						>
							<Plus className="w-4 h-4" />
							<span>Add Account</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

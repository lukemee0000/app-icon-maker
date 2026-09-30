import { Check, Copy, Pencil, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { generateTOTPCode, type TwoFactorEntry } from "../../lib/totp";

interface TwoFactorCardProps {
	entry: TwoFactorEntry;
	onDelete: (id: string) => void;
	onEditName: (id: string, newName: string) => void;
	secondsRemaining: number;
}

export function TwoFactorCard({
	entry,
	onDelete,
	onEditName,
	secondsRemaining,
}: TwoFactorCardProps) {
	const [copied, setCopied] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editedName, setEditedName] = useState(entry.name);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus();
		}
	}, [isEditing]);

	// Generate code dynamically based on current epoch/secret
	const code = generateTOTPCode(entry.secret);

	// Split 6 digits into 3-3 for readable presentation: e.g. "123 456"
	const formattedCode =
		code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;

	const handleCopy = useCallback(async () => {
		if (code === "------") return;
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy code to clipboard", err);
		}
	}, [code]);

	const handleSaveEdit = useCallback(() => {
		const trimmed = editedName.trim();
		if (trimmed && trimmed !== entry.name) {
			onEditName(entry.id, trimmed);
		} else {
			setEditedName(entry.name);
		}
		setIsEditing(false);
	}, [editedName, entry.id, entry.name, onEditName]);

	const handleCancelEdit = useCallback(() => {
		setEditedName(entry.name);
		setIsEditing(false);
	}, [entry.name]);

	return (
		<div className="card bg-base-200/90 shadow-sm border border-base-content/10 hover:border-primary/30 transition-all duration-200">
			<div className="card-body p-3.5 sm:p-5">
				{/* Top Row: Name and Actions */}
				<div className="flex items-start justify-between gap-2 min-h-8">
					{isEditing ? (
						<div className="flex items-center gap-1.5 flex-1 min-w-0">
							<input
								ref={inputRef}
								type="text"
								value={editedName}
								onChange={(e) => setEditedName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleSaveEdit();
									if (e.key === "Escape") handleCancelEdit();
								}}
								className="input input-sm input-bordered w-full font-semibold text-base sm:text-sm bg-base-100"
								maxLength={60}
								aria-label="Edit account name"
							/>
							<button
								type="button"
								onClick={handleSaveEdit}
								className="btn btn-sm btn-primary btn-circle shrink-0 min-h-9 min-w-9"
								title="Save name"
								aria-label="Save name"
							>
								<Check className="w-4 h-4" />
							</button>
							<button
								type="button"
								onClick={handleCancelEdit}
								className="btn btn-sm btn-ghost btn-circle shrink-0 min-h-9 min-w-9"
								title="Cancel"
								aria-label="Cancel editing"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					) : (
						<div className="flex items-center gap-2 min-w-0 flex-1">
							<div className="min-w-0 flex-1">
								<h3
									className="font-semibold text-base sm:text-lg truncate leading-tight"
									title={entry.name}
								>
									{entry.name}
								</h3>
								<span className="text-xs text-base-content/50">
									{new Date(entry.createdAt).toLocaleDateString()}{" "}
									{new Date(entry.createdAt).toLocaleTimeString()}
								</span>
							</div>
						</div>
					)}

					{/* Action Buttons: Edit & Delete */}
					{!isEditing && (
						<div className="flex items-center gap-1 shrink-0">
							<button
								type="button"
								onClick={() => {
									setEditedName(entry.name);
									setIsEditing(true);
								}}
								className="btn btn-ghost btn-sm sm:btn-xs btn-circle min-h-9.5 min-w-9.5 sm:min-h-0 sm:min-w-0 text-base-content/50 hover:text-base-content transition-colors"
								title="Edit account name"
								aria-label={`Edit ${entry.name}`}
							>
								<Pencil className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
							</button>

							{showDeleteConfirm ? (
								<div className="flex items-center gap-1.5">
									<button
										type="button"
										onClick={() => onDelete(entry.id)}
										className="btn btn-sm sm:btn-xs btn-error text-white min-h-9 sm:min-h-0 px-2.5"
										title="Confirm delete"
									>
										Delete
									</button>
									<button
										type="button"
										onClick={() => setShowDeleteConfirm(false)}
										className="btn btn-sm sm:btn-xs btn-ghost min-h-9 sm:min-h-0 px-2"
									>
										Cancel
									</button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => setShowDeleteConfirm(true)}
									className="btn btn-ghost btn-sm sm:btn-xs btn-circle min-h-9.5 min-w-9.5 sm:min-h-0 sm:min-w-0 text-base-content/50 hover:text-error transition-colors"
									title="Delete entry"
									aria-label={`Delete ${entry.name}`}
								>
									<Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
								</button>
							)}
						</div>
					)}
				</div>

				{/* Middle Row: Live Code & Copy Trigger */}
				<button
					type="button"
					onClick={handleCopy}
					className="w-full text-left mt-3 pt-3 border-t border-base-content/5 flex items-center justify-between gap-3 bg-base-100/60 hover:bg-base-100 rounded-xl px-3.5 sm:px-4 py-3 cursor-pointer active:scale-[0.99] transition-all select-none group"
					title="Click or tap to copy code"
					aria-label={`Copy code for ${entry.name}`}
				>
					<div className="flex flex-col">
						<span
							className={`font-mono text-2xl sm:text-3xl font-extrabold tracking-wider transition-colors ${
								secondsRemaining <= 5 ? "text-error" : "text-base-content"
							}`}
						>
							{formattedCode}
						</span>
					</div>

					<span
						className={`btn btn-sm min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 shrink-0 transition-all duration-200 pointer-events-none ${
							copied
								? "btn-success text-white"
								: "btn-outline btn-primary group-hover:scale-[1.02]"
						}`}
						aria-hidden="true"
					>
						{copied ? (
							<Check className="w-4 h-4" />
						) : (
							<Copy className="w-4 h-4" />
						)}
					</span>
				</button>
			</div>
		</div>
	);
}

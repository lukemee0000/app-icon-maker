import { createFileRoute } from "@tanstack/react-router";
import {
	Check,
	Copy,
	Plus,
	RotateCcw,
	Search,
	ShieldCheck,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TwoFactorCountdown } from "../components/2fa/TwoFactorCountdown";
import {
	formatTotpDisplay,
	generateTOTPCode,
	getSecondsRemaining,
	loadBulkStoredEntries,
	parseExcel2FaPaste,
	saveBulkStoredEntries,
	type TwoFactorEntry,
} from "../lib/totp";

export const Route = createFileRoute("/bulk-2fa")({
	component: BulkTwoFactorRoute,
});

const SAMPLE_EXCEL_DATA = `GitHub\tJBSWY3DPEHPK3PXP
AWS Production\tHXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ
Google Workspace\tKRUGS4ZANFZSA2LD
Cloudflare\tMZXW633PN5XW6MZX`;

function BulkTwoFactorRoute() {
	const [pastedText, setPastedText] = useState("");
	const [entries, setEntries] = useState<TwoFactorEntry[]>(() =>
		loadBulkStoredEntries(),
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [secondsRemaining, setSecondsRemaining] = useState<number>(() =>
		getSecondsRemaining(),
	);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [copiedAll, setCopiedAll] = useState(false);

	// Synchronized 1-second timer for 30s TOTP refresh cycle
	useEffect(() => {
		const interval = setInterval(() => {
			setSecondsRemaining(getSecondsRemaining());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	// Live parse pasted text
	const parseResult = useMemo(() => {
		return parseExcel2FaPaste(pastedText);
	}, [pastedText]);

	// Filtered entries for right table
	const filteredEntries = useMemo(() => {
		if (!searchQuery.trim()) return entries;
		const q = searchQuery.toLowerCase().trim();
		return entries.filter((e) => e.name.toLowerCase().includes(q));
	}, [entries, searchQuery]);

	// Import action
	const handleImport = useCallback(() => {
		const validRows = parseResult.rows.filter((r) => r.isValid);
		if (validRows.length === 0) return;

		const newEntries: TwoFactorEntry[] = validRows.map((row) => ({
			id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
			name: row.name,
			secret: row.secret,
			createdAt: Date.now(),
		}));

		setEntries((prev) => {
			const existingMap = new Set(
				prev.map((e) => `${e.name.toLowerCase()}:::${e.secret}`),
			);
			const nonDuplicates = newEntries.filter(
				(e) => !existingMap.has(`${e.name.toLowerCase()}:::${e.secret}`),
			);
			const updated = [...prev, ...nonDuplicates];
			saveBulkStoredEntries(updated);
			return updated;
		});

		setPastedText("");
	}, [parseResult]);

	// Copy single TOTP code
	const handleCopyCode = useCallback(async (id: string, secret: string) => {
		const code = generateTOTPCode(secret);
		try {
			await navigator.clipboard.writeText(code);
			setCopiedId(id);
			setTimeout(() => {
				setCopiedId((current) => (current === id ? null : current));
			}, 2000);
		} catch (err) {
			console.error("Failed to copy code to clipboard", err);
		}
	}, []);

	// Copy all visible codes
	const handleCopyAllCodes = useCallback(async () => {
		if (filteredEntries.length === 0) return;
		const lines = filteredEntries.map((e) => {
			const code = generateTOTPCode(e.secret);
			return `${e.name}: ${code}`;
		});
		try {
			await navigator.clipboard.writeText(lines.join("\n"));
			setCopiedAll(true);
			setTimeout(() => setCopiedAll(false), 2000);
		} catch (err) {
			console.error("Failed to copy all codes", err);
		}
	}, [filteredEntries]);

	// Delete single entry
	const handleDeleteEntry = useCallback((id: string) => {
		setEntries((prev) => {
			const next = prev.filter((e) => e.id !== id);
			saveBulkStoredEntries(next);
			return next;
		});
	}, []);

	// Clear all entries
	const handleClearAll = useCallback(() => {
		if (
			window.confirm(
				"Are you sure you want to clear all imported 2FA accounts?",
			)
		) {
			setEntries([]);
			saveBulkStoredEntries([]);
		}
	}, []);

	// Load sample data into paste area
	const handleLoadSample = useCallback(() => {
		setPastedText(SAMPLE_EXCEL_DATA);
	}, []);

	return (
		<div className="p-3 sm:p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
			<div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
				{/* Page Header matching 2FA route */}
				<div className="flex items-center justify-between gap-3 bg-base-200/60 p-3.5 sm:p-5 rounded-2xl border border-base-content/10">
					<div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
						<h1 className="text-lg sm:text-2xl font-bold tracking-tight">
							Bulk 2FA
						</h1>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<TwoFactorCountdown secondsRemaining={secondsRemaining} />
					</div>
				</div>

				{/* Main Content Layout - Pure CSS Responsive Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
					{/* Left Column: Import Form */}
					<div className="order-2 lg:order-1 lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-4">
						<div className="card bg-base-200 shadow-sm border border-base-content/10">
							<div className="card-body p-4 sm:p-6 space-y-4">
								<div className="flex items-center justify-between">
									<h2 className="card-title text-base sm:text-lg">
										Import from Excel
									</h2>
									<button
										type="button"
										className="btn btn-ghost btn-xs text-primary gap-1"
										onClick={handleLoadSample}
									>
										<Sparkles className="size-3" />
										Sample Data
									</button>
								</div>

								<fieldset className="fieldset">
									<legend className="fieldset-legend font-medium text-xs flex justify-between w-full">
										<span>1st col: Name &bull; 2nd col: 2FA String</span>
										{pastedText && (
											<button
												type="button"
												className="link link-hover text-xs opacity-70"
												onClick={() => setPastedText("")}
											>
												Clear
											</button>
										)}
									</legend>
									<textarea
										className="textarea textarea-bordered w-full h-48 sm:h-56 font-mono text-xs leading-relaxed bg-base-100"
										placeholder={
											"GitHub\tJBSWY3DPEHPK3PXP\nAWS\tHXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ"
										}
										value={pastedText}
										onChange={(e) => setPastedText(e.target.value)}
										aria-label="Paste 2-column table from Excel"
									/>
								</fieldset>

								{pastedText.trim() && (
									<div className="flex items-center justify-between text-xs px-1">
										<span className="text-base-content/70">Detection:</span>
										<div className="flex items-center gap-1.5">
											{parseResult.validCount > 0 && (
												<span className="badge badge-success badge-sm">
													{parseResult.validCount} valid
												</span>
											)}
											{parseResult.invalidCount > 0 && (
												<span className="badge badge-error badge-sm">
													{parseResult.invalidCount} invalid
												</span>
											)}
										</div>
									</div>
								)}

								<button
									type="button"
									className="btn btn-primary w-full gap-2"
									disabled={parseResult.validCount === 0}
									onClick={handleImport}
								>
									<Plus className="size-4" />
									Import{" "}
									{parseResult.validCount > 0
										? `(${parseResult.validCount})`
										: ""}
								</button>
							</div>
						</div>
					</div>

					{/* Right Column: 2-Column Table */}
					<div className="order-1 lg:order-2 lg:col-span-7 xl:col-span-8 space-y-4">
						{entries.length === 0 ? (
							<div className="card bg-base-200/50 border border-dashed border-base-content/20 text-center p-6 sm:p-12">
								<div className="max-w-md mx-auto flex flex-col items-center gap-3">
									<div className="p-3.5 sm:p-4 rounded-full bg-primary/10 text-primary">
										<ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />
									</div>
									<h3 className="text-base sm:text-lg font-bold">
										No 2FA Accounts Added
									</h3>
									<button
										type="button"
										className="btn btn-outline btn-sm gap-1.5 mt-2"
										onClick={handleLoadSample}
									>
										<Sparkles className="size-3.5 text-primary" />
										Try Sample Data
									</button>
								</div>
							</div>
						) : (
							<div className="space-y-3 sm:space-y-4">
								{/* Header Controls & Search matching 2FA route */}
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
									{entries.length > 2 ? (
										<div className="relative flex-1">
											<input
												type="text"
												placeholder="Search accounts..."
												value={searchQuery}
												onChange={(e) => setSearchQuery(e.target.value)}
												className="input input-bordered w-full pl-10 pr-9 text-base sm:text-sm bg-base-100 min-h-10.5 sm:min-h-0"
											/>
											<Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
											{searchQuery && (
												<button
													type="button"
													onClick={() => setSearchQuery("")}
													className="btn btn-ghost btn-circle btn-xs absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/50"
													aria-label="Clear search"
												>
													<X className="w-3.5 h-3.5" />
												</button>
											)}
										</div>
									) : (
										<div className="text-sm font-semibold text-base-content/70">
											{entries.length} account{entries.length === 1 ? "" : "s"}
										</div>
									)}

									<div className="flex items-center gap-2 self-end sm:self-center shrink-0">
										<button
											type="button"
											className="btn btn-ghost btn-xs gap-1 border border-base-content/10"
											onClick={handleCopyAllCodes}
											title="Copy all current 2FA codes"
										>
											{copiedAll ? (
												<>
													<Check className="size-3 text-success" />
													<span className="text-success">Copied All!</span>
												</>
											) : (
												<>
													<Copy className="size-3" />
													<span>Copy All</span>
												</>
											)}
										</button>
										<button
											type="button"
											className="btn btn-ghost btn-xs text-error gap-1 hover:bg-error/10"
											onClick={handleClearAll}
											title="Clear all entries"
										>
											<RotateCcw className="size-3" />
											<span>Clear</span>
										</button>
									</div>
								</div>

								{/* 2-Column Table (Name, 2FA Code with Copy Button) */}
								<div className="card bg-base-200 shadow-sm border border-base-content/10 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="table table-sm sm:table-md w-full">
											<thead>
												<tr className="bg-base-300/60 text-xs">
													<th className="py-3 px-4">Name</th>
													<th className="py-3 px-4 text-right">2FA Code</th>
													<th
														className="w-10 py-3 px-2 text-center"
														aria-label="Actions"
													/>
												</tr>
											</thead>
											<tbody>
												{filteredEntries.length > 0 ? (
													filteredEntries.map((item) => {
														const rawCode = generateTOTPCode(item.secret);
														const displayCode = formatTotpDisplay(rawCode);
														const isCopied = copiedId === item.id;

														return (
															<tr
																key={item.id}
																className="hover:bg-base-100/60 transition-colors border-b border-base-content/5"
															>
																<td className="py-3 px-4">
																	<div className="font-semibold text-sm sm:text-base text-base-content truncate max-w-[180px] sm:max-w-xs md:max-w-sm">
																		{item.name}
																	</div>
																</td>
																<td className="py-3 px-4 text-right">
																	<button
																		type="button"
																		onClick={() =>
																			handleCopyCode(item.id, item.secret)
																		}
																		className={`btn btn-sm font-mono tracking-wider font-bold transition-all ${
																			isCopied
																				? "btn-success"
																				: "btn-outline btn-primary"
																		}`}
																		title="Click to copy 2FA code"
																	>
																		{isCopied ? (
																			<>
																				<Check className="size-3.5" />
																				<span>Copied!</span>
																			</>
																		) : (
																			<>
																				<span>{displayCode}</span>
																				<Copy className="size-3.5 opacity-70" />
																			</>
																		)}
																	</button>
																</td>
																<td className="py-3 px-2 text-center">
																	<button
																		type="button"
																		className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error hover:bg-error/10"
																		onClick={() => handleDeleteEntry(item.id)}
																		title="Delete account"
																	>
																		<Trash2 className="size-3.5" />
																	</button>
																</td>
															</tr>
														);
													})
												) : (
													<tr>
														<td
															colSpan={3}
															className="text-center py-8 text-base-content/50 text-xs sm:text-sm"
														>
															No accounts matching &ldquo;{searchQuery}&rdquo;
														</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

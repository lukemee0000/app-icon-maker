import { Search, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { TwoFactorEntry } from "../../lib/totp";
import { TwoFactorCard } from "./TwoFactorCard";

interface TwoFactorListProps {
	entries: TwoFactorEntry[];
	onDeleteEntry: (id: string) => void;
	onEditName: (id: string, newName: string) => void;
	secondsRemaining: number;
}

export function TwoFactorList({
	entries,
	onDeleteEntry,
	onEditName,
	secondsRemaining,
}: TwoFactorListProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredEntries = useMemo(() => {
		if (!searchQuery.trim()) return entries;
		const q = searchQuery.toLowerCase();
		return entries.filter((e) => e.name.toLowerCase().includes(q));
	}, [entries, searchQuery]);

	if (entries.length === 0) {
		return (
			<div className="card bg-base-200/50 border border-dashed border-base-content/20 text-center p-6 sm:p-12">
				<div className="max-w-md mx-auto flex flex-col items-center gap-3">
					<div className="p-3.5 sm:p-4 rounded-full bg-primary/10 text-primary">
						<ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />
					</div>
					<h3 className="text-base sm:text-lg font-bold">
						No 2FA Accounts Added
					</h3>
					<p className="text-xs sm:text-sm text-base-content/60 leading-relaxed max-w-sm">
						Add your two-factor authentication accounts using the form. Your
						secret keys stay securely in your browser and never leave your
						device.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3 sm:space-y-4">
			{/* Header bar with search */}
			{entries.length > 2 && (
				<div className="w-full">
					<div className="relative w-full">
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
								className="btn btn-ghost btn-circle btn-xs absolute right-2.5 top-1/2 -translate-y-1/2 min-h-7.5 min-w-7.5 flex items-center justify-center text-base-content/50"
								aria-label="Clear search"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>
				</div>
			)}

			{/* Search empty state */}
			{filteredEntries.length === 0 && searchQuery && (
				<div className="p-6 sm:p-8 text-center text-base-content/60 bg-base-200/30 rounded-xl">
					<ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
					<p className="text-xs sm:text-sm">
						No accounts matching &ldquo;{searchQuery}&rdquo;
					</p>
				</div>
			)}

			{/* Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
				{filteredEntries.map((entry) => (
					<TwoFactorCard
						key={entry.id}
						entry={entry}
						onDelete={onDeleteEntry}
						onEditName={onEditName}
						secondsRemaining={secondsRemaining}
					/>
				))}
			</div>
		</div>
	);
}

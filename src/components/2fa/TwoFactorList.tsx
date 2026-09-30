import { Search, ShieldAlert, ShieldCheck } from "lucide-react";
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
			<div className="card bg-base-200/50 border border-dashed border-base-content/20 text-center p-8 sm:p-12">
				<div className="max-w-md mx-auto flex flex-col items-center gap-3">
					<div className="p-4 rounded-full bg-primary/10 text-primary">
						<ShieldCheck className="w-10 h-10" />
					</div>
					<h3 className="text-lg font-bold">No 2FA Accounts Added</h3>
					<p className="text-sm text-base-content/60 leading-relaxed">
						Add your two-factor authentication accounts using the form. Your
						secret keys will be safely stored locally in your browser and will
						never leave your device.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header bar with count and search */}
			{entries.length > 3 && (
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
					<div className="relative w-full sm:w-64">
						<input
							type="text"
							placeholder="Search accounts..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="input input-sm input-bordered w-full pl-8 bg-base-100"
						/>
						<Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/40" />
					</div>
				</div>
			)}

			{/* Search empty state */}
			{filteredEntries.length === 0 && searchQuery && (
				<div className="p-8 text-center text-base-content/60 bg-base-200/30 rounded-xl">
					<ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
					<p className="text-sm">
						No accounts matching &ldquo;{searchQuery}&rdquo;
					</p>
				</div>
			)}

			{/* Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

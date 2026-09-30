import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { TwoFactorCountdown } from "../components/2fa/TwoFactorCountdown";
import { TwoFactorForm } from "../components/2fa/TwoFactorForm";
import { TwoFactorImport } from "../components/2fa/TwoFactorImport";
import { TwoFactorList } from "../components/2fa/TwoFactorList";
import {
	getSecondsRemaining,
	loadStoredEntries,
	saveStoredEntries,
	type TwoFactorEntry,
} from "../lib/totp";

export const Route = createFileRoute("/2fa")({
	component: TwoFactorRoute,
});

function TwoFactorRoute() {
	const [entries, setEntries] = useState<TwoFactorEntry[]>(() =>
		loadStoredEntries(),
	);
	const [secondsRemaining, setSecondsRemaining] = useState<number>(() =>
		getSecondsRemaining(),
	);

	// Synchronized 1-second timer for 30s TOTP refresh cycle
	useEffect(() => {
		const interval = setInterval(() => {
			setSecondsRemaining(getSecondsRemaining());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const handleAddEntry = useCallback((newEntry: TwoFactorEntry) => {
		setEntries((prev) => {
			const existingKeys = new Set(prev.map((item) => item.secret));

			if (existingKeys.has(newEntry.secret)) {
				return prev;
			}

			const next = [newEntry, ...prev];
			saveStoredEntries(next);
			return next;
		});
	}, []);

	const handleImportEntries = useCallback((newEntries: TwoFactorEntry[]) => {
		setEntries((prev) => {
			const existingKeys = new Set(prev.map((item) => item.secret));

			const uniqueNew = newEntries.filter(
				(item) => !existingKeys.has(item.secret),
			);

			if (uniqueNew.length === 0) return prev;

			const next = [...prev, ...uniqueNew];
			saveStoredEntries(next);
			return next;
		});
	}, []);

	const handleDeleteEntry = useCallback((id: string) => {
		setEntries((prev) => {
			const next = prev.filter((item) => item.id !== id);
			saveStoredEntries(next);
			return next;
		});
	}, []);

	const handleEditName = useCallback((id: string, newName: string) => {
		setEntries((prev) => {
			const next = prev.map((item) =>
				item.id === id ? { ...item, name: newName } : item,
			);
			saveStoredEntries(next);
			return next;
		});
	}, []);

	return (
		<div className="p-3 sm:p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
			<div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
				{/* Page Header */}
				<div className="flex items-center justify-between gap-3 bg-base-200/60 p-3.5 sm:p-5 rounded-2xl border border-base-content/10">
					<div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
						<h1 className="text-lg sm:text-2xl font-bold tracking-tight">
							2FA Authenticator
						</h1>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<TwoFactorCountdown secondsRemaining={secondsRemaining} />
					</div>
				</div>

				{/* Main Content Layout - Pure CSS Responsive Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
					{/* Forms Column */}
					<div className="order-2 lg:order-1 lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-4">
						<TwoFactorForm
							existingEntries={entries}
							onAddEntry={handleAddEntry}
						/>
						<TwoFactorImport
							existingEntries={entries}
							onImportEntries={handleImportEntries}
						/>
					</div>

					{/* Accounts List Column */}
					<div className="order-1 lg:order-2 lg:col-span-7 xl:col-span-8">
						<TwoFactorList
							entries={entries}
							onDeleteEntry={handleDeleteEntry}
							onEditName={handleEditName}
							secondsRemaining={secondsRemaining}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

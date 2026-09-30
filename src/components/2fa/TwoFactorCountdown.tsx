import type React from "react";

interface TwoFactorCountdownProps {
	secondsRemaining: number;
	period?: number;
}

export function TwoFactorCountdown({
	secondsRemaining,
	period = 30,
}: TwoFactorCountdownProps) {
	const percentage = Math.max(
		0,
		Math.min(100, Math.round((secondsRemaining / period) * 100)),
	);

	const isUrgent = secondsRemaining <= 5;
	const isWarning = secondsRemaining > 5 && secondsRemaining <= 10;

	const colorClass = isUrgent
		? "text-error"
		: isWarning
			? "text-warning"
			: "text-primary";

	return (
		<div
			className={`radial-progress text-sm font-mono font-bold transition-all duration-300 ${colorClass}`}
			style={
				{
					"--value": percentage,
					"--size": "3.25rem",
					"--thickness": "0.325rem",
				} as React.CSSProperties
			}
			role="progressbar"
			aria-valuenow={secondsRemaining}
			aria-valuemin={0}
			aria-valuemax={period}
		>
			{secondsRemaining}s
		</div>
	);
}

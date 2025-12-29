declare global {
	var Temporal: typeof import("@js-temporal/polyfill").Temporal | undefined;
}

export function isToday(value: string | Date | number): boolean {
	// Use Temporal if available
	if (Temporal?.Now) {
		try {
			const inputDate =
				typeof value === "string" || typeof value === "number"
					? Temporal.Instant.from(new Date(value).toISOString())
					: Temporal.Instant.from(value.toISOString());

			const inputPlain = inputDate
				.toZonedDateTimeISO(Temporal.Now.timeZoneId())
				.toPlainDate();
			const todayPlain = Temporal.Now.plainDateISO();

			return inputPlain.equals(todayPlain);
		} catch {
			return false;
		}
	}

	// Fallback to Date
	const inputDate = new Date(value);

	if (Number.isNaN(inputDate.getTime())) {
		return false;
	}

	const today = new Date();

	return (
		inputDate.getFullYear() === today.getFullYear() &&
		inputDate.getMonth() === today.getMonth() &&
		inputDate.getDate() === today.getDate()
	);
}

import { AbstractModifier } from "./abstract.modifier";

abstract class AbstractRunningDataModifier extends AbstractModifier {

	public static INTERVAL_DELAY = 750;
	protected intervalId: number;
	protected dataWatch: string;

	protected constructor(dataWatch: string) {
		super();
		this.dataWatch = dataWatch;
	}

	public modify(): void {
		this.intervalId = window.setInterval(() => {
			const element: JQuery = $("#elevation-profile td[data-type=" + this.dataWatch + "] .toggle-button")
				.not(".once-only")
				.addClass("once-only");

			if (element.length === 0) {
				clearInterval(this.intervalId);
			}

			element.click();

			if ($("#elevation-profile td[data-type=" + this.dataWatch + "]").find(".active").length) {
				clearInterval(this.intervalId);
			}
		}, AbstractRunningDataModifier.INTERVAL_DELAY);
	}

}

export class RunningHeartRateModifier extends AbstractRunningDataModifier {
	constructor() {
		super("heartrate");
	}
}

export class RunningCadenceModifier extends AbstractRunningDataModifier {
	constructor() {
		super("cadence");
	}
}

export class RunningTemperatureModifier extends AbstractRunningDataModifier {
	constructor() {
		super("temp");
	}
}

export class RunningGradeAdjustedPaceModifier extends AbstractRunningDataModifier {
	constructor() {
		super("grade_adjusted_pace");
	}
}

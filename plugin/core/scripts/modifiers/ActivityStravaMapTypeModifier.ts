import { AbstractModifier } from "./AbstractModifier";

export class ActivityStravaMapTypeModifier extends AbstractModifier {

	protected mapType: string;

	constructor(mapType: string) {
		super();
		this.mapType = mapType;
	}

	public modify(): void {

		if (this.mapType === "terrain") {
			return;
		}

		const mapGoal = this.mapType;

		setInterval(() => {
			$("a.map-type-selector[data-map-type-id=" + mapGoal + "]")
				.not(".once-only")
				.addClass("once-only")
				.click()
				.parents(".drop-down-menu") // Close menu
				.click();
		}, 750);
	}
}

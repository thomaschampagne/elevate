import { AbstractModifier } from "./abstract.modifier";
import { AppResourcesModel } from "../models/app-resources.model";
import { ISegmentInfo } from "../processors/segment-processor";
import * as Cookies from "js-cookie";
import * as $ from "jquery";

export class AthleteStatsModifier extends AbstractModifier {

	protected appResources: AppResourcesModel;
	protected segments: ISegmentInfo[];

	constructor(appResources: AppResourcesModel) {
		super();
		this.appResources = appResources;
	}

	public modify(): void {

		const dismissKey = "elevate_dismiss_moved_year_progress";
		const dismissKeyLink = dismissKey + "_link";

		if (Cookies.get(dismissKey)) {
			return;
		}

		$("#progress-goals").before("<div id=\"" + dismissKey + "\">⚠ Elevate " +
			"<a onclick='window.open(\"" + this.appResources.settingsLink + "#/yearProgressions\", \"_blank\");'>Rolling & year to date progressions</a> features are now fully migrated to" +
			" the <a onclick='window.open(\"" + this.appResources.settingsLink + "#/yearProgressions\", \"_blank\");'>Elevate App</a> with a better implementation and customisation. To access the old \"Distance last 30d & Distance last year\" " +
			"features in the <a onclick='window.open(\"" + this.appResources.settingsLink + "#/yearProgressions\", \"_blank\");'>new year progressions</a>, just set the progress mode to \"Rolling\"" +
			", and set the rolling period of your choice.<a id=\"" + dismissKeyLink + "\">[dismiss]</a></div>").each(() => {
			$("#" + dismissKeyLink).click(() => {
				const date = new Date();
				date.setFullYear(date.getFullYear() + 1);
				Cookies.set(dismissKey, "true", {expires: date});
				$("#" + dismissKey).remove();
			});
		});
	}
}

import { AbstractModifier } from "./abstract.modifier";
import { AppResourcesModel } from "../models/app-resources.model";
import { ISegmentInfo } from "../processors/segment-processor";

export class AthleteStatsModifier extends AbstractModifier {

	protected appResources: AppResourcesModel;
	protected segments: ISegmentInfo[];

	constructor(appResources: AppResourcesModel) {
		super();
		this.appResources = appResources;
	}

	public modify(): void {
		$("#progress-goals").before("<div class='section'><h3 style='font-weight: 400;'>⚠ Elevate " +
			"<a onclick='window.open(\"" + this.appResources.settingsLink + "#/yearProgressions\", \"_blank\");'>Rolling & year to date progressions</a> features are now fully migrated with a better implementation and customisation in" +
			" the <a onclick='window.open(\"" + this.appResources.settingsLink + "#/yearProgressions\", \"_blank\");'>Elevate App</a> itself.<br/><br/>⚠ To access to the <strong>'distance last 30d & year'</strong> features in the new year progression, then inside, switch to the mode 'Rolling'" +
			", set period to 'days' and multiplier to '30'. <a onclick='window.open(\"" + this.appResources.settingsLink + "#/yearProgressions\", \"_blank\");'>Access to the new year progressions</a>.</h3></div>");
	}
}

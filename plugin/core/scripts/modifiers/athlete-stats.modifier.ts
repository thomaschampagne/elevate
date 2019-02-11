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
		$("#progress-goals").before("<div class='section'><h3 style='font-weight: 400;'>⚠ Elevate <a onclick='window.open(\"" + this.appResources.settingsLink + "#/yearProgressions\", \"_blank\");'>Year Progressions</a> feature which was displayed here before is now only available from " +
			"the <a onclick='window.open(\"" + this.appResources.settingsLink + "#/yearProgressions\", \"_blank\");'>Elevate App</a> itself.</h3></div>");
	}
}

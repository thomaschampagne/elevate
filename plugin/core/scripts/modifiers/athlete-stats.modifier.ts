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
		const stravaProgress = $("#progress-goals");
		stravaProgress.before("<div class='section'><h3 style='font-weight: 400;'>Elevate Year progressions are now only available from " +
			"the <a onclick='window.open(\"" + this.appResources.settingsLink + "#/yearProgressions\", \"_blank\");'>Elevate App</a> itself.</h3></div>").each(() => {

		});
	}
}

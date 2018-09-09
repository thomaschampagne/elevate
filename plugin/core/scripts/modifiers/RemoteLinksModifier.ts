/**
 *   RemoteLinksModifier is responsible of ...
 */
import * as _ from "lodash";
import { AppResourcesModel } from "../models/app-resources.model";
import { AbstractModifier } from "./AbstractModifier";

export class RemoteLinksModifier extends AbstractModifier {

	protected appResources: AppResourcesModel;
	protected authorOfActivity: boolean;
	protected activityId: number;

	constructor(appResources: AppResourcesModel, authorOfActivity: boolean, activityId: number) {
		super();
		this.appResources = appResources;
		this.authorOfActivity = authorOfActivity;
		this.activityId = activityId;
	}

	public modify(): void {
		if (!_.isUndefined(window.pageView)) {
			this.modifyActivityPage();
		}
		// if segment page is matching url
		if (!_.isNull(window.location.pathname.match(/^\/segments\/(\d+)$/))) {
			this.modifySegmentPage();
		}
	}

	public modifyActivityPage(): void {

		const remoteViewActivityLinksArray: string[][] = [
			["VeloViewer", "http://veloviewer.com/activities/", "?referrer=stravistiX", ""],
			["Surface", "http://strava-tools.raceshape.com/erea/?url=", "", ""],
		];

		// Activity page
		// Adding remote view links on left panel
		let html = "<li class='group'>";
		html += "<div class='title' id='elevate_remote_title' style='cursor: pointer;'>Remote Views</div>";
		html += "<ul style='display: none;' id='elevate_remoteViews'>";
		_.forEach(remoteViewActivityLinksArray, (linkArray: string[]) => {
			html += "<li>";
			html += "<a data-menu='' " + linkArray[3] + " target='_blank' style='color: #333;' href='" + linkArray[1] + this.activityId + linkArray[2] + "'>" + linkArray[0] + "</a>";
		});
		html += "</ul>";
		html += "</li>";

		$("#pagenav").append($(html)).each(() => {

			$("[data-remote-views]").click((evt: JQuery.Event) => {
				evt.preventDefault();
				evt.stopPropagation();
			});

			$("#elevate_remote_title").click((evt: JQuery.Event) => {

				evt.preventDefault();
				evt.stopPropagation();

				if ($("#elevate_remoteViews").is(":visible")) {
					$("#elevate_remoteViews").slideUp();
				} else {
					$("#elevate_remoteViews").slideDown();
				}

			});

		});

		// Add tcx export
		if (this.authorOfActivity) {
			const htmlForTCXExport: string = "<li><a href='" + window.location.pathname + "/export_tcx'>Export TCX</a></li>";
			$(".actions-menu .slide-menu .options").append(htmlForTCXExport);
		}
	}

	public modifySegmentPage(): void {

		// Segment external links
		const segmentData: string[] = window.location.pathname.match(/^\/segments\/(\d+)$/);

		if (_.isNull(segmentData)) {
			return;
		}

		// Getting segment id
		const segmentId: number = parseInt(segmentData[1]);

		const remoteViewSegmentLinksArray: string[][] = [
			["<img width='24px' style='vertical-align:middle' src='" + this.appResources.veloviewerIcon + "'/> <span>VeloViewer</span>", "http://veloviewer.com/segment/", "?referrer=stravistiX"],
			["<img width='24px' style='vertical-align:middle' src='" + this.appResources.pollIcon + "'/> <span>Segment details by J.Okeeffe</span>", "http://www.jonathanokeeffe.com/strava/segmentDetails.php?segmentId=", ""],
		];
		let html = "<div class='dropdown'>";
		html += "<div class='drop-down-menu' style='width: 100%;' >";
		html += "<button class='btn btn-default dropdown-toggle'><img style='vertical-align:middle' src='" + this.appResources.remoteViewIcon + "'/> <span>Remote Segment View</span></button>";
		html += "<ul class='dropdown-menu'>";

		_.forEach(remoteViewSegmentLinksArray, (linkArray: string[]) => {
			html += "<li><a target='_blank' href='" + linkArray[1] + segmentId + linkArray[2] + "'>" + linkArray[0] + "</a></li>";
		});
		html += "</ul>";
		html += "</div>";
		html += "</div>";
		$(html).prependTo(".segment-activity-my-efforts");
	}

}

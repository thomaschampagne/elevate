import * as _ from "lodash";
import { AbstractModifier } from "./abstract.modifier";
import { UserSettings } from "@elevate/shared/models";
import ExtensionUserSettingsModel = UserSettings.ExtensionUserSettingsModel;

export class HideFeedModifier extends AbstractModifier {

	private static VIRTUAL_RIDE = "virtualride";
	private static RIDE = "ride";
	private static RUN = "run";

	protected userSettings: ExtensionUserSettingsModel;

	constructor(userSettings: ExtensionUserSettingsModel) {
		super();
		this.userSettings = userSettings;
	}

	public modify(): void { // TODO Improve using code of RunningGradeAdjustedPaceModifier & ActivitiesChronologicalFeedModifier

		const timeout = 250;

		setInterval(() => {

			// If hide challenges
			if (this.userSettings.feedHideChallenges) {
				$(".feed-container").find(".challenge").remove();
			}

			// If hide created routes
			if (this.userSettings.feedHideCreatedRoutes) {
				$("div.feed>.min-view").each((index: number, element: Element) => {
					if ($("div.feed").find("div.entry-container").has("a[href*='/routes']").length > 0) {
						$(element).remove();
					}
				});
			}

			// If hide posts
			if (this.userSettings.feedHidePosts) {
				$(".post.feed-entry.card").remove();
			}

			// If hide suggested athletes
			if (this.userSettings.feedHideSuggestedAthletes) {
				$("#suggested-follows").remove(); // Will work as long as id remains "suggested-follows"
			}

			if (this.userSettings.feedHideVirtualRides || this.userSettings.feedHideRideActivitiesUnderDistance > 0 || this.userSettings.feedHideRunActivitiesUnderDistance > 0) {

				const minRideDistanceToHide: number = this.userSettings.feedHideRideActivitiesUnderDistance;
				const minRunDistanceToHide: number = this.userSettings.feedHideRunActivitiesUnderDistance;

				$("div.feed>.activity").each((index: number, element: Element) => {

					const activityType: string = $(element)
						.find("div.entry-icon.media-left").find(".app-icon").attr("class")
						// extract the activityType from the first class with icon-<activityType>, ignoring icon-lg and icon-dark
						.replace(/^.*icon-(?!lg|dark)([^ ]+).*$/, "$1");

					const distanceElement = _.filter($(element).find("ul.list-stats").find("[class=unit]"), (item) => {
						return ($(item).html().trim() == "km" || $(item).html().trim() == "mi");
					});

					const distance: number = parseFloat($(distanceElement).parent().text().replace(",", "."));

					// Remove virtual rides
					if (this.userSettings.feedHideVirtualRides && activityType === HideFeedModifier.VIRTUAL_RIDE) {
						$(element).remove();
					}

					// Remove Ride activities if distance lower than "minRideDistanceToHide", if minRideDistanceToHide equal 0, then keep all.
					if ((minRideDistanceToHide > 0) && distance && (distance < minRideDistanceToHide) && (activityType === HideFeedModifier.RIDE || activityType === HideFeedModifier.VIRTUAL_RIDE)) {
						$(element).remove();
					}

					// Remove Run activities if distance lower than "minRunDistanceToHide", if minRunDistanceToHide equal 0, then keep all.
					if ((minRunDistanceToHide > 0) && distance && (distance < minRunDistanceToHide) && activityType === HideFeedModifier.RUN) {
						$(element).remove();
					}
				});
			}

			// Cleaning time container with no activites
			$("div.feed>.time-header").each((index: number, element: Element) => {
				const timeHeaderElement = $(element);
				if (timeHeaderElement.nextUntil(".time-header").not("script").length === 0) {
					timeHeaderElement.remove();
				}
			});

		}, timeout);
	}
}

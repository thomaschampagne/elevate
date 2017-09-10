import * as _ from "lodash";
import {IUserSettings} from "../../../common/scripts/interfaces/IUserSettings";

export class HideFeedModifier implements IModifier {

    private static VIRTUAL_RIDE: string = "virtualride";
    private static RIDE: string = "ride";
    private static RUN: string = "run";

    protected userSettings: IUserSettings;

    constructor(userSettings: IUserSettings) {
        this.userSettings = userSettings;
    }

    public modify(): void {

        const timeout = 250;

        setInterval(() => {

            // If hide challenges
            if (this.userSettings.feedHideChallenges) {
                $(".feed-container").find(".challenge").remove();

            }

            // If hide created routes
            if (this.userSettings.feedHideCreatedRoutes) {
                $("div.feed>.min-view").each((index: number, element: Element) => {
                    if ($("div.feed").find("div.entry-container").has("a[href*='/routes']").length > 0) $(element).remove();
                });
            }

            // If hide suggested athletes
            if (this.userSettings.feedHideSuggestedAthletes) {
                $('#suggested-follow-module').remove(); // Will work as long as id remains "suggested-follow-module"
            }

            if (this.userSettings.feedHideVirtualRides || this.userSettings.feedHideRideActivitiesUnderDistance > 0 || this.userSettings.feedHideRunActivitiesUnderDistance > 0) {

                const minRideDistanceToHide: number = this.userSettings.feedHideRideActivitiesUnderDistance;
                const minRunDistanceToHide: number = this.userSettings.feedHideRunActivitiesUnderDistance;

                $("div.feed>.activity").each((index: number, element: Element) => {

                    const type: string = $(element).find(".entry-type-icon .app-icon").attr("class").replace("icon-lg", "").replace("app-icon", "").replace("icon-dark", "").replace(/\s+/g, "").replace("icon-", "");

                    const distanceEl = _.filter($(element).find("ul.inline-stats").find("[class=unit]"), function(item) {
                        return ($(item).html() == "km" || $(item).html() == "mi");
                    });

                    const distance: number = parseFloat($(distanceEl).parent().text().replace(",", "."));

                    // Remove virtual rides
                    if (this.userSettings.feedHideVirtualRides && type === HideFeedModifier.VIRTUAL_RIDE) {
                        $(element).remove();
                    }

                    // Remove Ride activities if distance lower than "minRideDistanceToHide", if minRideDistanceToHide equal 0, then keep all.
                    if ((minRideDistanceToHide > 0) && distance && (distance < minRideDistanceToHide) && (type === HideFeedModifier.RIDE || type === HideFeedModifier.VIRTUAL_RIDE)) {
                        $(element).remove();
                    }

                    // Remove Run activities if distance lower than "minRunDistanceToHide", if minRunDistanceToHide equal 0, then keep all.
                    if ((minRunDistanceToHide > 0) && distance && (distance < minRunDistanceToHide) && type === HideFeedModifier.RUN) {
                        $(element).remove();
                    }
                });

            }

            // Cleaning time container with no activites
            $("div.feed>.time-header").each((index: number, element: Element) => {
                const timeHeaderElement: JQuery = $(element);
                if (timeHeaderElement.nextUntil(".time-header").not("script").length === 0) {
                    timeHeaderElement.remove();
                }
            });

        }, timeout);
    }
}

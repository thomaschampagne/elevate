import * as _ from "lodash";
import { Helper } from "../../../common/scripts/Helper";

export class ActivitiesSummaryModifier implements IModifier {

    protected averageSpeedOrPace(pace: number, distance: number, time: number) {
        time /= 60;
        if (pace) {
            const result: number = time / distance;
            const minutes: number = Math.floor(result);
            const seconds: number = (result - minutes) * 60;
            return minutes + ":" + ("00" + Helper.formatNumber(seconds, 0)).slice(-2);
        } else {
            time /= 60;
            return Helper.formatNumber(distance / time);
        }
    }

    public modify(): void {

        let activitiesCountElementId: string = "totals-activities-count",
            $totals: JQuery = $("#totals"),
            requests: JQueryXHR[] = [],
            activityTypes: any[] = [],
            distanceUnit: string = "km",
            elevationUnit: string = "m",
            speedUnit: string = "km/h",
            paceUnit: string = "/km";
        let speedUnitRatio: number = 1; // Default Kilometers
        let elevationUnitRatio: number = 1; // Default Kilometers

        const waitForTotalActivitiesCountRemove = () => {
            if ($("#" + activitiesCountElementId).length !== 0) {
				setTimeout(function () {
                    waitForTotalActivitiesCountRemove();
                }, 1000);
                return;
            }
            this.modify();
        };

        const measurementPreference: string = window.currentAthlete ? window.currentAthlete.get("measurement_preference") : "meters";
        if (measurementPreference != "meters") {
            distanceUnit = "mi";
            elevationUnit = "ft";
            speedUnit = "mph";
            paceUnit = "/mi";
            speedUnitRatio = 0.62137;
            elevationUnitRatio = 3.281;
        }

        $totals.show();
        $totals.append("<li id='" + activitiesCountElementId + "'></li>");
        $("table.activitiesSummary").remove();

        _.forEach($("#interval-rides a[href='/athletes/" + window.currentAthlete.id + "'].athlete-name"), (element) => {

            const $this: JQuery = $(element),
                $activityUrl: JQuery = $this.prev(".entry-title").find("a[href^='/activities/']"),
                icon: JQuery = $this.closest("div.entity-details").find("div.app-icon"),
                pace: boolean = icon.hasClass("icon-walk") || icon.hasClass("icon-run");

            if ($activityUrl.attr("href") !== null) {

                const href: string = $activityUrl.attr("href");

                if ($activityUrl.attr("href")) {

                    const activityId: number = parseInt(_.last($activityUrl.attr("href").split("/")));
                    const url: string = "/athlete/training_activities/" + activityId;

                    requests.push($.ajax({
                        url,
                        type: "GET",
                        dataType: "json",
                        context: {
                            pace,
                        },
                    }));
                }
            }
        });

        $.when.apply(this, requests).done(() => {
            let index: number = 0,
                total: any = {
                    type: "Total",
                    count: 0,
                    distance: 0,
                    elevation: 0,
                    time: 0,
                    calories: 0,
                    noAverage: true,
                };

            _.forEach(requests, (request: any) => {

                let data: any = request.responseJSON,
                    distance: number = data.distance_raw / 1000 * speedUnitRatio,
                    movingTime: number = data.moving_time_raw,
                    elevation: number = data.elevation_gain_raw * elevationUnitRatio,
                    calories: number = data.calories || 0,
                    type: number = data.display_type,
                    summary: any;

                if (!(summary = activityTypes[type] )) {

                    index += 1;

                    activityTypes[type] = activityTypes[index] = summary = {
                        type,
                        count: 0,
                        distance: 0,
                        elevation: 0,
                        time: 0,
                        calories: 0,
                        index,
                    };
                }

                summary.pace = (request.length ? request.pace : request.pace) || summary.pace;
                summary.count += 1;
                summary.distance += distance;
                summary.elevation += elevation;
                summary.time += movingTime;
                summary.calories += calories;

                total.count += 1;
                total.distance += distance;
                total.elevation += elevation;
                total.time += movingTime;
                total.calories += calories;
            });

            activityTypes.sort((left, right) => {
                return left.type.localeCompare(right.type);
            });

            if (activityTypes.length > 2) {
                activityTypes.push(total);
            }
            const $table: JQuery = $("<table class='activitiesSummary'><thead><tr><th>Type</th><th style='text-align: right'>Number</th><th style='text-align: right'>Distance</th><th style='text-align: right'>Time</th><th style='text-align: right'>Avg speed/pace</th><th style='text-align: right'>Elevation</th><th style='text-align: right'>Calories</th></tr></thead><tbody></tbody></table>");
            activityTypes.forEach((type) => {
                const $row: JQuery = $("<tr></tr>");
                $row.append("<td>" + type.type + "</td>");
                $row.append("<td style='text-align: right'>" + type.count + "</td>");
                $row.append("<td style='text-align: right'>" + Helper.formatNumber(Math.abs(type.distance), 1) + " " + distanceUnit + "</td>");
                $row.append("<td style='text-align: right'>" + Helper.secondsToDHM(type.time, true) + "</td>");
                $row.append("<td style='text-align: right'>" + (type.noAverage ? "" : (this.averageSpeedOrPace(type.pace, type.distance, type.time) + " " + (type.pace ? paceUnit : speedUnit))) + "</td>");
                $row.append("<td style='text-align: right'>" + Helper.formatNumber(Math.abs(type.elevation), 0) + " " + elevationUnit + "</td>");
                $row.append("<td style='text-align: right'>" + Helper.formatNumber(Math.abs(type.calories), 0) + "</td>");
                $table.find("tbody").append($row);
            });

            $totals.before($table);
            $totals.hide();
            waitForTotalActivitiesCountRemove();
        });
    }
}

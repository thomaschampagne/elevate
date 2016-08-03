/**
 *   ActivitiesSummaryModifier is responsible of ...
 */
function ActivitiesSummaryModifier() {}

/**
 * Define prototype
 */
ActivitiesSummaryModifier.prototype = {

    modify: function modify() {

        var self = this,
            activitiesCountElementId = "totals-activities-count",
            $totals = $("#totals"),
            i,
            requests = [],
            activityTypes = [],
            distanceInKilometers = true,
            distanceUnit = "km",
            elevationInMeters = true,
            elevationUnit = "m",
            speedUnit = "km/h",
            paceUnit = "/km";
        speedUnitRatio = 1; // Default Kilometers
        elevationUnitRatio = 1; // Default Kilometers

        var averageSpeedOrPace = function(pace, distance, time) {
            time /= 60;
            if (pace) {
                var result = time / distance;
                var minutes = Math.floor(result);
                var seconds = (result - minutes) * 60;
                return minutes + ":" + ("00" + Helper.formatNumber(seconds, 0)).slice(-2);
            } else {
                time /= 60;
                return Helper.formatNumber(distance / time);
            }
        };

        var waitForTotalActivitiesCountRemove = function() {
            if ($("#" + activitiesCountElementId).length !== 0) {
                setTimeout(function() {
                    waitForTotalActivitiesCountRemove();
                }, 1000);
                return;
            }
            modify.call(self);
        };

        var measurementPreference = currentAthlete ? currentAthlete.get('measurement_preference') : 'meters';
        if (measurementPreference != 'meters') {
            distanceInKilometers = false;
            distanceUnit = "mi";
            elevationInMeters = false;
            elevationUnit = "ft";
            speedUnit = "mph";
            paceUnit = "/mi";
            speedUnitRatio = 0.62137;
            elevationUnitRatio = 3.281;
        }

        $totals.show();
        $totals.append("<li id='" + activitiesCountElementId + "'></li>");
        $("table.activitiesSummary").remove();

        $("#interval-rides a[href='/athletes/" + currentAthlete.id + "'].athlete-name").each(function() {
            var $this = $(this),
                $activityUrl = $this.prev(".entry-title").find("a[href^='/activities/']"),
                icon = $this.closest("div.entity-details").find("div.app-icon"),
                pace = icon.hasClass("icon-walk") || icon.hasClass("icon-run");
            if ($activityUrl.attr("href") !== null) {

                var href = $activityUrl.attr("href");

                if ($activityUrl.attr("href")) {

                    var activityId = _.last($activityUrl.attr("href").split('/'));
                    url = "/athlete/training_activities/" + activityId;

                    requests.push($.ajax({
                        url: url,
                        type: "GET",
                        dataType: "json",
                        context: {
                            pace: pace
                        }
                    }));
                }
            }
        });

        $.when.apply(self, requests).done(function() {
            var index = 0,
                total = {
                    type: "Total",
                    count: 0,
                    distance: 0,
                    elevation: 0,
                    time: 0,
                    calories: 0,
                    noAverage: true
                };
            for (i in requests) {
                var data = requests[i].responseJSON,
                    distance = data.distance_raw / 1000 * speedUnitRatio,
                    movingTime = data.moving_time_raw,
                    elevation = data.elevation_gain_raw * elevationUnitRatio,
                    calories = data.calories || 0,
                    type = data.display_type,
                    summary;
                if (!(summary = activityTypes[type])) {
                    index += 1;
                    activityTypes[type] = activityTypes[index] = summary = {
                        type: type,
                        count: 0,
                        distance: 0,
                        elevation: 0,
                        time: 0,
                        calories: 0,
                        index: index
                    };
                }
                summary.pace = (this.length ? this[i].pace : this.pace) || summary.pace;
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
            }

            activityTypes.sort(function(left, right) {
                return left.type.localeCompare(right.type);
            });

            if (activityTypes.length > 2) {
                activityTypes.push(total);
            }
            var $table = $("<table class='activitiesSummary'><thead><tr><th>Type</th><th style='text-align: right'>Number</th><th style='text-align: right'>Distance</th><th style='text-align: right'>Time</th><th style='text-align: right'>Avg speed/pace</th><th style='text-align: right'>Elevation</th><th style='text-align: right'>Calories</th></tr></thead><tbody></tbody></table>");
            activityTypes.forEach(function(type) {
                var $row = $("<tr></tr>");
                $row.append("<td>" + type.type + "</td>");
                $row.append("<td style='text-align: right'>" + type.count + "</td>");
                $row.append("<td style='text-align: right'>" + Helper.formatNumber(Math.abs(type.distance), 1) + " " + distanceUnit + "</td>");
                $row.append("<td style='text-align: right'>" + Helper.secondsToDHM(type.time, true) + "</td>");
                $row.append("<td style='text-align: right'>" + (type.noAverage ? "" : (averageSpeedOrPace(type.pace, type.distance, type.time) + " " + (type.pace ? paceUnit : speedUnit))) + "</td>");
                $row.append("<td style='text-align: right'>" + Helper.formatNumber(Math.abs(type.elevation), 0) + " " + elevationUnit + "</td>");
                $row.append("<td style='text-align: right'>" + Helper.formatNumber(Math.abs(type.calories), 0) + "</td>");
                $table.find("tbody").append($row);
            });

            $totals.before($table);
            $totals.hide();
            waitForTotalActivitiesCountRemove();
        });
    }
};

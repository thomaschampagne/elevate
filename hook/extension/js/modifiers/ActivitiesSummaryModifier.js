/**
 *   ActivitiesSummaryModifier is responsible of ...
 */
function ActivitiesSummaryModifier(vacuumProcessor) {
    this.vacuumProcessor = vacuumProcessor;
}

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
            
        var measurementPreference = currentAthlete ? currentAthlete.get('measurement_preference') : 'meters';
        if (measurementPreference != 'meters') {
            distanceInKilometers = false;
            distanceUnit = "mi";
            elevationInMeters = false;
            elevationUnit = "ft";
            speedUnit = "mph";
            paceUnit = "/mi";
        }
            
        $totals.show();
        $totals.append("<li id='" + activitiesCountElementId + "'></li>");
        $("table.activitiesSummary").remove();

        $("#interval-rides div[id^='map-canvas-activity-']").each(function() {
            var url = "/activities/" + $(this).attr("id").substr(20);
            requests.push($.ajax({
                url: url,
                type: "GET",
                dataType: "html"
            }));
        });
                
        $.when.apply(self, requests).done(function() {
            var index = 0,
                total = {
                    type: "Total",
                    count: 0,
                    distance: 0,
                    elevation: 0,
                    time: 0,
                    noAverage: true
                };
            for (i in requests) {
                var request = requests[i],
                    $html = $(request.responseText),
                    actStatsContainer = $(".activity-summary-container", $html),
                    distance = self.vacuumProcessor.formatActivityDataValue_(actStatsContainer.find('.inline-stats.section', $html).children().first().text(), false, false, true, false),
                    movingTime = self.vacuumProcessor.formatActivityDataValue_(actStatsContainer.find('.inline-stats.section', $html).children().first().next().text(), true, false, false, false),
                    elevation = self.vacuumProcessor.formatActivityDataValue_(actStatsContainer.find('.inline-stats.section', $html).children().first().next().next().text(), false, true, false, false),
                    type = self.getActivityType($("#heading>header>h1>span.title", $html).text()),
                    summary;
                if (!(summary = activityTypes[type])) {
                    index += 1;
                    activityTypes[type] = activityTypes[index] = summary = {
                        type: type,
                        count: 0,
                        distance: 0,
                        elevation: 0,
                        time: 0,
                        index: index
                    };
                }
                summary.count += 1;
                summary.distance += distance;
                summary.elevation += elevation;
                summary.time += movingTime;
                
                total.count += 1;
                total.distance += distance;
                total.elevation += elevation;
                total.time += movingTime;
            }
            
            activityTypes.sort(function(left, right) {
                return left.type.localeCompare(right.type);
            });
            
            if (activityTypes.length > 2) {
                activityTypes.push(total);
            }
            
            var $table = $("<table class='activitiesSummary'><thead><tr><th>Type</th><th style='text-align: right'>Number</th><th style='text-align: right'>Distance</th><th style='text-align: right'>Time</th><th style='text-align: right'>Avg speed/pace</th><th style='text-align: right'>Elevation</th></tr></thead><tbody></tbody></table>");
            activityTypes.forEach(function(type) {
                var $row = $("<tr></tr>");
                $row.append("<td>" + type.type + "</td>");
                $row.append("<td style='text-align: right'>" + type.count + "</td>");
                $row.append("<td style='text-align: right'>" + Helper.formatNumber(Math.abs(type.distance), 1) + " " + distanceUnit + "</td>");
                $row.append("<td style='text-align: right'>" + Helper.secondsToDHM(type.time, true) + "</td>");
                $row.append("<td style='text-align: right'>" + (type.noAverage ? "" : (averageSpeedOrPace(type.type, type.distance, type.time) + " " + (isAveragePace(type.type) ? paceUnit : speedUnit))) + "</td>");
                $row.append("<td style='text-align: right'>" + Helper.formatNumber(Math.abs(type.elevation), 0) + " " + elevationUnit + "</td>");
                $table.find("tbody").append($row);
            });
            
            $totals.before($table);
            $totals.hide();
            waitForTotalActivitiesCountRemove();
        });
        
        var isAveragePace = function(activityType) {
            return activityType === "Run" || activityType === "Walk";
        };
        
        var averageSpeedOrPace = function(activityType, distance, time) {
            time /= 60;
            if (isAveragePace(activityType)) {
                var result = time / distance;
                var minutes = Math.floor(result);
                var seconds = (result - minutes) * 60; 
                return minutes + ":" + Helper.formatNumber(seconds, 0);
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
    },
    
    getActivityType: function(activityTitle) {
        activityTitle = activityTitle.replace(/(\r\n|\n|\r)/gm,"");
        var indexOfLastDash = activityTitle.lastIndexOf("–"),
            type = "unknown";
        if (indexOfLastDash) {
            type = activityTitle.substr(indexOfLastDash + 1).trim();
        }
        return type;
    }
};

/**
 *   ActivitySegmentTimeComparisonModifier is responsible of ...
 */
function ActivitySegmentTimeComparisonModifier(userSettings) {
    this.showDifferenceToKOM = userSettings.displaySegmentTimeComparisonToKOM;
    this.showDifferenceToPR = userSettings.displaySegmentTimeComparisonToPR;
}

/**
 * Define prototype
 */
ActivitySegmentTimeComparisonModifier.prototype = {

    modify: function modify() {
        
        if (!this.showDifferenceToKOM && !this.showDifferenceToPR) {
            return;
        }
        
        var self = this;

        // wait for Segments section load
        if ($("#segments").length === 0) {
            setTimeout(function() {
                modify.call(self);
            }, 500);
            return;
        }
        
        $("#segments #segment-filter").show();
        $("#segments").addClass("time-comparison-enabled");
        
        var isFemale = false,
            deltaKomLabel = "&Delta;KOM",
            deltaPRLabel = "&Delta;PR",
            timeColumnHeader = $("#segments table.segments th.time-col");
        if (!_.isUndefined(window.pageView)) {
            isFemale = pageView.activityAthlete() && pageView.activityAthlete().get('gender') != "M";
            if (isFemale) {
                deltaKomLabel = "&Delta;QOM";
            }
        }
       
        if (self.showDifferenceToPR) {
            timeColumnHeader.after("<th title='Column shows the difference between the acitivity segment time and your previous PR on that segment.'>" + deltaPRLabel + "</th>");
        }
        
        if (self.showDifferenceToKOM) {
            timeColumnHeader.after("<th title='Column shows the difference between the current " + (isFemale ? "QOM" : "KOM") + " time and the acitivity segment time.'>" + deltaKomLabel + "</th>");
        }
        
        $("tr[data-segment-effort-id]").each(function() {
            var $row = $(this),
                $timeCell = $row.find("td.time-col"),
                segmentEffortId = $row.data("segment-effort-id"),
                url = "/segment_efforts/" + segmentEffortId,
                deltaKomCell,
                deltaPRCell;
           
            if (self.showDifferenceToPR) {
                deltaPRCell = $("<td><span class='ajax-loading-image'></span></td>");
                $timeCell.after(deltaPRCell);
            }
            
            if (self.showDifferenceToKOM) {
                deltaKomCell = $("<td><span class='ajax-loading-image'></span></td>");
                $timeCell.after(deltaKomCell);
            }

            $.getJSON(url, function(data) {
                if (!data) {
                    return;
                }

                var komSeconds = Helper.HHMMSStoSeconds((isFemale ? data.qom_time : data.kom_time).replace(/[^0-9:]/gi, "")),
                    seconds = data.elapsed_time_raw,
                    difference = (seconds - komSeconds);
                
                if (self.showDifferenceToKOM) {
                    deltaKomCell.html("<span title=\"Time difference with current " + deltaKomLabel + " (" + Helper.secondsToHHMMSS(Math.abs(komSeconds), true) + ")\" style='color:" + (difference > 0 ? "red" : "green") + ";'>" + ((Math.sign(difference) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(difference), true) + "</span>");
                }
                
                if (!self.showDifferenceToPR) {
                    return;
                }

                $.getJSON("/segments/" + data.segment_id + "/leaderboard?raw=true&page=1&per_page=1000000&viewer_context=false&filter=my_results", function(data) {
                    data.top_results.sort(function(left, right) {
                        return left.start_date_local_raw - right.start_date_local_raw;
                    });

                    var currentSegmentEfforDateTime,
                        previousPersonalSeconds,
                        previousPersonalDate,
                        i,
                        max,
                        text;

                    for (i = 0, max = data.top_results.length; i < max; i++) {
                        data.top_results[i].__dateTime = new Date(data.top_results[i].start_date_local_raw);
                        if (data.top_results[i].id == segmentEffortId) {
                            currentSegmentEfforDateTime = data.top_results[i].__dateTime;
                        }
                    }

                    if (!currentSegmentEfforDateTime) {
                        return;
                    }

                    data.top_results.sort(function(left, right) {
                        return left.rank - right.rank;
                    });

                    for (i = 0, max = data.top_results.length; i < max; i++) {
                        if (data.top_results[i].__dateTime < currentSegmentEfforDateTime) {
                            previousPersonalSeconds = data.top_results[i].elapsed_time_raw;
                            previousPersonalDate = data.top_results[i].start_date_local;
                            break;
                        }
                    }

                    if (!previousPersonalSeconds) {
                        return;
                    }

                    difference = (seconds - previousPersonalSeconds);
                    deltaPRCell.html("<span title='Time difference with your PR time (" + Helper.secondsToHHMMSS(previousPersonalSeconds, true) + " on " + previousPersonalDate + ")' style='color:" + (difference > 0 ? "red" : "green") + ";'>" + ((Math.sign(difference) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(difference), true) + "</span>");
                });
            });
        });
        
        // when a user clicks 'Analysis' #segments element is removed so we have to wait for it and re-run modifier function
        var waitForSegmentsSectionRemoved = function() {
            if ($("#segments.time-comparison-enabled").length !== 0) {
                setTimeout(function() {
                    waitForSegmentsSectionRemoved();
                }, 1000);
                return;
            }
            modify.call(self);
        };
        waitForSegmentsSectionRemoved();

    },
};

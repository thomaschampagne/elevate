/**
 *   ActivitySegmentTimeComparisonModifier is responsible of ...
 */
function ActivitySegmentTimeComparisonModifier(userSettings, appResources) {
    this.showDifferenceToKOM = userSettings.displaySegmentTimeComparisonToKOM;
    this.showDifferenceToPR = userSettings.displaySegmentTimeComparisonToPR;
    this.showDifferenceToCurrentYearPR = userSettings.displaySegmentTimeComparisonToCurrentYearPR;
    this.appResources = appResources;
}

/**
 * Define prototype
 */
ActivitySegmentTimeComparisonModifier.prototype = {

    modify: function modify() {

        // Display temporary disable message
        if (!StorageManager.getCookie('stravistix_hide_seg_time_compare_disabled_message')) {
            $('body').before('<div id="hide_seg_time_compare_disabled_message" style="text-align: center; padding: 10px; background-color: #FFF397;font-family: sans-serif;font-size: 14px;color: #333;"><strong style="font-size: 16px;">Important note</strong><br /><br /><strong>Segment Time Comparison features</strong> have been <strong>disabled</strong> by default due to <strong>performance issues</strong>.<br />You can still <strong><a target="_blank" href="' + this.appResources.settingsLink + '#/commonSettings?searchText=segment%20time%20comparison">re-enable them in options by clicking here</a></strong> <strong>but it will work but slowy</strong>...<br />This issue is being fixed and Segment Time Comparison features will be automatically re-enabled when fixed.<br /><br /><a onclick="javascript:StorageManager.setCookie(\'stravistix_hide_seg_time_compare_disabled_message\', true, 365);$(\'#hide_seg_time_compare_disabled_message\').slideUp();"><strong>[Close and hide this message on this computer]</strong></a></div>');
        }

        if (!this.showDifferenceToKOM && !this.showDifferenceToPR && !this.showDifferenceToCurrentYearPR) {
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
            deltaYearPRLabel = "&Delta;yPR",
            timeColumnHeader = $("#segments table.segments th.time-col"),
            starColumnHeader = $("#segments table.segments th.starred-col");
        if (!_.isUndefined(window.pageView)) {
            isFemale = pageView.activityAthlete() && pageView.activityAthlete().get('gender') != "M";
            if (isFemale) {
                deltaKomLabel = "&Delta;QOM";
            }
        }

        starColumnHeader.after("<th title='Column shows your current position on that segment.'>Pos.</th>");

        if (self.showDifferenceToCurrentYearPR) {
            timeColumnHeader.after("<th title='Column shows the difference between the acitivity segment time and your current year PR on that segment.'>" + deltaYearPRLabel + "</th>");
        }

        if (self.showDifferenceToPR) {
            timeColumnHeader.after("<th title='Column shows the difference between the acitivity segment time and your previous PR on that segment.'>" + deltaPRLabel + "</th>");
        }

        if (self.showDifferenceToKOM) {
            timeColumnHeader.after("<th title='Column shows the difference between the current " + (isFemale ? "QOM" : "KOM") + " time and the acitivity segment time.'>" + deltaKomLabel + "</th>");
        }

        $("tr[data-segment-effort-id]").appear().on("appear", function(e, $items) {
            $items.each(function() {
                var $row = $(this),
                    $timeCell = $row.find("td.time-col"),
                    $starCell = $row.find("td.starred-col"),
                    segmentEffortId = $row.data("segment-effort-id"),
                    url = "/segment_efforts/" + segmentEffortId,
                    positionCell,
                    deltaKomCell,
                    deltaPRCell,
                    deltaYearPRCell;

                if ($row.hasClass("selected") || $row.data("segment-time-comparison")) {
                    return;
                }
                $row.data("segment-time-comparison", true);

                positionCell = $("<td><span class='ajax-loading-image'></span></td>");
                $starCell.after(positionCell);

                if (self.showDifferenceToCurrentYearPR) {
                    deltaYearPRCell = $("<td><span class='ajax-loading-image'></span></td>");
                    $timeCell.after(deltaYearPRCell);
                }

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

                    data.overall_rank = parseInt(data.overall_rank);
                    var percentRank = (data.overall_rank / data.overall_count * 100).toFixed(1);

                    positionCell.html("<span title=\"Your position\">" + data.overall_rank + "<br/>" + percentRank + "%</span>");

                    var komSeconds = Helper.HHMMSStoSeconds((isFemale ? data.qom_time : data.kom_time).replace(/[^0-9:]/gi, "")),
                        seconds = data.elapsed_time_raw,
                        difference = (seconds - komSeconds);

                    if (self.showDifferenceToKOM) {
                        deltaKomCell.html("<span title=\"Time difference with current " + deltaKomLabel + " (" + Helper.secondsToHHMMSS(Math.abs(komSeconds), true) + ")\" style='color:" + (difference > 0 ? "red" : "green") + ";'>" + ((Math.sign(difference) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(difference), true) + "</span>");
                    }

                    if (!self.showDifferenceToPR && !self.showDifferenceToCurrentYearPR) {
                        return;
                    }

                    $.getJSON("/segments/" + data.segment_id + "/leaderboard?raw=true&page=1&per_page=1000000&viewer_context=false&filter=my_results", function(data) {
                        data.top_results.sort(function(left, right) {
                            return left.start_date_local_raw - right.start_date_local_raw;
                        });

                        var currentSegmentEfforDateTime,
                            previousPersonalSeconds,
                            previousPersonalDate,
                            currentYearPRSeconds,
                            currentYearPRDate,
                            i,
                            max;

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

                        if (self.showDifferenceToPR) {
                            for (i = 0, max = data.top_results.length; i < max; i++) {
                                if (data.top_results[i].__dateTime < currentSegmentEfforDateTime) {
                                    previousPersonalSeconds = data.top_results[i].elapsed_time_raw;
                                    previousPersonalDate = data.top_results[i].start_date_local;
                                    break;
                                }
                            }

                            if (previousPersonalSeconds) {
                                difference = (seconds - previousPersonalSeconds);
                                deltaPRCell.html("<span title='Time difference with your PR time (" + Helper.secondsToHHMMSS(previousPersonalSeconds, true) + " on " + previousPersonalDate + ")' style='color:" + (difference > 0 ? "red" : "green") + ";'>" + ((Math.sign(difference) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(difference), true) + "</span>");
                            } else {
                                deltaPRCell.html("n/a");
                            }
                        }

                        if (self.showDifferenceToCurrentYearPR) {
                            for (i = 0, max = data.top_results.length; i < max; i++) {
                                if (data.top_results[i].__dateTime.getFullYear() == currentSegmentEfforDateTime.getFullYear()) {
                                    currentYearPRSeconds = data.top_results[i].elapsed_time_raw;
                                    currentYearPRDate = data.top_results[i].start_date_local;
                                    break;
                                }
                            }

                            if (currentYearPRSeconds) {
                                difference = (seconds - currentYearPRSeconds);
                                deltaYearPRCell.html("<span title='Time difference with your current year PR time (" + Helper.secondsToHHMMSS(currentYearPRSeconds, true) + " on " + currentYearPRDate + ")' style='color:" + (difference > 0 ? "red" : "green") + ";'>" + ((Math.sign(difference) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(difference), true) + "</span>");
                            } else {
                                deltaYearPRCell.html("n/a");
                            }
                        }
                    });
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

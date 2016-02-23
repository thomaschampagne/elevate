/**
 *   ActivitySegmentTimeComparisonModifier is responsible of ...
 */
function ActivitySegmentTimeComparisonModifier(userSettings, appResources) {
    this.showDifferenceToKOM = userSettings.displaySegmentTimeComparisonToKOM;
    this.showDifferenceToPR = userSettings.displaySegmentTimeComparisonToPR;
    this.showDifferenceToCurrentYearPR = userSettings.displaySegmentTimeComparisonToCurrentYearPR;
    this.displaySegmentTimeComparisonPosition = userSettings.displaySegmentTimeComparisonPosition;
    this.appResources = appResources;
}

/**
 * Define prototype
 */
ActivitySegmentTimeComparisonModifier.prototype = {

    modify: function modify() {

        if (!this.showDifferenceToKOM && !this.showDifferenceToPR && !this.showDifferenceToCurrentYearPR && !this.displaySegmentTimeComparisonPosition) {
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

        // Find sex of current acitivity athlete
        self.findOutGender();

        // Asign new labels values
        self.setNewLabelsValues();

        // Used to update header with new columns names when first item has appear
        self.firstAppearDone = false;

        $("tr[data-segment-effort-id]").appear().on("appear", function(e, $items) {

            if (!self.firstAppearDone) {

                var timeColumnHeader = $("#segments table.segments th.time-col");
                var starColumnHeader = $("#segments table.segments th.starred-col");

                if (self.displaySegmentTimeComparisonPosition) {
                    starColumnHeader.after("<th title='Column shows your current position on that segment.'>Pos.</th>");
                }

                if (self.showDifferenceToCurrentYearPR) {
                    timeColumnHeader.after("<th title='Column shows the difference between the activity segment time and your current year PR on that segment.'>" + self.deltaYearPRLabel + "</th>");
                }

                if (self.showDifferenceToPR) {
                    timeColumnHeader.after("<th title='Column shows the difference between the activity segment time and your previous PR on that segment.'>" + self.deltaPRLabel + "</th>");
                }

                if (self.showDifferenceToKOM) {
                    timeColumnHeader.after("<th title='Column shows the difference between the current " + (self.isFemale ? "QOM" : "KOM") + " time and the activity segment time.'>" + self.deltaKomLabel + "</th>");
                }

                self.firstAppearDone = true;
            }

            $items.each(function() {

                var $row = $(this),
                    $timeCell = $row.find("td.time-col"),
                    $starCell = $row.find("td.starred-col"),
                    segmentEffortId = $row.data("segment-effort-id"),
                    segmentEffortInfoUrl = "/segment_efforts/" + segmentEffortId,
                    positionCell,
                    deltaKomCell,
                    deltaPRCell,
                    deltaYearPRCell;

                if ($row.hasClass("selected") || $row.data("segment-time-comparison")) {
                    return;
                }

                $row.data("segment-time-comparison", true);

                if (self.displaySegmentTimeComparisonPosition) {
                    positionCell = $("<td><span class='ajax-loading-image'></span></td>");
                    $starCell.after(positionCell);
                }

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

                // Retreive segment effort infos
                $.getJSON(segmentEffortInfoUrl, function(segmentEffortInfo) {

                    if (!segmentEffortInfo) {
                        return;
                    }

                    // If flagged segment then '-'
                    if (segmentEffortInfo.hazard_segment) {
                        positionCell.html("-");
                        deltaKomCell.html("-");
                        deltaPRCell.html("-");
                        deltaYearPRCell.html("-");
                        return;
                    }

                    if (self.displaySegmentTimeComparisonPosition) {
                        segmentEffortInfo.overall_rank = parseInt(segmentEffortInfo.overall_rank);
                        var percentRank = (segmentEffortInfo.overall_rank / segmentEffortInfo.overall_count * 100).toFixed(1);
                        positionCell.html("<span title=\"Your position\">" + segmentEffortInfo.overall_rank + "<br/>" + percentRank + "%</span>");
                    }

                    var komSeconds = Helper.HHMMSStoSeconds((self.isFemale ? segmentEffortInfo.qom_time : segmentEffortInfo.kom_time).replace(/[^0-9:]/gi, "")),
                        elapsedTime = segmentEffortInfo.elapsed_time_raw,
                        komDiffTime = (elapsedTime - komSeconds);

                    if (self.showDifferenceToKOM) {
                        deltaKomCell.html("<span title=\"Time difference with current " + self.deltaKomLabel + " (" + Helper.secondsToHHMMSS(Math.abs(komSeconds), true) + ")\" style='color:" + (komDiffTime > 0 ? "#FF5555" : "#2EB92E") + ";'>" + ((Math.sign(komDiffTime) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(komDiffTime), true) + "</span>");
                    }

                    if (!self.showDifferenceToPR && !self.showDifferenceToCurrentYearPR) {
                        return;
                    }

                    // Get leader board from segment id
                    self.findCurrentSegmentEffortDate(segmentEffortInfo.segment_id, segmentEffortId).then(function(currentSegmentEffortDateTime, leaderboardData) {
                        self.handleTimeDiffenceAlongUserLeaderboard.call(self, leaderboardData, currentSegmentEffortDateTime, elapsedTime, segmentEffortId, deltaPRCell, deltaYearPRCell);
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

    findOutGender: function() {
        this.isFemale = false;
        if (!_.isUndefined(window.pageView)) {
            this.isFemale = pageView.activityAthlete() && pageView.activityAthlete().get('gender') != "M";
        }
    },

    setNewLabelsValues: function() {
        this.deltaKomLabel = (this.isFemale) ? "&Delta;QOM" : "&Delta;KOM";
        this.deltaPRLabel = "&Delta;PR";
        this.deltaYearPRLabel = "&Delta;yPR";
    },

    findCurrentSegmentEffortDate: function(segmentId, segmentEffortId, page, deferred, fetchedLeaderboardData) {

        if (!page) {
            page = 1;
        }
        if (!deferred) {
            deferred = $.Deferred();
        }

        if (!fetchedLeaderboardData) {
            fetchedLeaderboardData = [];
        }

        var perPage = 50;

        var jqxhr = $.getJSON('/segments/' + segmentId + '/leaderboard?raw=true&page=' + page + '&per_page=' + perPage + '&viewer_context=false&filter=my_results');

        var currentSegmentEffortDateTime = null;

        jqxhr.done(function(leaderboardData) {

            var max;
            for (var i = 0, max = leaderboardData.top_results.length; i < max; i++) {
                leaderboardData.top_results[i].__dateTime = new Date(leaderboardData.top_results[i].start_date_local_raw);
                if (leaderboardData.top_results[i].id == segmentEffortId) {
                    currentSegmentEffortDateTime = leaderboardData.top_results[i].__dateTime;
                    // no break !
                }
            }

            // Make any recursive leaderboardData fetched flatten with previous one 
            fetchedLeaderboardData = _.flatten(_.union(leaderboardData.top_results, fetchedLeaderboardData));

            if (currentSegmentEffortDateTime) {
                deferred.resolve(currentSegmentEffortDateTime, fetchedLeaderboardData);
            } else { // Not yet resolved then seek recursive on next page
                this.findCurrentSegmentEffortDate(segmentId, segmentEffortId, page + 1, deferred, fetchedLeaderboardData);
            }

        }.bind(this)).fail(function(error) {

            deferred.reject(error);

        }.bind(this));

        return deferred.promise();
    },

    handleTimeDiffenceAlongUserLeaderboard: function(leaderboardData, currentSegmentEffortDateTime, elapsedTime, segmentEffortId, deltaPRCell, deltaYearPRCell) {

        var previousPersonalSeconds,
            previousPersonalDate,
            currentYearPRSeconds,
            currentYearPRDate;

        if (!currentSegmentEffortDateTime) {
            // We are going are a place is shared by several people. Use current activity date instead?!
            // Or find on page 2... @ "/segments/" + leaderboardData.segment_id + "/leaderboard?raw=true&page=2
            deltaPRCell.html("-");
            deltaYearPRCell.html("-");
            return;
        }

        // Sort results from best to worst
        leaderboardData.sort(function(left, right) {
            return left.rank - right.rank;
        });

        if (this.showDifferenceToPR) {
            for (var i = 0; i < leaderboardData.length; i++) {
                if (leaderboardData[i].__dateTime < currentSegmentEffortDateTime) {
                    previousPersonalSeconds = leaderboardData[i].elapsed_time_raw;
                    previousPersonalDate = leaderboardData[i].start_date_local;
                    break;
                }
            }

            if (previousPersonalSeconds) {
                var deltaTime = (elapsedTime - previousPersonalSeconds);
                deltaPRCell.html("<span title='Time difference with your previous PR time (" + Helper.secondsToHHMMSS(previousPersonalSeconds, true) + " on " + previousPersonalDate + ")' style='color:" + (deltaTime > 0 ? "#FF5555" : "#2EB92E") + ";'>" + ((Math.sign(deltaTime) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(deltaTime), true) + "</span>");
            } else {
                deltaPRCell.html("-");
            }
        }

        if (this.showDifferenceToCurrentYearPR) {
            for (var i = 0; i < leaderboardData.length; i++) {
                if (leaderboardData[i].__dateTime.getFullYear() == currentSegmentEffortDateTime.getFullYear()) {
                    currentYearPRSeconds = leaderboardData[i].elapsed_time_raw;
                    currentYearPRDate = leaderboardData[i].start_date_local;
                    break;
                }
            }

            if (currentYearPRSeconds) {
                var deltaTime = (elapsedTime - currentYearPRSeconds);
                deltaYearPRCell.html("<span title='Time difference with your current year PR time (" + Helper.secondsToHHMMSS(currentYearPRSeconds, true) + " on " + currentYearPRDate + ")' style='color:" + (deltaTime > 0 ? "#FF5555" : "#2EB92E") + ";'>" + ((Math.sign(deltaTime) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(deltaTime), true) + "</span>");
            } else {
                deltaYearPRCell.html("-");
            }
        }
    }
};

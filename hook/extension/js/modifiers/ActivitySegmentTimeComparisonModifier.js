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
        var segments = $("#segments");
        if (segments.length === 0) {
            setTimeout(function() {
                modify.call(self);
            }, 500);
            return;
        }

        segments.find("#segment-filter").show();
        segments.addClass("time-comparison-enabled");

        // Find sex of current acitivity athlete
        self.findOutGender();

        // Asign new labels values
        self.setNewLabelsValues();

        // Used to update header with new columns names when first item has appear
        self.firstAppearDone = false;

        $("tr[data-segment-effort-id]").appear().on("appear", function(e, $items) {

            if (!self.firstAppearDone) {


                var timeColumnHeader = segments.find("table.segments th.time-col");

                if (self.showDifferenceToPR && self.showDifferenceToCurrentYearPR) {
                    timeColumnHeader.after("<th style='font-size:11px;' title='Column shows the difference between the activity segment time and your current year PR on that segment.'>" + self.deltaYearPRLabel + "</th>");
                }

                if (self.showDifferenceToPR) {
                    timeColumnHeader.after("<th style='font-size:11px;' title='Column shows the difference between the activity segment time and your previous PR on that segment.'>" + self.deltaPRLabel + "</th>");
                }

                if (self.showDifferenceToKOM) {
                    timeColumnHeader.after("<th style='font-size:11px;' title='Column shows the difference between the current " + (self.isFemale ? "QOM" : "KOM") + " time and the activity segment time.'>" + self.deltaKomLabel + "</th>");
                }

                if (self.displaySegmentTimeComparisonPosition) {
                    timeColumnHeader.after("<th title='Column shows your current position on that segment.'>Rank</th>");
                }

                self.firstAppearDone = true;
            }

            $items.each(function() {

                var $row = $(this),
                    $timeCell = $row.find("td.time-col"),
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

                if (self.showDifferenceToPR && self.showDifferenceToCurrentYearPR) {
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

                if (self.displaySegmentTimeComparisonPosition) {
                    positionCell = $("<td><span class='ajax-loading-image'></span></td>");
                    $timeCell.after(positionCell);
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
                        var percentRank = (segmentEffortInfo.overall_rank / segmentEffortInfo.overall_count);
                        positionCell.html("<div title=\"Your position\" style=\"text-align: center; font-size:11px; padding: 1px 1px; background-color: #565656; color:" + self.getColorForPercentage(percentRank) + "\">" + segmentEffortInfo.overall_rank + "&nbsp;/&nbsp;" + segmentEffortInfo.overall_count + "<br/>" + (percentRank * 100).toFixed(1) + "%</div>");
                    }

                    var komSeconds = Helper.HHMMSStoSeconds((self.isFemale ? segmentEffortInfo.qom_time : segmentEffortInfo.kom_time).replace(/[^0-9:]/gi, "")),
                        elapsedTime = segmentEffortInfo.elapsed_time_raw,
                        komDiffTime = (elapsedTime - komSeconds);

                    if (self.showDifferenceToKOM) {
                        deltaKomCell.html("<span title=\"Time difference with current " + self.deltaKomLabel + " (" + Helper.secondsToHHMMSS(Math.abs(komSeconds), true) + ")\" style='font-size:11px; color:" + (komDiffTime > 0 ? "#FF5555" : "#2EB92E") + ";'>" + ((Math.sign(komDiffTime) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(komDiffTime), true) + "</span>");
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

        $.force_appear();

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
        leaderboardData = leaderboardData.sort(function(left, right) {
            return left.rank - right.rank;
        });

        var deltaTime;

        if (this.showDifferenceToPR) {
            for (var i = 0; i < leaderboardData.length; i++) {
                if (leaderboardData[i].__dateTime < currentSegmentEffortDateTime) {
                    previousPersonalSeconds = leaderboardData[i].elapsed_time_raw;
                    previousPersonalDate = leaderboardData[i].start_date_local;
                    break;
                }
            }

            if (previousPersonalSeconds) {
                deltaTime = (elapsedTime - previousPersonalSeconds);
                deltaPRCell.html("<span title='Time difference with your previous PR time (" + Helper.secondsToHHMMSS(previousPersonalSeconds, true) + " on " + previousPersonalDate + ")' style='font-size:11px; color:" + (deltaTime > 0 ? "#FF5555" : "#2EB92E") + ";'>" + ((Math.sign(deltaTime) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(deltaTime), true) + "</span>");
            } else {
                deltaPRCell.html("<span title='First cross' style='font-size:11px; color: grey;'>1X</span>");
            }
        }

        if (this.showDifferenceToPR && this.showDifferenceToCurrentYearPR) {

            var resultsThisYear = [];

            for (var j = 0; j < leaderboardData.length; j++) {
                if (leaderboardData[j].__dateTime.getFullYear() === currentSegmentEffortDateTime.getFullYear()) {
                    currentYearPRSeconds = leaderboardData[j].elapsed_time_raw;
                    currentYearPRDate = leaderboardData[j].start_date_local;
                    resultsThisYear.push(leaderboardData[j]);
                }
            }

            // Sort results by elapsed_time_raw ascending
            resultsThisYear = resultsThisYear.sort(function(left, right) {
                return left.elapsed_time_raw - right.elapsed_time_raw;
            });

            var currentActivityResult = _.findWhere(resultsThisYear, {
                __dateTime: currentSegmentEffortDateTime
            });

            var previousBestResultThisYear = null;
            _.some(resultsThisYear, function(result) {
                if (result.activity_id !== currentActivityResult.activity_id && result.__dateTime < currentActivityResult.__dateTime) {
                    previousBestResultThisYear = result;
                    return true;
                }
            });

            if (currentYearPRSeconds) {

                if (!previousPersonalSeconds) {

                    // No Previous PR here, so no Y previous PR..
                    deltaYearPRCell.html("<span title='First cross this year' style='font-size:11px; color: grey;'>1X</span>");

                } else if (currentYearPRSeconds - previousPersonalSeconds < 0) {

                    // Current Year activity beat PR
                    if (previousBestResultThisYear) {
                        deltaTime = currentActivityResult.elapsed_time_raw - previousBestResultThisYear.elapsed_time_raw;
                        deltaYearPRCell.html("<span title='Time difference with your previous best result this year (" + Helper.secondsToHHMMSS(previousBestResultThisYear.elapsed_time_raw, true) + " on " + previousBestResultThisYear.start_date_local + ")' style='font-size:11px; color:" + (deltaTime > 0 ? "#FF5555" : "#2EB92E") + ";'>" + ((Math.sign(deltaTime) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(deltaTime), true) + "</span>");
                    } else {
                        // NEW PR This ride of Current Year
                        deltaYearPRCell.html("<span title='This time beats previous PR. Time difference with your previous PR time  (" + Helper.secondsToHHMMSS(previousPersonalSeconds, true) + " on " + previousPersonalDate + ")' style='font-size:11px; color: grey;'>&#9733;</span>");
                    }

                } else {

                    if (previousBestResultThisYear) {
                        deltaTime = currentActivityResult.elapsed_time_raw - previousBestResultThisYear.elapsed_time_raw;
                        deltaYearPRCell.html("<span title='Time difference with your previous best result this year (" + Helper.secondsToHHMMSS(previousBestResultThisYear.elapsed_time_raw, true) + " on " + previousBestResultThisYear.start_date_local + ")' style='font-size:11px; color:" + (deltaTime > 0 ? "#FF5555" : "#2EB92E") + ";'>" + ((Math.sign(deltaTime) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(deltaTime), true) + "</span>");
                    } else {

                        deltaTime = (elapsedTime - currentYearPRSeconds);

                        if (deltaTime) {
                            deltaYearPRCell.html("<span title='Time difference with your current year PR time (" + Helper.secondsToHHMMSS(currentYearPRSeconds, true) + " on " + currentYearPRDate + ")' style='font-size:11px; color:" + (deltaTime > 0 ? "#FF5555" : "#2EB92E") + ";'>" + ((Math.sign(deltaTime) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(deltaTime), true) + "</span>");
                        } else {
                            deltaYearPRCell.html("<span title='First cross this year' style='font-size:11px; color: grey;'>1X</span>");
                        }
                    }
                }

            } else {
                deltaYearPRCell.html("<span title='First cross this year' style='font-size:11px; color: grey;'>1X</span>");
            }
        }
    },

    getColorForPercentage: function(pct) {

        // invert percentage
        pct = 1 - pct;

        var percentColors = [{
            pct: 0.0,
            color: {
                r: 0xff,
                g: 0x55,
                b: 0x55
            }
        }, {
            pct: 0.5,
            color: {
                r: 0xff,
                g: 0xff,
                b: 0
            }
        }, {
            pct: 1.0,
            color: {
                r: 0x00,
                g: 0xff,
                b: 0x00
            }
        }];

        for (var i = 1; i < percentColors.length - 1; i++) {
            if (pct < percentColors[i].pct) {
                break;
            }
        }
        var lower = percentColors[i - 1];
        var upper = percentColors[i];
        var range = upper.pct - lower.pct;
        var rangePct = (pct - lower.pct) / range;
        var pctLower = 1 - rangePct;
        var pctUpper = rangePct;
        var color = {
            r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
            g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
            b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
        };
        return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
        // or output as hex if preferred
    }
};

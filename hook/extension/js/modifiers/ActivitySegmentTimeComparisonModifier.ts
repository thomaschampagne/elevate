interface EffortInfo {
    // values obtained from the HTTP request
    id: number; // segment effort id
    activity_id: number;
    segment_id: number;

    elapsed_time_raw: number;
    avg_watts: number;
    avg_heart_rate: number;

    start_date_local: Date;
    start_date_local_raw: string;
    rank: number;

    hazard_segment: boolean;
    overall_rank: string;
    overall_count: string;

    qom_time: string;
    kom_time: string;

    __dateTime: Date; // field added by us: start_date_local_raw converted into machine readable format (how is this different from start_date_local?)
}

interface LeaderBoardData {
    top_results: EffortInfo[];
}

class ActivitySegmentTimeComparisonModifier implements IModifier {

    protected showDifferenceToKOM: boolean;
    protected showDifferenceToPR: boolean;
    protected showDifferenceToCurrentYearPR: boolean;
    protected displaySegmentTimeComparisonPosition: boolean;
    protected appResources: IAppResources;
    protected isBike: boolean;
    protected isFemale: boolean;
    protected firstAppearDone: boolean;
    protected deltaYearPRLabel: string;
    protected deltaPRLabel: string;
    protected deltaKomLabel: string;

    constructor(userSettings: IUserSettings, appResources: IAppResources, activityType: string, isMyOwn: boolean) {
        this.showDifferenceToKOM = userSettings.displaySegmentTimeComparisonToKOM;
        this.showDifferenceToPR = isMyOwn && userSettings.displaySegmentTimeComparisonToPR;
        this.showDifferenceToCurrentYearPR = isMyOwn && userSettings.displaySegmentTimeComparisonToCurrentYearPR;
        this.displaySegmentTimeComparisonPosition = userSettings.displaySegmentTimeComparisonPosition;
        this.appResources = appResources;
        this.isBike = (activityType === "Ride");
    }

    protected crTitle(): string {
        return this.isBike ? this.isFemale ? "QOM" : "KOM" : "CR";
    }

    public modify(): void {

        if (!this.showDifferenceToKOM && !this.showDifferenceToPR && !this.showDifferenceToCurrentYearPR && !this.displaySegmentTimeComparisonPosition) {
            return;
        }

        // wait for Segments section load
        let segments: JQuery = $("#segments");
        if (segments.length === 0) {
            setTimeout(() => {
                this.modify();
            }, 500);
            return;
        }

        segments.find("#segment-filter").show();
        segments.addClass("time-comparison-enabled");

        // Find sex of current activity athlete
        this.findOutGender();

        // Asign new labels values
        this.setNewLabelsValues();

        // Used to update header with new columns names when first item has appear
        this.firstAppearDone = false;

        $("tr[data-segment-effort-id]").appear().on("appear", (event: Event, $items: any) => {

            if (!this.firstAppearDone) {


                let timeColumnHeader = segments.find("table.segments th.time-col");

                if (timeColumnHeader.length == 0) {
                    // activities other than cycling (like nordic ski) miss time-col class, search by text
                    timeColumnHeader = segments.find("table.segments th:contains('Time')");
                }

                if (this.showDifferenceToPR && this.showDifferenceToCurrentYearPR) {
                    timeColumnHeader.after("<th style='font-size:11px;' title='Column shows the difference between the activity segment time and your current year PR on that segment.'>" + this.deltaYearPRLabel + "</th>");
                }

                if (this.showDifferenceToPR) {
                    timeColumnHeader.after("<th style='font-size:11px;' title='Column shows the difference between the activity segment time and your previous PR on that segment.'>" + this.deltaPRLabel + "</th>");
                }

                if (this.showDifferenceToKOM) {
                    timeColumnHeader.after("<th style='font-size:11px;' title='Column shows the difference between the current " + this.crTitle() + " time and the activity segment time.'>" + this.deltaKomLabel + "</th>");
                }

                if (this.displaySegmentTimeComparisonPosition) {
                    timeColumnHeader.after("<th title='Column shows your current position on that segment.'>Rank</th>");
                }

                this.firstAppearDone = true;
            }

            $items.each(() => {

                let $row: JQuery = $(event.currentTarget),
                    $timeCell: JQuery = $row.find("td.time-col"),
                    segmentEffortId: number = $row.data("segment-effort-id"),
                    segmentEffortInfoUrl: string = "/segment_efforts/" + segmentEffortId,
                    positionCell: JQuery,
                    deltaKomCell: JQuery,
                    deltaPRCell: JQuery,
                    deltaYearPRCell: JQuery;

                if ($row.hasClass("selected") || $row.data("segment-time-comparison")) {
                    return;
                }

                $row.data("segment-time-comparison", true);

                if (this.showDifferenceToPR && this.showDifferenceToCurrentYearPR) {
                    deltaYearPRCell = $("<td><span class='ajax-loading-image'></span></td>");
                    $timeCell.after(deltaYearPRCell);
                }

                if (this.showDifferenceToPR) {
                    deltaPRCell = $("<td><span class='ajax-loading-image'></span></td>");
                    $timeCell.after(deltaPRCell);
                }

                if (this.showDifferenceToKOM) {
                    deltaKomCell = $("<td><span class='ajax-loading-image'></span></td>");
                    $timeCell.after(deltaKomCell);
                }

                if (this.displaySegmentTimeComparisonPosition) {
                    positionCell = $("<td><span class='ajax-loading-image'></span></td>");
                    $timeCell.after(positionCell);
                }

                // Retreive segment effort infos
                $.getJSON(segmentEffortInfoUrl, (segmentEffortInfo: EffortInfo) => {

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

                    if (this.displaySegmentTimeComparisonPosition) {
                        let percentRank: number = parseInt(segmentEffortInfo.overall_rank) / parseInt(segmentEffortInfo.overall_count);
                        positionCell.html("<div title=\"Your position\" style=\"text-align: center; font-size:11px; padding: 1px 1px; background-color: #565656; color:" + this.getColorForPercentage(percentRank) + "\">" + segmentEffortInfo.overall_rank + "&nbsp;/&nbsp;" + segmentEffortInfo.overall_count + "<br/>" + (percentRank * 100).toFixed(1) + "%</div>");
                    }

                    let komSeconds: string = Helper.HHMMSStoSeconds((this.isFemale ? segmentEffortInfo.qom_time : segmentEffortInfo.kom_time).replace(/[^0-9:]/gi, "")),
                        elapsedTime = segmentEffortInfo.elapsed_time_raw,
                        komDiffTime = (elapsedTime - parseInt(komSeconds));

                    if (this.showDifferenceToKOM) {
                        deltaKomCell.html("<span title=\"Time difference with current " + this.crTitle() + " (" + Helper.secondsToHHMMSS(Math.abs(parseInt(komSeconds)), true) + ")\" style='font-size:11px; color:" + (komDiffTime > 0 ? "#FF5555" : "#2EB92E") + ";'>" + ((Math.sign(komDiffTime) == 1) ? "+" : "-") + Helper.secondsToHHMMSS(Math.abs(komDiffTime), true) + "</span>");
                    }

                    if (!this.showDifferenceToPR && !this.showDifferenceToCurrentYearPR) {
                        return;
                    }

                    // Get leader board from segment id
                    this.findCurrentSegmentEffortDate(segmentEffortInfo.segment_id, segmentEffortId).then((currentSegmentEffortDateTime: Date, leaderBoardData: EffortInfo[]) => {
                        this.handleTimeDifferenceAlongUserLeaderBoard(leaderBoardData, currentSegmentEffortDateTime, elapsedTime, segmentEffortId, deltaPRCell, deltaYearPRCell);
                    });

                });
            });
        });

        $.force_appear();

        // when a user clicks 'Analysis' #segments element is removed so we have to wait for it and re-run modifier function
        let waitForSegmentsSectionRemoved = () => {
            if ($("#segments.time-comparison-enabled").length !== 0) {
                setTimeout(() => {
                    waitForSegmentsSectionRemoved();
                }, 1000);
                return;
            }
            this.modify();
        };
        waitForSegmentsSectionRemoved();
    }

    protected findOutGender(): void {
        this.isFemale = false;
        if (!_.isUndefined(window.pageView)) {
            this.isFemale = window.pageView.activityAthlete() && window.pageView.activityAthlete().get('gender') != "M";
        }
    }

    protected setNewLabelsValues(): void {
        this.deltaKomLabel = "&Delta;" + this.crTitle();
        this.deltaPRLabel = "&Delta;PR";
        this.deltaYearPRLabel = "&Delta;yPR";
    }

    protected findCurrentSegmentEffortDate(segmentId: number, segmentEffortId: number, page?: number, deferred?: JQueryDeferred<Date>, fetchedLeaderboardData?: EffortInfo[]): JQueryPromise<Date> {

        if (!page) {
            page = 1;
        }
        if (!deferred) {
            deferred = $.Deferred();
        }

        if (!fetchedLeaderboardData) {
            fetchedLeaderboardData = [];
        }

        let perPage: number = 50;

        let jqxhr: JQueryXHR = $.getJSON('/segments/' + segmentId + '/leaderboard?raw=true&page=' + page + '&per_page=' + perPage + '&viewer_context=false&filter=my_results');

        let currentSegmentEffortDateTime: Date = null;

        jqxhr.done((leaderBoardData: LeaderBoardData) => {

            for (let i = 0, max = leaderBoardData.top_results.length; i < max; i++) {
                leaderBoardData.top_results[i].__dateTime = new Date(leaderBoardData.top_results[i].start_date_local_raw);
                if (leaderBoardData.top_results[i].id == segmentEffortId) {
                    currentSegmentEffortDateTime = leaderBoardData.top_results[i].__dateTime;
                    // no break !
                }
            }

            // Make any recursive leaderBoardData fetched flatten with previous one
            fetchedLeaderboardData = _.flatten(_.union(leaderBoardData.top_results, fetchedLeaderboardData));

            if (currentSegmentEffortDateTime) {
                deferred.resolve(currentSegmentEffortDateTime, fetchedLeaderboardData);
            } else { // Not yet resolved then seek recursive on next page
                this.findCurrentSegmentEffortDate(segmentId, segmentEffortId, page + 1, deferred, fetchedLeaderboardData);
            }

        }).fail((error: any) => {
            deferred.reject(error);
        });

        return deferred.promise();
    }

    protected handleTimeDifferenceAlongUserLeaderBoard(leaderBoardData: EffortInfo[], currentSegmentEffortDateTime: Date, elapsedTime: number, segmentEffortId: number, deltaPRCell: JQuery, deltaYearPRCell: JQuery): void {

        let previousPersonalSeconds: number,
            previousPersonalDate: Date,
            currentYearPRSeconds: number,
            currentYearPRDate: Date;

        if (!currentSegmentEffortDateTime) {
            // We are going are a place is shared by several people. Use current activity date instead?!
            // Or find on page 2... @ "/segments/" + leaderBoardData.segment_id + "/leaderboard?raw=true&page=2
            deltaPRCell.html("-");
            deltaYearPRCell.html("-");
            return;
        }

        // Sort results from best to worst
        leaderBoardData = leaderBoardData.sort((left: EffortInfo, right: EffortInfo) => {
            return left.rank - right.rank;
        });

        let deltaTime: number;

        if (this.showDifferenceToPR) {
            for (let i: number = 0; i < leaderBoardData.length; i++) {
                if (leaderBoardData[i].__dateTime < currentSegmentEffortDateTime) {
                    previousPersonalSeconds = leaderBoardData[i].elapsed_time_raw;
                    previousPersonalDate = leaderBoardData[i].start_date_local;
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

            let resultsThisYear: Array<EffortInfo> = [];

            for (let j: number = 0; j < leaderBoardData.length; j++) {
                if (leaderBoardData[j].__dateTime.getFullYear() === currentSegmentEffortDateTime.getFullYear()) {
                    currentYearPRSeconds = leaderBoardData[j].elapsed_time_raw;
                    currentYearPRDate = leaderBoardData[j].start_date_local;
                    resultsThisYear.push(leaderBoardData[j]);
                }
            }

            // Sort results by elapsed_time_raw ascending
            resultsThisYear = resultsThisYear.sort((left: EffortInfo, right: EffortInfo) => {
                return left.elapsed_time_raw - right.elapsed_time_raw;
            });

            let currentActivityResult = _.findWhere(resultsThisYear, {
                __dateTime: currentSegmentEffortDateTime
            });

            let previousBestResultThisYear: EffortInfo = null;
            _.some(resultsThisYear, (result: EffortInfo) => {
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
    }

    protected getColorForPercentage(pct: number): string {

        // invert percentage
        pct = 1 - pct;

        let percentColors: Array<any> = [{
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

        let i: number;
        for (i = 1; i < percentColors.length - 1; i++) {
            if (pct < percentColors[i].pct) {
                break;
            }
        }
        let lower: any = percentColors[i - 1];
        let upper: any = percentColors[i];
        let range: number = upper.pct - lower.pct;
        let rangePct: number = (pct - lower.pct) / range;
        let pctLower: number = 1 - rangePct;
        let pctUpper: number = rangePct;
        let color: any = {
            r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
            g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
            b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
        };
        return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
        // or output as hex if preferred
    }

}

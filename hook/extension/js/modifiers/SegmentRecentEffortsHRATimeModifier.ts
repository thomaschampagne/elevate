class SegmentRecentEffortsHRATimeModifier implements IModifier {

    protected userSettings: IUserSettings;
    protected athleteId: number;
    protected segmentId: number;
    protected hraTimeLoop: number;


    constructor(userSettings: IUserSettings, athleteId: number, segmentId: number) {
        this.userSettings = userSettings;
        this.athleteId = athleteId;
        this.segmentId = segmentId;
    }


    public modify(): void {

        if (this.userSettings.displayRecentEffortsHRAdjustedPace) {
            this.hraTimeLoop = setInterval(() => {
                this.hraTime();
            }, 750);
        }

    }

    protected findCurrentSegmentEfforts(segmentId: number, page?: number, deferred?: JQueryDeferred<any>, fetchedLeaderBoardData?: Array<any>): JQueryPromise<any> {

        if (!page) {
            page = 1;
        }
        if (!deferred) {
            deferred = $.Deferred();
        }
        if (!fetchedLeaderBoardData) {
            fetchedLeaderBoardData = [];
        }

        let perPage: number = 50;

        let jqxhr: JQueryXHR = $.getJSON('/segments/' + segmentId + '/leaderboard?raw=true&page=' + page + '&per_page=' + perPage + '&viewer_context=false&filter=my_results');

        jqxhr.done((leaderBoardData: any) => {

            // Make any recursive leaderboardData fetched flatten with previous one
            fetchedLeaderBoardData = _.flatten(_.union(leaderBoardData.top_results, fetchedLeaderBoardData));

            if (leaderBoardData.top_results.length == 0) {
                deferred.resolve(fetchedLeaderBoardData);
            } else { // Not yet resolved then seek recursive on next page
                this.findCurrentSegmentEfforts(segmentId, page + 1, deferred, fetchedLeaderBoardData);
            }

        }).fail((error: any) => {
            deferred.reject(error);
        });

        return deferred.promise();
    }

    protected hraTime(): void {

        function createElementSVG(kind: string, ...attribs: String[][]): SVGElement {
            let ret = document.createElementNS("http://www.w3.org/2000/svg", kind);
            for (let attrib : String[] of attribs) {
                ret.setAttribute(attrib[0], attrib[1])
            }
            return ret;
        }

        let recentEffortsChart: JQuery = $("#athlete-history-chart");

        if (!recentEffortsChart.hasClass("stravistiXGraph")) {

            recentEffortsChart.addClass("stravistiXGraph");

            let chart: JQuery = recentEffortsChart.find("svg");

            let marks: JQuery = chart.find("circle").filter(".mark");

            function xyFromMark(m: any): any {
                return {"x": m.cx.baseVal.value, "y": m.cy.baseVal.value};
            }

            // scan area used by the effort marks
            let maxY: number, minY: number;
            let minX: number, maxX: number;
            marks.each((i, m) => {
                let xy: any = xyFromMark(m);
                minY = Helper.safeMin(minY, xy.y);
                maxY = Helper.safeMax(maxY, xy.y);
                minX = Helper.safeMin(minX, xy.x);
                maxX = Helper.safeMax(maxX, xy.x);
            });

            this.findCurrentSegmentEfforts(this.segmentId).then((fetchedLeaderBoardData: Array<any>) => {
                // data come sorted by elapsed time, fastest first - we need them sorted by date

                fetchedLeaderBoardData = fetchedLeaderBoardData.sort((left, right) => {
                    let lDate: Date = new Date(left.start_date_local_raw);
                    let rDate: Date = new Date(right.start_date_local_raw);
                    return lDate.getTime() - rDate.getTime();
                });

                // if there are more data than marks, assume oldest marks are dropped
                if (marks.length < fetchedLeaderBoardData.length) {
                    fetchedLeaderBoardData = fetchedLeaderBoardData.splice(-marks.length, marks.length);
                }

                // when watts are present, show watts, not time (used for bike activities)
                let showWatts: boolean = false;
                fetchedLeaderBoardData.forEach((r: any) => {
                    if (r.avg_watts != null) {
                        showWatts = true;
                    }
                });


                let minHR: number, maxHR: number;
                fetchedLeaderBoardData.forEach((r) => {
                    minHR = Helper.safeMin(minHR, r.avg_heart_rate);
                    maxHR = Helper.safeMax(maxHR, r.avg_heart_rate);
                });

                let restHR: number = this.userSettings.userRestHr;
                let targetHR: number = maxHR;
                let hrValues: number = 0;

                fetchedLeaderBoardData.forEach((r: any) => {

                    if (r.avg_heart_rate != null && r.avg_heart_rate > restHR) {
                        let mValue: number = showWatts ? r.avg_watts : r.elapsed_time_raw;

                        let ratio: number = (r.avg_heart_rate - restHR) / (targetHR - restHR);
                        r.hraValue = showWatts ? mValue / ratio : mValue * ratio;
                        hrValues += 1;
                    }
                });

                if (hrValues > 1) {

                    let fastestValue: number;
                    let slowestValue: number;

                    if (showWatts) {
                        fetchedLeaderBoardData.forEach((r: any) => {
                            let rValue: number = r.hraValue;
                            fastestValue = Helper.safeMax(fastestValue, rValue); // high power -> fast
                            slowestValue = Helper.safeMin(slowestValue, rValue);
                        });
                    } else {
                        fetchedLeaderBoardData.forEach((r: any) => {
                            let rValue: number = r.elapsed_time_raw;
                            fastestValue = Helper.safeMin(fastestValue, rValue); // high time -> slow
                            slowestValue = Helper.safeMax(slowestValue, rValue);
                        });
                    }


                    if (showWatts) {
                        // avoid watt range too sensitive, would result in meaningless wild data
                        let minWattRange: number = 100;
                        let wattRange: number = fastestValue - slowestValue;
                        if (wattRange < minWattRange) {
                            slowestValue -= (minWattRange - wattRange) / 2;
                            if (slowestValue < 0) {
                                slowestValue = 0;
                            }
                            fastestValue = slowestValue + minWattRange;
                        }
                    }

                    let topY: number = 10;
                    let bottomY: number = parseInt(chart[0].getAttribute("height")) - 10;

                    let slowY: number = maxY;
                    let fastY: number = minY;

                    if (showWatts) {
                        // scan Y-axis (time) to check for the reasonable vertical range to use
                        let translateRegEx: RegExp = /translate\((.*),(.*)\)/;
                        let yAxis: JQuery = chart.find(".y.axis"); //<g class="y axis" transform="translate(-27.45, 0)">
                        let ticks: JQuery = yAxis.find(".tick");

                        let ticksY: Array<number> = <Array<number>> ticks.map((index: number, domElement: Element) => {
                            let tickText = $(domElement).attr("transform");
                            let yTick = translateRegEx.exec(tickText)[2];
                            return parseFloat(yTick);
                        }).valueOf();

                        let yTickTop: number = ticksY[0];
                        let yTickBot: number = ticksY[ticksY.length - 1];
                        slowY = yTickTop + (yTickBot - yTickTop) * 0.25;
                        fastY = yTickBot - (yTickBot - yTickTop) * 0.2;

                        // produce a few watt labels
                        let step: number = 25;
                        if (fastestValue - slowestValue >= 400) {
                            step = 100;
                        } else if (fastestValue - slowestValue >= 200) {
                            step = 50;
                        }
                        let roundFastestDown: number = Math.floor(fastestValue / step) * step;
                        let roundSlowestUp: number = Math.ceil(slowestValue / step) * step;

                        let wattMarks: Array<number> = [];
                        for (let mWatts: number = roundSlowestUp; mWatts <= roundFastestDown + 1; mWatts += step) {
                            wattMarks.push(mWatts);
                        }

                        let wattAxisX: number = maxX;

                        let gAxis = createElementSVG("g",
                            ["class", "y axis"],
                            ["style", "opacity: 1;"],
                            ["transform", "translate(" + wattAxisX + ", 0)"]);

                        wattMarks.forEach((mWatts: number) => {
                            let f: number = ( mWatts - fastestValue) / (slowestValue - fastestValue);
                            let mY: number = f * (slowY - fastY) + fastY;

                            let g = createElementSVG("g",
                                ["class", "tick"],
                                ["style", "opacity: 1;"],
                                ["transform", "translate(0," + mY.toFixed(0) + ")"]);

                            let line = createElementSVG("line",
                                ["x2", "0"],
                                ["y2", "0"],
                                ["class", "grid"]);
                            g.appendChild(line);

                            let text = createElementSVG("text");
                            text.setAttribute("x", "50"); // TODO: copy from y axis markers
                            text.setAttribute("y", "0");
                            text.setAttribute("dy", ".32em");
                            text.setAttribute("class", "hra-axis axis-tick-text");
                            text.setAttribute("style", "text-anchor: end;");
                            text.innerHTML = mWatts.toFixed(0) + " W";
                            g.appendChild(text);


                            gAxis.appendChild(g);
                        });

                        let insertDOM: JQuery = chart.find(".y.axis").eq(0);

                        insertDOM.before(gAxis);
                    }


                    function mapValueToY(value: number): number {
                        return (value - fastestValue) / (slowestValue - fastestValue) * (slowY - fastY) + fastY;
                    }

                    function clampY(resY: number): number {
                        return Math.min(Math.max(topY, resY), bottomY);
                    }

                    // compute values for marks with HR data
                    let markData: Array<Array<number>> = <Array<Array<number>>> marks.map((i, m) => {
                        let xy: any = xyFromMark(m);

                        let r: any = fetchedLeaderBoardData[i];

                        if (r.hraValue != null) {
                            let resY: number = mapValueToY(r.hraValue);
                            return [[i, m, resY, r.hraValue, xy.x]];
                        }
                    }).valueOf();

                    // create the SVG marks
                    let mappedMarks = $.map(markData, (imr) => {
                        let i = imr[0], m = imr[1], resY = imr[2], hraValue = imr[3], mx = imr[4];

                        let clampedY = clampY(resY);

                        // Cannot create SVG as HTML source - see http://stackoverflow.com/a/6149687/16673
                        let mark = createElementSVG("circle");
                        mark.setAttribute("class", "hra-time-mark mark");
                        mark.setAttribute("cx", mx.toString());
                        mark.setAttribute("cy", clampedY.toString());
                        mark.setAttribute("r", "3");

                        if (resY < topY || resY > bottomY) {
                            let title: SVGElement = createElementSVG("text");
                            title.innerHTML = showWatts ? hraValue.toFixed(0) : Helper.secondsToHHMMSS(hraValue, true);
                            title.setAttribute("x", (mx + 4).toString());
                            title.setAttribute("y", (clampedY + 4).toString());
                            title.setAttribute("class", "axis-tick-text");
                            return [mark, title];
                        }

                        return mark;

                    });

                    // create the SVG lines connecting the marks
                    let lines: Array<SVGElement> = [];
                    for (let i = 1; i < markData.length; i++) {
                        let imrPrev: Array<number> = markData[i - 1];
                        let imrNext: Array<number> = markData[i];
                        let line = createElementSVG("line");
                        line.setAttribute("class", "hra-line");
                        line.setAttribute("x1", imrPrev[4].toString());
                        line.setAttribute("y1", clampY(imrPrev[2]).toString());
                        line.setAttribute("x2", imrNext[4].toString());
                        line.setAttribute("y2", clampY(imrNext[2]).toString());

                        lines.push(line);
                    }


                    if (lines.length>0) {
                        let lastLine = lines[lines.length-1];

                        let pbLabel = chart.find(".personal-best-label");

                        let boxX = parseFloat(pbLabel.attr("x"));

                        let line = createElementSVG("line");
                        line.setAttribute("class", "hra-line");
                        line.setAttribute("x1", lastLine.getAttribute("x2"));
                        line.setAttribute("y1", lastLine.getAttribute("y2"));
                        line.setAttribute("x2", (boxX - 3).toString());
                        line.setAttribute("y2", lastLine.getAttribute("y2"));

                        lines.push(line);

                        let infobox = createElementSVG("g");
                        infobox.setAttribute("transform", "translate(" + boxX.toString() + ", 150)");

                        let hoverX = 20;
                        let hoverY = 9;
                        let hoverW = 14;
                        let hoverH = 14;

                        {
                            let infoboxValue = createElementSVG("text");
                            infoboxValue.setAttribute("id", "hra-value");
                            infoboxValue.setAttribute("x", "0");
                            infoboxValue.setAttribute("y", (hoverY + hoverH/2).toString());
                            infoboxValue.textContent = maxHR.toFixed();
                            infobox.appendChild(infoboxValue);
                        }


                        {
                            let infoboxHelpRect = createElementSVG("rect");
                            infoboxHelpRect.setAttribute("id", "hra-box-help");
                            infoboxHelpRect.setAttribute("x", hoverX.toString());
                            infoboxHelpRect.setAttribute("y", hoverY.toString());
                            infoboxHelpRect.setAttribute("width", hoverW.toString());
                            infoboxHelpRect.setAttribute("height", hoverH.toString());
                            infobox.appendChild(infoboxHelpRect);

                            let infoboxHelp = createElementSVG("text");
                            infoboxHelp.setAttribute("id", "hra-value-help");
                            infoboxHelp.setAttribute("x", (hoverX+hoverW/2).toString());
                            infoboxHelp.setAttribute("y", (hoverY+hoverH/2).toString());
                            infoboxHelp.textContent = "?";
                            infobox.appendChild(infoboxHelp);
                        }

                        let infoboxHoverG = createElementSVG("g");
                        infoboxHoverG.setAttribute("id", "hra-hover");
                        infobox.appendChild(infoboxHoverG);

                        {
                            let infoboxHover = createElementSVG("rect");
                            infoboxHover.setAttribute("id", "hra-hover-box");
                            infoboxHover.setAttribute("x", hoverX.toString());
                            infoboxHover.setAttribute("y", hoverY.toString());
                            infoboxHover.setAttribute("width", hoverW.toString());
                            infoboxHover.setAttribute("height", hoverH.toString());
                            infoboxHoverG.appendChild(infoboxHover);

                            let infoboxH = 60;
                            let infoboxW = 150;

                            let infoboxRectG = createElementSVG("g");
                            infoboxRectG.setAttribute("transform", "translate(" + (34 - infoboxW).toString() + "," + (hoverY + hoverH).toString() +")");
                            infoboxHoverG.appendChild(infoboxRectG);

                            {
                                let infoboxRect = createElementSVG("rect");
                                infoboxRect.setAttribute("id", "hra-box");
                                infoboxRect.setAttribute("width", infoboxW.toString());
                                infoboxRect.setAttribute("height", infoboxH.toString());
                                infoboxRectG.appendChild(infoboxRect);
                            }

                            let lineH = 15;
                            let textX = 3;
                            let textY = 3;

                            let infoText = ["To Be Done - Line 1", "To Be Done - Line 2", "To Be Done - Line 3"];

                            for (let l = 0; l<3; l++) {
                                let text = createElementSVG("text");
                                text.setAttribute("x", textX.toString());
                                text.setAttribute("y", (textY + lineH *(l+1)).toString());
                                text.textContent = infoText[l];
                                infoboxRectG.appendChild(text);
                            }
                        }


                        lines.push(infobox);
                    }

                    // insert the elements into the SVG
                    let firstMark = chart.find("circle").eq(0);
                    firstMark.before(mappedMarks);

                    let bestMark = chart.find("circle").filter(".personal-best-mark");
                    bestMark.after(lines);
                }
            });

            clearInterval(this.hraTimeLoop);
        }
    }
}


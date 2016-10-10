/**
 *   SegmentRecentEffortsHRATimeModifier is responsible of ...
 */
function SegmentRecentEffortsHRATimeModifier(userSettings, athleteId, segmentId) {
    this.userSettings_ = userSettings;
    this.athleteId_ = athleteId;
    this.segmentId_ = segmentId;
}

/**
 * Define prototype
 */
SegmentRecentEffortsHRATimeModifier.prototype = {

    modify: function modify() {

        if (this.userSettings_.displayRecentEffortsHRAdjustedPace) {
            this.hraTimeLoop = setInterval(function () {
                this.hraTime();
            }.bind(this), 750);
        }

    },

    findCurrentSegmentEfforts: function(segmentId, page, deferred, fetchedLeaderboardData) {

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

        jqxhr.done(function(leaderboardData) {

            // Make any recursive leaderboardData fetched flatten with previous one
            fetchedLeaderboardData = _.flatten(_.union(leaderboardData.top_results, fetchedLeaderboardData));

            if (leaderboardData.top_results.length == 0) {
                deferred.resolve(fetchedLeaderboardData);
            } else { // Not yet resolved then seek recursive on next page
                this.findCurrentSegmentEfforts(segmentId, page + 1, deferred, fetchedLeaderboardData);
            }

        }.bind(this)).fail(function(error) {

            deferred.reject(error);

        }.bind(this));

        return deferred.promise();
    },

    hraTime: function() {

        function createElementSVG(document, kind) {
            return document.createElementNS("http://www.w3.org/2000/svg", kind);
        }

        var self = this;

        var recentEffortsChart = $("#athlete-history-chart");
        if (!recentEffortsChart.hasClass("stravistiXGraph")) {

            recentEffortsChart.addClass("stravistiXGraph");

            var chart = recentEffortsChart.find("svg");

            var marks = chart.find("circle").filter(".mark");

            function xyFromMark(m) {
                return {"x": m.cx.baseVal.value, "y": m.cy.baseVal.value};
            }

            // scan area used by the effort marks
            var maxY, minY;
            var minX, maxX;
            marks.each(function (i, m) {
                var xy = xyFromMark(m);
                minY = Helper.safeMin(minY, xy.y);
                maxY = Helper.safeMax(maxY, xy.y);
                minX = Helper.safeMin(minX, xy.x);
                maxX = Helper.safeMax(maxX, xy.x);
            });

            self.findCurrentSegmentEfforts(self.segmentId_).then(function (fetchedLeaderboardData) {
                // data come sorted by elapsed time, fastest first - we need them sorted by date

                fetchedLeaderboardData = fetchedLeaderboardData.sort(function (left, right) {
                    var lDate = new Date(left.start_date_local_raw);
                    var rDate = new Date(right.start_date_local_raw);
                    return lDate - rDate;
                });

                // if there are more data than marks, assume oldest marks are dropped
                if (marks.length < fetchedLeaderboardData.length) {
                    fetchedLeaderboardData = fetchedLeaderboardData.splice(-marks.length, marks.length);
                }

                // when watts are present, show watts, not time (used for bike activities)
                var showWatts = false;
                fetchedLeaderboardData.forEach(function (r) {
                    if (r.avg_watts != null) {
                        showWatts = true;
                    }
                });


                var minHR, maxHR;
                fetchedLeaderboardData.forEach(function (r) {
                    minHR = Helper.safeMin(minHR, r.avg_heart_rate);
                    maxHR = Helper.safeMax(maxHR, r.avg_heart_rate);
                });

                var restHR = self.userSettings_.userRestHr;
                var targetHR = maxHR;
                var hrValues = 0;

                fetchedLeaderboardData.forEach(function (r) {

                    if (r.avg_heart_rate != null && r.avg_heart_rate > restHR) {
                        var mValue = showWatts ? r.avg_watts : r.elapsed_time_raw;

                        var ratio = (r.avg_heart_rate - restHR) / (targetHR - restHR);
                        r.hraValue = showWatts ? mValue / ratio : mValue * ratio;
                        hrValues += 1;
                    }
                });

                if (hrValues > 1) {

                    var fastestValue, slowestValue;
                    if (showWatts) {
                        fetchedLeaderboardData.forEach(function (r) {
                            var rValue = r.hraValue;
                            fastestValue = Helper.safeMax(fastestValue, rValue); // high power -> fast
                            slowestValue = Helper.safeMin(slowestValue, rValue);
                        });
                    } else {
                        fetchedLeaderboardData.forEach(function (r) {
                            var rValue = r.elapsed_time_raw;
                            fastestValue = Helper.safeMin(fastestValue, rValue); // high time -> slow
                            slowestValue = Helper.safeMax(slowestValue, rValue);
                        });
                    }


                    if (showWatts) {
                        // avoid watt range too sensitive, would result in meaningless wild data
                        var minWattRange = 100;
                        var wattRange = fastestValue - slowestValue;
                        if (wattRange < minWattRange) {
                            slowestValue -= (minWattRange - wattRange) / 2;
                            if (slowestValue < 0) {
                                slowestValue = 0;
                            }
                            fastestValue = slowestValue + minWattRange;
                        }
                    }

                    var topY = 10;
                    var bottomY = chart[0].getAttribute("height") - 10;

                    var slowY = maxY;
                    var fastY = minY;

                    if (showWatts) {
                        // scan Y-axis (time) to check for the reasonable vertical range to use
                        var translateRegEx = /translate\((.*),(.*)\)/;
                        var yAxis = chart.find(".y.axis"); //<g class="y axis" transform="translate(-27.45, 0)">
                        var yOffsetText = yAxis.attr("transform"); // <g class="tick" transform="translate(0,288.4799178150815)" style=...>
                        var ticks = yAxis.find(".tick");

                        var ticksY = ticks.map(function () {
                            var tickText = $(this).attr("transform");
                            var yTick = translateRegEx.exec(tickText)[2];
                            return parseFloat(yTick);
                        });

                        var yTickTop = ticksY[0];
                        var yTickBot = ticksY[ticksY.length - 1];
                        slowY = yTickTop + (yTickBot - yTickTop) * 0.25;
                        fastY = yTickBot - (yTickBot - yTickTop) * 0.2;

                        // produce a few watt labels
                        var step = 25;
                        if (fastestValue - slowestValue >= 400) {
                            step = 100;
                        } else if (fastestValue - slowestValue >= 200) {
                            step = 50;
                        }
                        var roundFastestDown = Math.floor(fastestValue / step) * step;
                        var roundSlowestUp = Math.ceil(slowestValue / step) * step;

                        var wattMarks = [];
                        for (var mWatts = roundSlowestUp; mWatts <= roundFastestDown + 1; mWatts += step) {
                            wattMarks.push(mWatts);
                        }

                        var wattAxisX = maxX;

                        var gAxis = createElementSVG(document, "g");

                        gAxis.setAttribute("class", "y axis");
                        gAxis.setAttribute("style", "opacity: 1;");
                        gAxis.setAttribute("transform", "translate(" + wattAxisX + ", 0)");

                        wattMarks.forEach(function (mWatts) {
                            var f = ( mWatts - fastestValue) / (slowestValue - fastestValue);
                            var mY = f * (slowY - fastY) + fastY;

                            var g = createElementSVG(document, "g");
                            g.setAttribute("class", "tick");
                            g.setAttribute("style", "opacity: 1;");
                            g.setAttribute("transform", "translate(0," + mY.toFixed(0) + ")");

                            var line = createElementSVG(document, "line");
                            line.setAttribute("x2", "0");
                            line.setAttribute("y2", "0");
                            line.setAttribute("class", "grid");
                            g.appendChild(line);

                            var text = createElementSVG(document, "text");
                            text.setAttribute("x", "50"); // TODO: copy from y axis markers
                            text.setAttribute("y", "0");
                            text.setAttribute("dy", ".32em");
                            text.setAttribute("class", "hra-axis axis-tick-text");
                            text.setAttribute("style", "text-anchor: end;");
                            text.innerHTML = mWatts.toFixed(0) + " W";
                            g.appendChild(text);


                            gAxis.appendChild(g);
                        });

                        var insertDOM = chart.find(".y.axis").eq(0);

                        insertDOM.before(gAxis);
                    }


                    function mapValueToY(value) {
                        return (value - fastestValue) / (slowestValue - fastestValue) * (slowY - fastY) + fastY;
                    }

                    function clampY(resY) {
                        return Math.min(Math.max(topY, resY), bottomY);
                    }

                    // compute values for marks with HR data
                    var markData = marks.map(function (i, m) {
                        var xy = xyFromMark(m);

                        var r = fetchedLeaderboardData[i];

                        if (r.hraValue != null) {
                            var resY = mapValueToY(r.hraValue);
                            return [[i, m, resY, r.hraValue, xy.x]];
                        }
                    });

                    // create the SVG marks
                    var mappedMarks = $.map(markData, function (imr) {
                        var i = imr[0], m = imr[1], resY = imr[2], hraValue = imr[3], mx = imr[4];

                        var clampedY = clampY(resY);

                        // Cannot create SVG as HTML source - see http://stackoverflow.com/a/6149687/16673
                        var mark = createElementSVG(document, "circle");
                        mark.setAttribute("class", "hra-time-mark mark");
                        mark.setAttribute("cx", mx);
                        mark.setAttribute("cy", clampedY);
                        mark.setAttribute("r", 3);

                        if (resY < topY || resY > bottomY) {
                            var title = createElementSVG(document, "text");
                            title.innerHTML = showWatts ? hraValue.toFixed(0) : Helper.secondsToHHMMSS(hraValue, true);
                            title.setAttribute("x", mx + 4);
                            title.setAttribute("y", clampedY + 4);
                            title.setAttribute("class", "axis-tick-text");
                            return [mark, title];
                        }

                        return mark;

                    });

                    // create the SVG lines connecting the marks
                    var lines = [];
                    for (var i = 1; i < markData.length; i++) {
                        var imrPrev = markData[i - 1];
                        var imrNext = markData[i];
                        var line = createElementSVG(document, "line");
                        line.setAttribute("class", "hra-line");
                        line.setAttribute("x1", imrPrev[4]);
                        line.setAttribute("y1", clampY(imrPrev[2]));
                        line.setAttribute("x2", imrNext[4]);
                        line.setAttribute("y2", clampY(imrNext[2]));

                        lines.push(line);
                    }


                    // insert the elements into the SVG
                    var firstMark = chart.find("circle").eq(0);
                    firstMark.before(mappedMarks);

                    var bestMark = chart.find("circle").filter(".personal-best-mark");
                    bestMark.after(lines);
                }
            });

            clearInterval(this.hraTimeLoop);

        }

    }
};

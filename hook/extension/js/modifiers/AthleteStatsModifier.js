/**
 *   AthleteStatsModifier is responsible of ...
 */
function AthleteStatsModifier(appResources) {
    this.appResources = appResources;
    this.cacheKey_ = 'activitiesHistoryData';
    this.distanceUnit = "km";
    this.distanceInKilometers = true;
    this.elevationUnit = "m";
    this.elevationInMeters = true;
}

/**
 * Define prototype
 */
AthleteStatsModifier.prototype = {

    modify: function modify() {

        var self = this;

        // wait for My Stats load
        if ($("#ytd_year_bike, #ytd_year_run").length === 0) {
            setTimeout(function () {
                modify.call(self);
            }, 500);
            return;
        }

        var metersTo1000thOfMileFactor = 0.621371192,
            metersToFeetsFactor = 3.2808399,
            total = 0,
            i,
            max,
            url = '/athlete/training_activities?new_activity_only=false&per_page=2000&page=',
            currentActivities = [],
            requests = [],
            activitiesFromCache = localStorage.getItem(this.cacheKey_),
            activitiesFromCacheObject = JSON.parse(activitiesFromCache) || [],
            progress = $("#progress-goals-v2"),
            progressThisYear = $("<div class='section'><h3>My year progressions to current month/day <span id='athleteStatsLoading' class='ajax-loading-image'></span></h3><div>This panel displays your progress for each beginning of year to current month and day. Assuming today is May 25, this panel shows \"What I've accomplished by May 25 of this year compared to previous years during the same period.\"<br/><br/><input type='checkbox' id='stravistix_yearProgress_incVirtualRides'/> Include Virtual Rides</div><div><ul class='switches'><li><a class='button btn-xs' data-activity-type='0' style='display: none;'>Cycling</a></li><li><a class='button btn-xs' data-activity-type='1' style='display: none;'>Running</a></li><li class='last-child' id='athleteStatsShowChart' style='display: none;'><a class='button btn-xs' style='max-height: 24px;' title='Chart'><img style='height: 12px;' src='" + self.appResources.trendingUpIcon + "'/></a></li><li>&nbsp;&nbsp;&nbsp;<a href='#' id='athleteStatsLoadingForceRefresh' style='display: none'>Force refresh</a></li></ul></div></div>");

        var formatData = function (activities) {

            var includeVirtualRide = (StorageManager.getCookie('stravistix_yearProgress_incVirtualRides') === "true");

            var formattedData = [],
                i,
                max,
                activity,
                date;
            for (i = 0, max = activities.length; i < max; i++) {
                activity = activities[i];
                if (activity.type === "Ride" || activity.type === "Run" || (includeVirtualRide && activity.type === "VirtualRide")) {
                    date = new Date(activity.start_time);
                    formattedData.push({
                        t: (activity.type === "Ride" || (includeVirtualRide && activity.type === "VirtualRide")) ? 0 : 1,
                        y: date.getFullYear(),
                        m: date.getMonth(),
                        d: date.getDate(),
                        di: activity.distance_raw,
                        el: activity.elevation_gain_raw,
                        ti: activity.moving_time_raw
                    });
                }
            }
            return formattedData;
        };

        var renderTrendArrow = function (value, formatFunction) {
            if (value === undefined) {
                return "";
            }
            var formatted = formatFunction ? formatFunction(value) : value;
            return "<span title='" + (value < 0 ? "-" : (value > 0 ? "+" : "")) + formatted + "' style='cursor: help; color:" + (value < 0 ? "red" : (value > 0 ? "green" : "black")) + "'>" + (value < 0 ? "\u25BC" : (value > 0 ? "\u25B2" : "=")) + "</span>";
        };

        var processData = function (activities) {
            var types = [],
                years,
                yearsList = [],
                i,
                j,
                max,
                isCurrentYear,
                distanceDifference,
                activitiesCountDifference,
                elevationDifference,
                timeDifference,
                activity,
                currentDate = new Date(),
                currentYear = currentDate.getFullYear(),
                currentMonth = currentDate.getMonth(),
                currentDay = currentDate.getDate();
            for (i = 0, max = activities.length; i < max; i++) {
                activity = activities[i];
                if (!types[activity.t]) {
                    types[activity.t] = [];
                }
                years = types[activity.t];
                if (!years[activity.y]) {
                    years[activity.y] = {
                        year: activity.y,
                        distance: 0,
                        elevation: 0,
                        time: 0,
                        count: 0
                    };
                }
                if ((activity.m < currentMonth) || (activity.m == currentMonth && activity.d <= currentDay)) {
                    years[activity.y].distance += activity.di;
                    years[activity.y].elevation += activity.el;
                    years[activity.y].time += activity.ti;
                    years[activity.y].count += 1;
                }
            }

            if (types.length === 0) {
                progressThisYear.remove();
                return;
            }

            for (i in types) {
                years = types[i];
                yearsList = [];
                var $table = $("<table class='athletesStatTable' id='athletesStatActivityType" + i + "' style='display: none;'><thead><tr><th>Year</th><th>Distance</th><th>Elevation</th><th>Time</th></tr></thead><tbody></tbody></table>");

                years = years.sort(function (left, right) {
                    return right.year - left.year;
                }).forEach(function (item) {
                    if (!self.distanceInKilometers) {
                        item.distance = item.distance * metersTo1000thOfMileFactor;
                    }
                    if (!self.elevationInMeters) {
                        item.elevation = item.elevation * metersToFeetsFactor;
                    }
                    yearsList.push(item);
                });
                for (j = 0, max = yearsList.length; j < max; j++) {
                    var item = yearsList[j];
                    item.distance /= 1000;
                    if (j < (yearsList.length - 1)) {
                        var previousYearItem = yearsList[j + 1];
                        distanceDifference = item.distance - (previousYearItem.distance / 1000);
                        activitiesCountDifference = item.count - previousYearItem.count;
                        elevationDifference = item.elevation - previousYearItem.elevation;
                        timeDifference = item.time - previousYearItem.time;
                    } else {
                        timeDifference = elevationDifference = activitiesCountDifference = distanceDifference = undefined;
                    }
                    isCurrentYear = item.year === currentYear;
                    $table.find("tbody").append($(
                        "<tr class='" + (isCurrentYear ? 'currentyear' : '') + "'>" +
                        "<td><div style='white-space: nowrap;'>" + item.year + "</div><div style='white-space: nowrap;'><small>" + (isCurrentYear ? ('0' + (currentMonth + 1)).slice(-2) + "/" + ('0' + currentDay).slice(-2) : "") + "</small></div></td>" +
                        "<td><div style='white-space: nowrap;'>" + Helper.formatNumber(item.distance, 0) + " " + self.distanceUnit + renderTrendArrow(distanceDifference, function (value) {
                            return Helper.formatNumber(Math.abs(value), 0) + " " + self.distanceUnit;
                        }) + "</div><div style='white-space: nowrap;'><small>" + Helper.formatNumber(item.count, 0) + " " + (i == 0 ? "Rides" : "Runs") + renderTrendArrow(activitiesCountDifference, function (value) {
                            return Helper.formatNumber(Math.abs(value), 0) + " " + (i == 0 ? "Rides" : "Runs");
                        }) + "</small></div></td>" +
                        "<td><div style='white-space: nowrap;'>" + Helper.formatNumber(item.elevation, 0) + " " + self.elevationUnit + renderTrendArrow(elevationDifference, function (value) {
                            return Helper.formatNumber(Math.abs(value), 0) + " " + self.elevationUnit;
                        }) + "</div></td>" +
                        "<td><div style='white-space: nowrap;'>" + Helper.secondsToDHM(item.time) + renderTrendArrow(timeDifference, function (value) {
                            return Helper.secondsToDHM(Math.abs(value));
                        }) + "</div></td>" +
                        "</tr>"
                    ));
                }
                progressThisYear.append($table);
                progressThisYear.find("a[data-activity-type=" + i + "]").show();
                progressThisYear.find("#athleteStatsShowChart").show();
            }

            progressThisYear.find(".switches .button:visible").first().click();
        };

        var init = function (activities) {
            processData(activities);
            progressThisYear.find("#athleteStatsLoading").remove();
            progressThisYear.find("#athleteStatsLoadingForceRefresh").show().click(function (e) {
                e.preventDefault();
                self.handleProgressStatsForceRefresh_();
            });


            progressThisYear.find('#stravistix_yearProgress_incVirtualRides').prop('checked', StorageManager.getCookie('stravistix_yearProgress_incVirtualRides') === "true");

            progressThisYear.find('#stravistix_yearProgress_incVirtualRides').on('click', function () {

                StorageManager.setCookie('stravistix_yearProgress_incVirtualRides', $('#stravistix_yearProgress_incVirtualRides').prop('checked'), 365);
                self.handleProgressStatsForceRefresh_();

            });
        };

        $(progressThisYear).on("click", "a[data-activity-type]", function (e) {
            e.preventDefault();
            var $this = $(this),
                activityType = $this.data("activity-type");
            progressThisYear.find(".athletesStatTable").hide();
            progressThisYear.find("#athletesStatActivityType" + activityType).show();
            progressThisYear.find("a.button").removeClass("selected");
            $this.addClass("selected");
        });

        $(progressThisYear).on("click", "#athleteStatsShowChart a", function (e) {
            e.preventDefault();
            var activityType = progressThisYear.find("a[data-activity-type].selected").data("activity-type");
            var size = [
                window.innerWidth * 0.9,
                window.innerHeight * 0.8
            ];

            var html = '<div style="padding-bottom: 10px; text-align: center;"><div style="height:' + size[1] + 'px;width:' + size[0] + 'px; overflow: hidden;">' +
                '<div id="athleteStatChart" style="float: left; width: ' + (size[0] - 200) + 'px;height:' + (size[1] - 100) + 'px;"></div>' +
                '<div style="float:right; width: 180px; text-align: left;" id="athleteStatChartLegend">' +
                '<div>Chart of:</div><ul id="athleteStatChartTypes">' +
                '<li style="margin: 8px"><input id="asrdt0" type="radio" checked name="data-type" value="1" /><label style="display: inline" for="asrdt0">Distance</label></li>' +
                '<li style="margin: 8px"><input id="asrdt1" type="radio" name="data-type" value="0" /><label style="display: inline" for="asrdt1">Activity count</label></li>' +
                '<li style="margin: 8px"><input id="asrdt2" type="radio" name="data-type" value="2" /><label style="display: inline" for="asrdt2">Elevation</label></li>' +
                '<li style="margin: 8px"><input id="asrdt3" type="radio" name="data-type" value="3" /><label style="display: inline" for="asrdt3">Time</label></li>' +
                '<li style="margin: 8px"><input id="asrdt4" type="radio" name="data-type" value="4" /><label style="display: inline" for="asrdt4">Distance last year</label></li>' +
                '<li style="margin: 8px"><input id="asrdt5" type="radio" name="data-type" value="5" /><label style="display: inline" for="asrdt5">Distance last 30d</label></li>' +
                '</ul>' +
                '<div style="margin-top: 20px;">Years:</div>' +
                '<ul id="athleteStatChartYears"></ul>' +
                '</div></div></div>' +
                '<style type="text/css">.axis line,.axis path,svg.line-graph .axis{shape-rendering:crispEdges}.axis text{font:10px sans-serif}.axis line,.axis path{fill:none;stroke:#000}path{stroke-width:2;fill:none}path.current{stroke-width:4}#athleteStatChart text.date{fill:#000;font:10px sans-serif;stroke-width:0}svg.line-graph text{cursor:default}.hover-line{stroke:#6E7B8B}.hover-line .hide,path.hide{opacity:0}svg.line-graph .x.axis line{stroke:#D3D3D3}svg.line-graph .x.axis .minor{stroke-opacity:.5}svg.line-graph .x.axis path{display:none}svg.line-graph .x.axis text{font-size:10px}.y.axis path,svg.line-graph .y.axis line{fill:none;stroke:#000}svg.line-graph .y.axis text{font-size:12px}svg.line-graph .scale-button:not(.selected):hover{text-decoration:underline;cursor:pointer!important}svg.line-graph .date-label{fill:#6E7B8B}</style>';
            $.fancybox(html, {
                'title': 'Year progression chart',
                'autoScale': true,
                'transitionIn': 'fade',
                'transitionOut': 'fade'
            });
            prepareChart(currentActivities.filter(function (activity) {
                return activity.t == activityType;
            }));
        });

        var prepareChart = function (activities) {
            var i,
                j,
                numberOfDays = 366,
                max,
                activity,
                day,
                currentDataType = 1, // 0 - count, 1 - distance, 2 - elevation, 3 - time
                data = [],
                minValue = 0,
                maxValue = 0,
                leapYear = 2000,
                firstDayDate = new Date(leapYear, 0, 1),
                lastDayDate = new Date(leapYear, 11, 31, 23, 59, 59),
                currentDate = new Date(),
                currentYear = currentDate.getFullYear(),
                oneDayInMiliseconds = 1000 * 60 * 60 * 24,
                dayOfYear = function (date) {
                    var now = new Date(leapYear, date.getMonth(), date.getDate(), 12);
                    var diff = now - firstDayDate;
                    var day = Math.floor(diff / oneDayInMiliseconds);
                    return day;
                },
                createArrayOfValues = function (length, value) {
                    var result = [];
                    while (length--) {
                        result.push(value || 0);
                    }
                    return result;
                },
                currentDayOfYear = dayOfYear(currentDate),
                formatValue = function (value) {
                    switch (currentDataType) {
                    case 1:
                        if (!self.distanceInKilometers) {
                            value *= metersTo1000thOfMileFactor;
                        }
                        return Helper.formatNumber(value / 1000, 0) + " " + self.distanceUnit;

                    case 2:
                        if (!self.elevationInMeters) {
                            value *= metersToFeetsFactor;
                        }
                        return Helper.formatNumber(value, 0) + " " + self.elevationUnit;

                    case 3:
                        return Helper.secondsToDHM(value, true);

                    default:
                        return Helper.formatNumber(value, 0);
                    }
                },
                processData = function () {
                    data = [];
                    for (i = 0, max = activities.length; i < max; i++) {
                        activity = activities[i];
                        if (!data[activity.y]) {
                            data[activity.y] = {
                                year: activity.y,
                                values: createArrayOfValues(numberOfDays)
                            };
                        }
                        var yearlyData = data[activity.y];
                        day = dayOfYear(new Date(activity.y, activity.m, activity.d));
                        for (j = day; j < numberOfDays; j++) {
                            switch (currentDataType) {
                            case 1:
                                yearlyData.values[j] += activity.di;
                                break;

                            case 2:
                                yearlyData.values[j] += activity.el;
                                break;

                            case 3:
                                yearlyData.values[j] += activity.ti;
                                break;

                            default:
                                yearlyData.values[j] += 1;
                                break;
                            }
                        }
                    }

                    if (data[currentYear]) {
                        data[currentYear].values = data[currentYear].values.slice(0, currentDayOfYear + 1);
                    }

                    data.sort(function (left, right) {
                        return left.year - right.year;
                    });

                    maxValue = 0;
                    data.forEach(function (item) {
                        i = d3.max(item.values);
                        if (i > maxValue) {
                            maxValue = i;
                        }
                    });
                    maxValue *= 1.1;
                };

            processData();

            var container = "#athleteStatChart",
                width = $(container).width(),
                height = $(container).height();

            var margin = {
                    top: 20,
                    right: 80,
                    bottom: 30,
                    left: 90
                },
                w = width - margin.left - margin.right,
                h = height - margin.top - margin.bottom;

            var y = d3.scale.linear()
                .domain([minValue, maxValue])
                .range([h, 0]);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickFormat(function (d) {
                    return formatValue(d);
                });

            var x = d3.time.scale()
                .domain([firstDayDate, lastDayDate])
                .range([0, w]);

            var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(d3.time.months)
                .tickSize(16, 0)
                .tickFormat(d3.time.format("%B"));

            var svg = d3.select("#athleteStatChart").append("svg")
                .attr("width", w + margin.left + margin.right)
                .attr("height", h + margin.top + margin.bottom);

            svg.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(yAxis);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(" + margin.left + "," + (h + margin.top) + ")")
                .call(xAxis)
                .selectAll(".tick text")
                .style("text-anchor", "start")
                .attr("x", 6)
                .attr("y", 6);

            var line = d3.svg.line()
                .y(function (d, i) {
                    return y(d) + margin.top;
                })
                .x(function (d, i) {
                    var dateFrom = new Date(firstDayDate.getTime());
                    if (i > 0) {
                        dateFrom.setHours(23, 59, 59);
                    }
                    dateFrom.setDate(dateFrom.getDate() + i);
                    return x(dateFrom) + margin.left;
                }).interpolate("basis");

            var color = d3.scale.category10(),
                trendLinesGroup = svg.append("svg:g");

            var generateLines = function () {
                var i = 0;
                $("#athleteStatChartYears").empty();
                trendLinesGroup.selectAll("path.trend-line").remove();
                data.forEach(function (yearData) {
                    var year = yearData.year,
                        id = "ascy" + year,
                        liYear = $("<li style='margin: 8px'><input id='" + id + "' checked type='checkbox' value='" + year + "'/><label for='" + id + "' style='display: inline; color: " + color(i) + ";'>" + year + "</label></li>"),
                        liSpan = $("<span style='display: inline-block; margin-left: 10px; width: 80px; text-align: right; color: black;'></span>");
                    liYear.append(liSpan);
                    $("#athleteStatChartYears").prepend(liYear);
                    yearData.element = trendLinesGroup.append('svg:path')
                        .attr('d', line(yearData.values))
                        .attr('stroke', color(i))
                        .attr('data-year', year)
                        .attr('class', 'trend-line');
                    i++;
                    yearData.$value = liSpan;
                    yearData.element.classed("current", year == currentYear);
                });
            };
            generateLines();

            $("#athleteStatChartYears").on("click", "input[type=checkbox]", {}, function () {
                var year = $(this).val();
                data.filter(function (item) {
                    return item.year == year;
                }).forEach(function (item) {
                    item.element.classed("hide", !item.element.classed("hide"));
                });
            });

            $("#athleteStatChartTypes").on("change", "input[name=data-type]", {}, function () {
                currentDataType = +$(this).val();
                hoverLine.classed("hide", true);
                hoverLineText.classed("hide", true);
                processData();
                y.domain([minValue, maxValue]);
                generateLines();
                svg.selectAll("g.y.axis").call(yAxis);
            });

            var hoverLine,
                hoverLineText,
                hoverLineXOffset,
                hoverLineYOffset,
                hoverLineGroup;

            hoverLineXOffset = margin.left + $(container).offset().left;
            hoverLineYOffset = margin.top + $(container).offset().top;

            hoverLineGroup = svg.append("svg:g")
                .attr("class", "hover-line");

            hoverLine = hoverLineGroup
                .append("svg:line")
                .attr("transform", "translate(" + margin.left + ",0)")
                .attr("x1", 0).attr("x2", 0)
                .attr("y1", margin.top).attr("y2", h + margin.top);

            hoverLine.classed("hide", true);

            hoverLineText = hoverLineGroup.append("svg:text")
                .attr("x", 0)
                .attr("y", margin.top)
                .attr("dy", "1em")
                .text("data")
                .attr("transform", "translate(" + margin.left + ",0)");
            hoverLineText.classed("date", true);
            hoverLineText.classed("hide", true);

            var handleMouseOverGraph = function (event) {
                var mouseX = event.pageX - hoverLineXOffset,
                    mouseY = event.pageY - hoverLineYOffset;

                if (mouseX >= 0 && mouseX <= w && mouseY >= 0 && mouseY <= h) {
                    hoverLine.attr("x1", mouseX).attr("x2", mouseX);
                    hoverLineText.attr("x", mouseX + 5);

                    var date = x.invert(mouseX),
                        day = dayOfYear(date);

                    data.forEach(function (item) {
                        if (day < item.values.length) {
                            item.$value.text(formatValue(item.values[day]));
                        } else {
                            item.$value.text("");
                        }
                    });

                    hoverLineText.text(date.getDate() + " " + months[date.getMonth()]);
                    hoverLine.classed("hide", false);
                    hoverLineText.classed("hide", false);
                }
            };

            $(container).mousemove(function (event) {
                handleMouseOverGraph(event);
            });
        };

        $(progressThisYear).on("click", "#athleteStatsShowChart a", function (e) {
            e.preventDefault();
            var activityType = progressThisYear.find("a[data-activity-type].selected").data("activity-type");
            var size = [
                window.innerWidth * 0.9,
                window.innerHeight * 0.8
            ];

            var html = '<div style="padding-bottom: 10px; text-align: center;"><div style="height:' + size[1] + 'px;width:' + size[0] + 'px; overflow: hidden;">' +
                '<div id="athleteStatChart" style="float: left; width: ' + (size[0] - 200) + 'px;height:' + (size[1] - 100) + 'px;"></div>' +
                '<div style="float:right; width: 180px; text-align: left;" id="athleteStatChartLegend">' +
                '<div>Chart of:</div><ul id="athleteStatChartTypes">' +
                '<li style="margin: 8px"><input id="asrdt0" type="radio" checked name="data-type" value="1" /> <label style="display: inline" for="asrdt0">Distance</label></li>' +
                '<li style="margin: 8px"><input id="asrdt1" type="radio" name="data-type" value="0" /> <label style="display: inline" for="asrdt1">Activity count</label></li>' +
                '<li style="margin: 8px"><input id="asrdt2" type="radio" name="data-type" value="2" /> <label style="display: inline" for="asrdt2">Elevation</label></li>' +
                '<li style="margin: 8px"><input id="asrdt3" type="radio" name="data-type" value="3" /> <label style="display: inline" for="asrdt3">Time</label></li>' +
                '<li style="margin: 8px"><input id="asrdt4" type="radio" name="data-type" value="4" /> <label style="display: inline" for="asrdt4">Distance last year</label></li>' +
                '<li style="margin: 8px"><input id="asrdt5" type="radio" name="data-type" value="5" /> <label style="display: inline" for="asrdt5">Distance last 30d</label></li>' +
                '</ul>' +
                '<div style="margin-top: 20px;">Years:</div>' +
                '<ul id="athleteStatChartYears"></ul>' +
                '</div></div></div>' +
                '<style type="text/css">.axis line,.axis path,svg.line-graph .axis{shape-rendering:crispEdges}.axis text{font:10px sans-serif}.axis line,.axis path{fill:none;stroke:#000}path{stroke-width:2;fill:none}path.current{stroke-width:4}#athleteStatChart text.date{fill:#000;font:10px sans-serif;stroke-width:0}svg.line-graph text{cursor:default}.hover-line{stroke:#6E7B8B}.hover-line .hide,path.hide{opacity:0}svg.line-graph .x.axis line{stroke:#D3D3D3}svg.line-graph .x.axis .minor{stroke-opacity:.5}svg.line-graph .x.axis path{display:none}svg.line-graph .x.axis text{font-size:10px}.y.axis path,svg.line-graph .y.axis line{fill:none;stroke:#000}svg.line-graph .y.axis text{font-size:12px}svg.line-graph .scale-button:not(.selected):hover{text-decoration:underline;cursor:pointer!important}svg.line-graph .date-label{fill:#6E7B8B}</style>';
            $.fancybox(html, {
                'title': 'Year progression chart',
                'autoScale': true,
                'transitionIn': 'fade',
                'transitionOut': 'fade'
            });
            prepareChart(currentActivities.filter(function (activity) {
                return activity.t == activityType;
            }));
        });

        var prepareChart = function (activities) {
            var i,
                j,
                numberOfDays = 366,
                max,
                activity,
                day,
                currentDataType = 1, // 0 - count, 1 - distance, 2 - elevation, 3 - time
                data = [],
                minValue = 0,
                maxValue = 0,
                leapYear = 2000,
                firstDayDate = new Date(leapYear, 0, 1),
                lastDayDate = new Date(leapYear, 11, 31, 23, 59, 59),
                currentDate = new Date(),
                currentYear = currentDate.getFullYear(),
                oneDayInMiliseconds = 1000 * 60 * 60 * 24,
                dayOfYear = function (date) {
                    var now = new Date(leapYear, date.getMonth(), date.getDate(), 12);
                    var diff = now - firstDayDate;
                    var day = Math.floor(diff / oneDayInMiliseconds);
                    return day;
                },
                createArrayOfValues = function (length, value) {
                    var result = [];
                    while (length--) {
                        result.push(value || 0);
                    }
                    return result;
                },
                currentDayOfYear = dayOfYear(currentDate),
                formatValue = function (value) {
                    switch (currentDataType) {
                    case 1:
                    case 4:
                    case 5:
                        if (!self.distanceInKilometers) {
                            value *= metersTo1000thOfMileFactor;
                        }
                        return Helper.formatNumber(value / 1000, 0) + " " + self.distanceUnit;

                    case 2:
                        if (!self.elevationInMeters) {
                            value *= metersToFeetsFactor;
                        }
                        return Helper.formatNumber(value, 0) + " " + self.elevationUnit;

                    case 3:
                        return Helper.secondsToDHM(value, true);

                    default:
                        return Helper.formatNumber(value, 0);
                    }
                },
                processData = function () {
                    data = [];
                    for (i = 0, max = activities.length; i < max; i++) {
                        activity = activities[i];
                        if (!data[activity.y]) {
                            data[activity.y] = {
                                year: activity.y,
                                values: createArrayOfValues(numberOfDays)
                            };
                        }
                        var yearlyData = data[activity.y];
                        var activityDate = new Date(activity.y, activity.m, activity.d);
                        var activityTime = activityDate.getTime();
                        day = dayOfYear(activityDate);
                        if (currentDataType < 4) {
                            for (j = day; j < numberOfDays; j++) {
                                switch (currentDataType) {
                                case 1:
                                    yearlyData.values[j] += activity.di;
                                    break;

                                case 2:
                                    yearlyData.values[j] += activity.el;
                                    break;

                                case 3:
                                    yearlyData.values[j] += activity.ti;
                                    break;

                                default:
                                    yearlyData.values[j] += 1;
                                    break;
                                }
                            }
                        } else {
                            for (j = 0; j < numberOfDays; j++) {
                                if (activity.y == currentYear && j > currentDayOfYear) {
                                    continue;
                                }
                                switch (currentDataType) {
                                case 4:
                                    if (j == day) {
                                        data[activity.y].values[j] += activity.di;
                                        if (activity.y < currentYear) {
                                            data[activity.y + 1].values[j] += activity.di;
                                        }
                                    } else if (j > day) {
                                        data[activity.y].values[j] += activity.di;
                                    } else if (activity.y < currentYear) {
                                        data[activity.y + 1].values[j] += activity.di;
                                    }
                                    break;
                                case 5:
                                    var jDate = new Date(activity.y, 0, j).getTime();
                                    if (jDate >= activityTime && jDate <= activityTime + 30 * oneDayInMiliseconds) {
                                        data[activity.y].values[j] += activity.di;
                                    }
                                    if (activity.y < currentYear) {
                                        jDate = new Date(activity.y + 1, 0, j).getTime();
                                        if (jDate >= activityTime && jDate <= activityTime + 30 * oneDayInMiliseconds) {
                                            data[activity.y + 1].values[j] += activity.di;
                                        }
                                    }
                                    break;
                                default:
                                    break;
                                }
                            }
                        }
                    }

                    if (data[currentYear]) {
                        data[currentYear].values = data[currentYear].values.slice(0, currentDayOfYear + 1);
                    }

                    data.sort(function (left, right) {
                        return left.year - right.year;
                    });

                    maxValue = 0;
                    data.forEach(function (item) {
                        i = d3.max(item.values);
                        if (i > maxValue) {
                            maxValue = i;
                        }
                    });
                    maxValue *= 1.1;
                };

            processData();

            var container = "#athleteStatChart",
                width = $(container).width(),
                height = $(container).height();

            var margin = {
                    top: 20,
                    right: 80,
                    bottom: 30,
                    left: 90
                },
                w = width - margin.left - margin.right,
                h = height - margin.top - margin.bottom;

            var y = d3.scale.linear()
                .domain([minValue, maxValue])
                .range([h, 0]);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickFormat(function (d) {
                    return formatValue(d);
                });

            var x = d3.time.scale()
                .domain([firstDayDate, lastDayDate])
                .range([0, w]);

            var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(d3.time.months)
                .tickSize(16, 0)
                .tickFormat(d3.time.format("%B"));

            var svg = d3.select("#athleteStatChart").append("svg")
                .attr("width", w + margin.left + margin.right)
                .attr("height", h + margin.top + margin.bottom);

            svg.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(yAxis);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(" + margin.left + "," + (h + margin.top) + ")")
                .call(xAxis)
                .selectAll(".tick text")
                .style("text-anchor", "start")
                .attr("x", 6)
                .attr("y", 6);

            var line = d3.svg.line()
                .y(function (d, i) {
                    return y(d) + margin.top;
                })
                .x(function (d, i) {
                    var dateFrom = new Date(firstDayDate.getTime());
                    if (i > 0) {
                        dateFrom.setHours(23, 59, 59);
                    }
                    dateFrom.setDate(dateFrom.getDate() + i);
                    return x(dateFrom) + margin.left;
                }).interpolate("basis");

            var color = d3.scale.category10(),
                trendLinesGroup = svg.append("svg:g");

            var generateLines = function () {
                var i = 0;
                $("#athleteStatChartYears").empty();
                trendLinesGroup.selectAll("path.trend-line").remove();
                data.forEach(function (yearData) {
                    var year = yearData.year,
                        id = "ascy" + year,
                        liYear = $("<li style='margin: 8px'><input id='" + id + "' checked type='checkbox' value='" + year + "'/><label for='" + id + "' style='display: inline; color: " + color(i) + ";'>" + year + "</label></li>"),
                        liSpan = $("<span style='display: inline-block; margin-left: 10px; width: 80px; text-align: right; color: black;'></span>");
                    liYear.append(liSpan);
                    $("#athleteStatChartYears").prepend(liYear);
                    yearData.element = trendLinesGroup.append('svg:path')
                        .attr('d', line(yearData.values))
                        .attr('stroke', color(i))
                        .attr('data-year', year)
                        .attr('class', 'trend-line');
                    i++;
                    yearData.$value = liSpan;
                    yearData.element.classed("current", year == currentYear);
                });
            };
            generateLines();

            $("#athleteStatChartYears").on("click", "input[type=checkbox]", {}, function () {
                var year = $(this).val();
                data.filter(function (item) {
                    return item.year == year;
                }).forEach(function (item) {
                    item.element.classed("hide", !item.element.classed("hide"));
                });
            });

            $("#athleteStatChartTypes").on("change", "input[name=data-type]", {}, function () {
                currentDataType = +$(this).val();
                hoverLine.classed("hide", true);
                hoverLineText.classed("hide", true);
                processData();
                y.domain([minValue, maxValue]);
                generateLines();
                svg.selectAll("g.y.axis").call(yAxis);
            });

            var hoverLine,
                hoverLineText,
                hoverLineXOffset,
                hoverLineYOffset,
                hoverLineGroup;

            hoverLineXOffset = margin.left + $(container).offset().left;
            hoverLineYOffset = margin.top + $(container).offset().top;

            hoverLineGroup = svg.append("svg:g")
                .attr("class", "hover-line");

            hoverLine = hoverLineGroup
                .append("svg:line")
                .attr("transform", "translate(" + margin.left + ",0)")
                .attr("x1", 0).attr("x2", 0)
                .attr("y1", margin.top).attr("y2", h + margin.top);

            hoverLine.classed("hide", true);

            hoverLineText = hoverLineGroup.append("svg:text")
                .attr("x", 0)
                .attr("y", margin.top)
                .attr("dy", "1em")
                .text("data")
                .attr("transform", "translate(" + margin.left + ",0)");
            hoverLineText.classed("date", true);
            hoverLineText.classed("hide", true);

            var handleMouseOverGraph = function (event) {
                var mouseX = event.pageX - hoverLineXOffset,
                    mouseY = event.pageY - hoverLineYOffset;

                if (mouseX >= 0 && mouseX <= w && mouseY >= 0 && mouseY <= h) {
                    hoverLine.attr("x1", mouseX).attr("x2", mouseX);
                    hoverLineText.attr("x", mouseX + 5);

                    var date = x.invert(mouseX),
                        day = dayOfYear(date);

                    data.forEach(function (item) {
                        if (day < item.values.length) {
                            item.$value.text(formatValue(item.values[day]));
                        } else {
                            item.$value.text("");
                        }
                    });

                    hoverLineText.text(date.getDate() + " " + months[date.getMonth()]);
                    hoverLine.classed("hide", false);
                    hoverLineText.classed("hide", false);
                }
            };

            $(container).mousemove(function (event) {
                handleMouseOverGraph(event);
            });
        };

        progressThisYear.insertBefore(progress);

        total = parseInt($("div.cycling table tbody:last tr:nth(2) td:last").text() || "0");
        total = total + parseInt($("div.running table tbody:last tr:last td:last").text() || "0");

        var measurementPreference = currentAthlete ? currentAthlete.get('measurement_preference') : 'meters';
        if (measurementPreference != 'meters') {
            self.distanceInKilometers = false;
            self.distanceUnit = "mi";
            self.elevationInMeters = false;
            self.elevationUnit = "ft";
        }

        if (total != activitiesFromCacheObject.length) {
            requests.push($.ajax({
                url: url + "1",
                success: function (data) {
                    for (i = 2, max = Math.ceil(data.total / data.perPage); i <= max; i++) {
                        requests.push($.ajax(url + i));
                    }
                    $.when.apply(self, requests).done(function () {
                        for (i in requests) {
                            var request = requests[i];
                            if (request.responseJSON.models) {
                                currentActivities = currentActivities.concat(request.responseJSON.models);
                            }
                        }
                        currentActivities = formatData(currentActivities);
                        init(currentActivities);
                        try {
                            localStorage.setItem(self.cacheKey_, JSON.stringify(currentActivities));
                        } catch (err) {
                            console.warn(err);
                            localStorage.clear();
                        }
                    });
                }
            }));
        } else {
            currentActivities = activitiesFromCacheObject;
            init(activitiesFromCacheObject);
        }
    },

    handleProgressStatsForceRefresh_: function handleProgressStatsForceRefresh_() {
        localStorage.removeItem(this.cacheKey_);
        window.location.reload();
    }
};

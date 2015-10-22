/**
 *   AthleteStatsModifier is responsible of ...
 */
function AthleteStatsModifier() {
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

        // wait for My Stats load
        if ($("#ytd_year_bike, #ytd_year_run").length === 0) {
            setTimeout(function() {
                modify();
            }, 500);
            return;
        }

        var self = this,
            total = 0,
            i,
            max,
            url = '/athlete/training_activities?new_activity_only=false&per_page=20&page=',
            currentActivities = [],
            requests = [],
            activitiesFromCache = localStorage.getItem(this.cacheKey_),
            activitiesFromCacheObject = JSON.parse(activitiesFromCache) || [],
            progress = $("#progress-goals"),
            progressThisYear = $("<div class='section'><h3>My year progressions to current month/day <span id='athleteStatsLoading' class='ajax-loading-image'></span></h3><div>This panel allows you to see your progress for each beginning of year to current month and day. Assuming May 25 is today, this panel replies to \"What i've accomplished on May 25 of this year compared to the previous years on same period?\"<br/><br/></div><div><ul class='switches'><li><a class='button btn-xs' data-activity-type='0' style='display: none;'>Cycling</a></li><li><a class='button btn-xs' data-activity-type='1' style='display: none;'>Running</a></li><li class='last-child' id='athleteStatsShowChart' style='display: none;'><a class='button btn-xs' title='Chart'>&#128200;</a></li><li>&nbsp;&nbsp;&nbsp;<a href='#' id='athleteStatsLoadingForceRefresh' style='display: none'>Force refresh</a></li></ul></div></div>");

        var formatData = function(activities) {
            var formattedData = [],
                i,
                max,
                activity,
                date;
            for (i = 0, max = activities.length; i < max; i++) {
                activity = activities[i];
                if (activity.type === "Ride" || activity.type === "Run") {
                    date = new Date(activity.start_time);
                    formattedData.push({
                        t: activity.type === "Ride" ? 0 : 1,
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
        
        var renderTrendArrow = function(value, formatFunction) {
            if (value === undefined) {
                return "";
            }
            var formatted = formatFunction ? formatFunction(value) : value;
            return "<span title='" + (value < 0 ? "-" : (value > 0 ? "+" : "")) + formatted + "' style='cursor: help; color:" + (value < 0 ? "red" : (value > 0 ? "green" : "black")) + "'>" + (value < 0 ? "\u25BC" : (value > 0 ? "\u25B2" : "=")) + "</span>";            
        };

        var processData = function(activities) {
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

                years = years.sort(function(left, right) {
                    return right.year - left.year;
                }).forEach(function(item) {                    
                    if (!self.distanceInKilometers) {
                        item.distance = item.distance * 0.621371192;
                    }
                    if (!self.elevationInMeters) {
                        item.elevation = item.elevation * 3.2808399;
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
                        "<td><div style='white-space: nowrap;'>" + Helper.formatNumber(item.distance, 0) + " " + self.distanceUnit + renderTrendArrow(distanceDifference, function(value) { return Helper.formatNumber(Math.abs(value), 0) + " " + self.distanceUnit; }) + "</div><div style='white-space: nowrap;'><small>" + Helper.formatNumber(item.count, 0) + " " + (i == 0 ? "Rides" : "Runs") + renderTrendArrow(activitiesCountDifference, function(value) { return Helper.formatNumber(Math.abs(value), 0) + " " + (i == 0 ? "Rides" : "Runs"); }) + "</small></div></td>" +
                        "<td><div style='white-space: nowrap;'>" + Helper.formatNumber(item.elevation, 0) + " " + self.elevationUnit + renderTrendArrow(elevationDifference, function(value) { return Helper.formatNumber(Math.abs(value), 0) + " " + self.elevationUnit; }) + "</div></td>" +
                        "<td><div style='white-space: nowrap;'>" + Helper.secondsToDHM(item.time) + renderTrendArrow(timeDifference, function(value) { return Helper.secondsToDHM(Math.abs(value)); }) + "</div></td>" + 
                        "</tr>"
                    ));
                };
                progressThisYear.append($table);
                progressThisYear.find("a[data-activity-type=" + i + "]").show();
                progressThisYear.find("#athleteStatsShowChart").show();
            }

            progressThisYear.find(".switches .button:visible").first().click();
        };

        var init = function(activities) {
            processData(activities);
            progressThisYear.find("#athleteStatsLoading").remove();
            progressThisYear.find("#athleteStatsLoadingForceRefresh").show().click(function(e) {
                e.preventDefault();
                self.handleProgressStatsForceRefresh_();
            });
        };

        $(progressThisYear).on("click", "a[data-activity-type]", function(e) {
            e.preventDefault();
            var $this = $(this),
                activityType = $this.data("activity-type");
            progressThisYear.find(".athletesStatTable").hide();
            progressThisYear.find("#athletesStatActivityType" + activityType).show();
            progressThisYear.find("a.button").removeClass("selected");
            $this.addClass("selected");
        });
        
        $(progressThisYear).on("click", "#athleteStatsShowChart a", function(e) {
            e.preventDefault();
            var activityType = progressThisYear.find("a[data-activity-type].selected").data("activity-type");
            var size = [
                window.innerWidth * 0.9,
                window.innerHeight * 0.8
            ];
    
            var html = '<div style="padding-bottom:10px; text-align:center;"><div style="height:' + size[1] + 'px;width:' + size[0] + 'px;">' +
                       '<div id="athleteStatChart" style="float: left; width: ' + (size[0] - 200) + 'px;height:' + (size[1] - 100) + 'px;"></div>' +
                       '<div style="float:right; width: 180px; text-align: left;" id="athleteStatChartLegend">' +
                       '<div>Chart of:</div><ul>' +
                       '<li><input id="asrdt0" type="radio" checked name="data-type" value="0" /><label for="asrdt0">Distance</label></li>' +
                       '<li><input id="asrdt1" type="radio" name="data-type" value="1" /><label for="asrdt1">Activity count</label></li>' +
                       '<li><input id="asrdt2" type="radio" name="data-type" value="2" /><label for="asrdt2">Elevation</label></li>' +
                       '<li><input id="asrdt3" type="radio" name="data-type" value="3" /><label for="asrdt3">Time</label></li>' +
                       '</ul>' +
                       '<div style="margin-top: 20px;">Years:</div>' +
                       '<ul id="athleteStatChartYears"></ul>' +
                       '</div></div></div>' +
                       '<style type="text/css">.axis line,.axis path,svg.line-graph .axis{shape-rendering:crispEdges}.axis text{font:10px sans-serif}.axis line,.axis path{fill:none;stroke:#000}path{stroke-width:1;fill:none}#athleteStatChart text.date{fill:#000;font:10px sans-serif;stroke-width:0}svg.line-graph text{cursor:default}.hover-line{stroke:#6E7B8B}.hover-line .hide,path.hide{opacity:0}svg.line-graph .x.axis line{stroke:#D3D3D3}svg.line-graph .x.axis .minor{stroke-opacity:.5}svg.line-graph .x.axis path{display:none}svg.line-graph .x.axis text{font-size:10px}.y.axis path,svg.line-graph .y.axis line{fill:none;stroke:#000}svg.line-graph .y.axis text{font-size:12px}svg.line-graph .scale-button:not(.selected):hover{text-decoration:underline;cursor:pointer!important}svg.line-graph .date-label{fill:#6E7B8B}</style>';    
            $.fancybox(html, {
                'autoScale': true,
                'transitionIn': 'fade',
                'transitionOut': 'fade'
            });
            prepareChart(currentActivities.filter(function(activity) {
                return activity.t == activityType;
            }));
        });
        
        var prepareChart = function(activities) {
            var data = [
                { year: 2000, values: [10, 20, 30, 40, 50] },
                { year: 2001, values: [1, 1, 3, 3, 4, 5, 6, 7, 8] },
                { year: 2002, values: [0, 0, 1, 1, 2, 2, 3, 6, 6, 6, 7] },
                { year: 2003, values: [10, 10, 11, 11, 21, 21, 31, 61, 61, 61, 71] }
            ];
            
            data.sort(function(left, right) {
                return left.year - right.year;
            });            
            
            var container = "#athleteStatChart",
                width = $(container).width(),
                height = $(container).height();
            
            var margin = { top: 20, right: 80, bottom: 30, left: 90 },
                w = width - margin.left - margin.right,
                h = height - margin.top - margin.bottom;

            var minValue = 0,
                maxValue = d3.max(data, function (d) { return d3.max(d.values); });

            var y = d3.scale.linear()
                .domain([minValue, maxValue])
                .range([h, 0]);

            var yAxis = d3.svg.axis().scale(y).orient("left");

            var x = d3.time.scale()
                .domain([new Date(2012, 0, 1), new Date(2012, 11, 31)])
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
                .y(function (d, i) { var r = y(d) + margin.top; return r; })
                .x(function (d, i) {
                    var dateFrom = new Date('2012-01-01T00:00:00');
                    dateFrom.setDate(dateFrom.getDate() + i);
                    var r = x(dateFrom) + margin.left;
                    return r;
                })
                .interpolate("basis");
           
            var color = d3.scale.category10();
            var i = 0;
            data.forEach(function(yearData) {
                var year = yearData.year,
                    id = "ascy" + year,
                    liYear = $("<li><input id='" + id + "' checked type='checkbox' value='" + year + "'/><label for='" + id + "'>" + year + "</label></li>").css("color", color(i)),
                    liSpan = $("<span style='display: inline-block; margin-left: 10px; width: 50px; text-align: right; color: black;'>value</span>");
                liYear.append(liSpan);
                $("#athleteStatChartYears").append(liYear);
                yearData.element = svg.append('svg:path')
                                   .attr('d', line(yearData.values))
                                   .attr('stroke', color(i))
                                   .attr('stroke-width', 2)
                                   .attr('fill', 'none')
                                   .attr('data-year', year);
                i++;
                yearData.$value = liSpan;
            });
            $("#athleteStatChartLegend li label").css({
                'display': 'inline'
            });
            $("#athleteStatChartLegend li").css({
                'margin': '8px'
            });
            $("#athleteStatChartYears li label").each(function() {
                $(this).css({ "color": $(this).parent("li").css("color") });
            });
            
            $("#athleteStatChartYears").on("click", "input[type=checkbox]", {}, function () {
                var year = $(this).val();
                data.filter(function (item) {
                    return item.year == year;
                }).forEach(function (item) {
                    item.element.classed("hide", !item.element.classed("hide"));
                });
            });

            var hoverLine, hoverLineText, hoverLineXOffset, hoverLineYOffset, hoverLineGroup;

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

            hoverLineText = hoverLineGroup.append("svg:text").attr("x", 0).attr("y", margin.top).attr("dy", "1em").text("data").attr("transform", "translate(" + margin.left + ",0)");
            hoverLineText.classed("date", true);
            hoverLineText.classed("hide", true);
            
            var debouncedSetYearValues = _.debounce(function(day) {
                data.forEach(function (item) {
                    var value;
                    if (day < item.values.length) {
                        value = item.values[day];                        
                    }
                    item.$value.text(value || "");
                });
            }, 50);

            var handleMouseOverGraph = function (event) {
                var mouseX = event.pageX - hoverLineXOffset;
                var mouseY = event.pageY - hoverLineYOffset;

                if (mouseX >= 0 && mouseX <= w && mouseY >= 0 && mouseY <= h) {

                    hoverLine.attr("x1", mouseX).attr("x2", mouseX);
                    hoverLineText.attr("x", mouseX + 5);

                    var date = x.invert(mouseX);
                    var day = dayOfYear(date);
                    
                    debouncedSetYearValues(day);

                    hoverLineText.text(date.getDate() + " " + months[date.getMonth()]);
                    hoverLine.classed("hide", false);
                    hoverLineText.classed("hide", false);
                } else {
                    handleMouseOutGraph(event);
                }
            };

            var dayOfYear = function (date) {
                var now = date;
                var start = new Date(now.getFullYear(), 0, 0);
                var diff = now - start;
                var oneDay = 1000 * 60 * 60 * 24;
                var day = Math.floor(diff / oneDay);
                return day;
            };

            var handleMouseOutGraph = function (event) {
                hoverLine.classed("hide", true);
                hoverLineText.classed("hide", true);
            };

            $(container).mouseleave(function (event) {
                handleMouseOutGraph(event);
            });

            $(container).mousemove(function (event) {
                handleMouseOverGraph(event);
            });
        };

        progressThisYear.insertAfter(progress);

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
            for (i = 1, max = Math.ceil(total / 20); i <= max; i++) {
                requests.push($.ajax(url + i));
            }
            $.when.apply(self, requests).done(function() {
                for (i in requests) {
                    var request = requests[i];
                    if (request.responseJSON.models) {
                        currentActivities = currentActivities.concat(request.responseJSON.models);
                    }
                }
                currentActivities = formatData(currentActivities);
                init(currentActivities);
                localStorage.setItem(self.cacheKey_, JSON.stringify(currentActivities));
            });
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

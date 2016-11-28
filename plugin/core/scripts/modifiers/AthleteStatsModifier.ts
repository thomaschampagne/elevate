import Axis = d3.svg.Axis;
import Linear = d3.scale.Linear;
import Scale = d3.time.Scale;

class AthleteStatsModifier implements IModifier {

    protected appResources: IAppResources;
    protected cacheKey_: string;
    protected distanceUnit: string;
    protected distanceInKilometers: boolean;
    protected elevationUnit: string;
    protected elevationInMeters: boolean;
    protected yearTargets: any;
    protected progressThisYear: JQuery;


    public static metersTo1000thOfMileFactor: number = 0.621371192;
    public static metersToFeetsFactor: number = 3.2808399;

    constructor(appResources: IAppResources, yearTargets: any) {
        this.appResources = appResources;
        this.cacheKey_ = 'activitiesHistoryData';
        this.distanceUnit = "km";
        this.distanceInKilometers = true;
        this.elevationUnit = "m";
        this.elevationInMeters = true;
        this.yearTargets = yearTargets;
    }

    protected init(activities: any): void {

        this.processData(activities, this.progressThisYear, this.distanceInKilometers, this.elevationInMeters, this.distanceUnit);

        this.progressThisYear.find("#athleteStatsLoading").remove();

        this.progressThisYear.find("#athleteStatsLoadingForceRefresh").show().click((e: any) => {
            e.preventDefault();
            this.handleProgressStatsForceRefresh();
        });

        this.progressThisYear.find('#stravistix_yearProgress_incVirtualRides').prop('checked', StorageManager.getCookie('stravistix_yearProgress_incVirtualRides') === "true");
        this.progressThisYear.find('#stravistix_yearProgress_incVirtualRides').on('click', () => {
            StorageManager.setCookie('stravistix_yearProgress_incVirtualRides', $('#stravistix_yearProgress_incVirtualRides').prop('checked'), 365);
            this.handleProgressStatsForceRefresh();
        });
    }

    protected formatData(activities: Array<any>): Array<any> {

        let includeVirtualRide: boolean = (StorageManager.getCookie('stravistix_yearProgress_incVirtualRides') === "true");

        let formattedData: Array<any> = [];
        let activity: any;
        let date: Date;

        for (let i: number = 0, max: number = activities.length; i < max; i++) {

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
    }

    protected renderTrendArrow(value: number, formatFunction: Function): string {
        if (value === undefined) {
            return "";
        }
        let formatted = formatFunction ? formatFunction(value) : value;
        return "<span title='" + (value < 0 ? "-" : (value > 0 ? "+" : "")) + formatted + "' style='cursor: help; color:" + (value < 0 ? "red" : (value > 0 ? "green" : "black")) + "'>" + (value < 0 ? "\u25BC" : (value > 0 ? "\u25B2" : "=")) + "</span>";
    }

    protected processData(activities: Array<any>, progressThisYear: any, distanceInKilometers: any, elevationInMeters: any, distanceUnit: any): void {

        let types: Array<Array<any>> = [[], []];
        let years: Array<any> = [];
        let yearsList: Array<any> = [];
        let i: number;
        let j: number;
        let max: number;
        let isCurrentYear: boolean;
        let distanceDifference: number;
        let activitiesCountDifference: number;
        let elevationDifference: number;
        let timeDifference: any;
        let activity: any;
        let currentDate: Date = new Date();
        let currentYear: number = currentDate.getFullYear();
        let currentMonth: number = currentDate.getMonth();
        let currentDay: number = currentDate.getDate();

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

        for (let i: number = 0; i < types.length; i++) {

            years = types[i];
            yearsList = [];

            let $table: JQuery = $("<table class='athletesStatTable' id='athletesStatActivityType" + i + "' style='display: none;'><thead><tr><th>Year</th><th>Distance</th><th>Elevation</th><th>Time</th></tr></thead><tbody></tbody></table>");

            years = years.sort((left: any, right: any) => {
                return right.year - left.year;
            });

            years.forEach((item: any) => {
                if (!distanceInKilometers) {
                    item.distance = item.distance * AthleteStatsModifier.metersTo1000thOfMileFactor;
                }
                if (!elevationInMeters) {
                    item.elevation = item.elevation * AthleteStatsModifier.metersToFeetsFactor;
                }
                yearsList.push(item);
            });

            for (j = 0, max = yearsList.length; j < max; j++) {

                let item: any = yearsList[j];
                item.distance /= 1000;
                if (j < (yearsList.length - 1)) {
                    let previousYearItem: any = yearsList[j + 1];
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
                    "<td><div style='white-space: nowrap;'>" + Helper.formatNumber(item.distance, 0) + " " + distanceUnit + this.renderTrendArrow(distanceDifference, function (value: any) {
                        return Helper.formatNumber(Math.abs(value), 0) + " " + distanceUnit;
                    }) + "</div><div style='white-space: nowrap;'><small>" + Helper.formatNumber(item.count, 0) + " " + (i == 0 ? "Rides" : "Runs") + this.renderTrendArrow(activitiesCountDifference, function (value: any) {
                        return Helper.formatNumber(Math.abs(value), 0) + " " + (i == 0 ? "Rides" : "Runs");
                    }) + "</small></div></td>" +
                    "<td><div style='white-space: nowrap;'>" + Helper.formatNumber(item.elevation, 0) + " " + this.elevationUnit + this.renderTrendArrow(elevationDifference, function (value: any) {
                        return Helper.formatNumber(Math.abs(value), 0) + " " + this.elevationUnit;
                    }) + "</div></td>" +
                    "<td><div style='white-space: nowrap;'>" + Helper.secondsToDHM(item.time) + this.renderTrendArrow(timeDifference, function (value: any) {
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


    public modify(): void {

        let self = this;

        // wait for My Stats load
        if ($("#ytd_year_bike, #ytd_year_run").length === 0) {
            setTimeout(() => {
                this.modify();
            }, 500);
            return;
        }


        let total: number = 0,
            i: number,
            max: number,
            url: string = '/athlete/training_activities?new_activity_only=false&per_page=2000&page=',
            currentActivities: Array<any> = [],
            requests: Array<JQueryXHR> = [],
            activitiesFromCache: string = localStorage.getItem(this.cacheKey_),
            activitiesFromCacheObject: Array<any> = JSON.parse(activitiesFromCache) || [],
            progress: JQuery = $("#progress-goals-v2");

        this.progressThisYear = $("<div class='section'><h3>My year progressions to current month/day <span id='athleteStatsLoading' class='ajax-loading-image'></span></h3><div>This panel displays your progress for each beginning of year to current month and day. Assuming today is May 25, this panel shows \"What I've accomplished by May 25 of this year compared to previous years during the same period.\"<br/><br/><input type='checkbox' id='stravistix_yearProgress_incVirtualRides'/> Include Virtual Rides</div><div><ul class='switches'><li><a class='button btn-xs' data-activity-type='0' style='display: none;'>Cycling</a></li><li><a class='button btn-xs' data-activity-type='1' style='display: none;'>Running</a></li><li class='last-child' id='athleteStatsShowChart' style='display: none;'><a class='button btn-xs' style='max-height: 24px;' title='Chart'><img style='height: 12px;' src='" + self.appResources.trendingUpIcon + "'/></a></li><li>&nbsp;&nbsp;&nbsp;<a href='#' id='athleteStatsLoadingForceRefresh' style='display: none'>Force refresh</a></li></ul></div></div>");


        $(this.progressThisYear).on("click", "a[data-activity-type]", function (e) {
            e.preventDefault();
            let $this = $(this),
                activityType = $this.data("activity-type");
            self.progressThisYear.find(".athletesStatTable").hide();
            self.progressThisYear.find("#athletesStatActivityType" + activityType).show();
            self.progressThisYear.find("a.button").removeClass("selected");
            $this.addClass("selected");
        });


        $(this.progressThisYear).on("click", "#athleteStatsShowChart a", function (e) {
            e.preventDefault();
            let activityType: string = self.progressThisYear.find("a[data-activity-type].selected").data("activity-type");
            let size: Array<number> = [
                window.innerWidth * 0.9,
                window.innerHeight * 0.8
            ];

            let html: string = '<div style="padding-bottom: 10px; text-align: center;"><div style="height:' + size[1] + 'px;width:' + size[0] + 'px; overflow: hidden;">' +
                '<div id="athleteStatChart" style="float: left; width: ' + (size[0] - 200) + 'px;height:' + (size[1] - 100) + 'px;"></div>' +
                '<div style="float:right; width: 180px; text-align: left;" id="athleteStatChartLegend">' +
                '<div>Chart of:</div><ul id="athleteStatChartTypes">' +
                '<li style="margin: 8px"><input id="asrdt0" type="radio" checked name="data-type" value="1" /> <label style="display: inline" for="asrdt0">Distance</label></li>' +
                '<li style="margin: 8px"><input id="asrdt1" type="radio" name="data-type" value="0" /> <label style="display: inline" for="asrdt1">Activity count</label></li>' +
                '<li style="margin: 8px"><input id="asrdt2" type="radio" name="data-type" value="2" /> <label style="display: inline" for="asrdt2">Elevation</label></li>' +
                '<li style="margin: 8px"><input id="asrdt3" type="radio" name="data-type" value="3" /> <label style="display: inline" for="asrdt3">Time</label></li>' +
                '<li style="margin: 8px"><input id="asrdt4" type="radio" name="data-type" value="4" /> <label style="display: inline" for="asrdt4">Distance last year</label></li>' +
                '<li style="margin: 8px"><input id="asrdt5" type="radio" name="data-type" value="5" /> <label style="display: inline" for="asrdt5">Distance last 30d</label></li>' +
                '<li><a style="display: inline" target="_blank" href="' + self.appResources.settingsLink + '#/commonSettings?searchText=distance%20target">Setup ' + (new Date()).getFullYear() + ' targets here</a></li>' +
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
            prepareChart(currentActivities.filter(function (activity: any) {
                return activity.t == activityType;
            }));
        });

        let prepareChart = function (activities: any) {
            let i: any,
                j: any,
                numberOfDays: any = 366,
                max: any,
                activity: any,
                day: any,
                currentTargetType: any, // 0 - time, 1 - distance
                currentDataType: any = 1, // 0 - count, 1 - distance, 2 - elevation, 3 - time, 4 - Distance last year, 5 - Distance last 30d
                data: any = [],
                minValue: any = 0,
                maxValue: any = 0,
                leapYear: any = 2000,
                firstDayDate: any = new Date(leapYear, 0, 1),
                lastDayDate: any = new Date(leapYear, 11, 31, 23, 59, 59),
                currentDate: any = new Date(),
                currentYear: any = currentDate.getFullYear(),
                oneDayInMiliseconds: any = 1000 * 60 * 60 * 24,
                dayOfYear = function (date: Date): number {
                    let now: any = new Date(leapYear, date.getMonth(), date.getDate(), 12);
                    let diff: any = now - firstDayDate;
                    let day: any = Math.floor(diff / oneDayInMiliseconds);
                    return day;
                },
                createArrayOfValues = function (length: any, value?: any) {
                    let result: any = [];
                    while (length--) {
                        result.push(value || 0);
                    }
                    return result;
                },
                currentDayOfYear = dayOfYear(currentDate),
                formatValue = function (value: any) {
                    switch (currentDataType) {
                        case 1:
                        case 4:
                        case 5:
                            if (!self.distanceInKilometers) {
                                value *= AthleteStatsModifier.metersTo1000thOfMileFactor;
                            }
                            return Helper.formatNumber(value / 1000, 0) + " " + self.distanceUnit;

                        case 2:
                            if (!self.elevationInMeters) {
                                value *= AthleteStatsModifier.metersToFeetsFactor;
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
                        // #219 - If currentDataType is Distance last year pro-actively create data
                        // for next year as long as it is not in future
                        if (activity.y + 1 <= currentYear && !data[activity.y + 1]) {
                            data[activity.y + 1] = {
                                year: activity.y + 1,
                                values: createArrayOfValues(numberOfDays)
                            };
                        }
                        let yearlyData: any = data[activity.y];
                        let activityDate: Date = new Date(activity.y, activity.m, activity.d);
                        let activityTime: number = activityDate.getTime();
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
                                        // Get midnight at the end of the day in question
                                        let jDate: number = new Date(activity.y, 0, j + 1).getTime();
                                        if (jDate >= activityTime && jDate <= activityTime + 30 * oneDayInMiliseconds) {
                                            data[activity.y].values[j] += activity.di;
                                        }
                                        if (activity.y < currentYear) {
                                            // Get midnight at the end of the day in question
                                            jDate = new Date(activity.y + 1, 0, j + 1).getTime();
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
                        // #195 - Get the target for current year as per the activity type
                        // Create data for trend line only if target is non-zero
                        // Target is stored against new key value target and year is future year for differentiation
                        // Query target type while at it
                        let yearTarget: number = 0;
                        switch (activities[0].t) {
                            // Cycling
                            case 0:
                                yearTarget = self.yearTargets.Ride;
                                currentTargetType = $("#ride-goals").find("div[data-period=year]").find("button[data-type=distance]").hasClass("active");
                                break;
                            // Running
                            case 1:
                                yearTarget = self.yearTargets.Run;
                                currentTargetType = $("#run-goals").find("div[data-period=year]").find("button[data-type=distance]").hasClass("active");
                                break;
                        }
                        if (yearTarget > 0) {
                            yearTarget = Number(yearTarget);
                            // #195 - Line plotting by data type
                            if (currentTargetType) {
                                // #195 - Target type is distnace
                                // #195 - yearTarget would be absolute number. Convert to meters while setting data.values
                                data[currentYear + 1] = {
                                    year: currentYear + 1,
                                    values: createArrayOfValues(2),
                                    target: yearTarget * 1000
                                };
                                switch (currentDataType) {
                                    // YTD Distance
                                    case 1:
                                        data[currentYear + 1].values[0] = 0;
                                        data[currentYear + 1].values[1] = data[currentYear + 1].target;
                                        if (!self.distanceInKilometers) {
                                            data[currentYear + 1].values[1] /= AthleteStatsModifier.metersTo1000thOfMileFactor;
                                        }
                                        break;
                                    // 30 Day sliding distance
                                    case 5:
                                        let avg30DayDistance: number = data[currentYear + 1].target / numberOfDays * 30;
                                        data[currentYear + 1].values[0] = avg30DayDistance;
                                        data[currentYear + 1].values[1] = avg30DayDistance;
                                        if (!self.distanceInKilometers) {
                                            data[currentYear + 1].values[0] /= AthleteStatsModifier.metersTo1000thOfMileFactor;
                                            data[currentYear + 1].values[1] /= AthleteStatsModifier.metersTo1000thOfMileFactor;
                                        }
                                        break;
                                }
                            } else {
                                data[currentYear + 1] = {
                                    year: currentYear + 1,
                                    values: createArrayOfValues(2),
                                    target: yearTarget * 3600
                                };
                                // #195 - Target type is time
                                if (currentDataType == 3) {
                                    data[currentYear + 1].values[0] = 0;
                                    data[currentYear + 1].values[1] = data[currentYear + 1].target;
                                }
                            }
                        }
                    }

                    data.sort(function (left: any, right: any) {
                        return left.year - right.year;
                    });

                    maxValue = 0;
                    data.forEach(function (item: any) {
                        i = d3.max(item.values);
                        if (i > maxValue) {
                            maxValue = i;
                        }
                    });
                    maxValue *= 1.1;
                };

            processData();

            let container: string = "#athleteStatChart",
                width = $(container).width(),
                height = $(container).height();

            let margin: any = {
                    top: 20,
                    right: 80,
                    bottom: 30,
                    left: 90
                },
                w = width - margin.left - margin.right,
                h = height - margin.top - margin.bottom;

            let y = d3.scale.linear()
                .domain([minValue, maxValue])
                .range([h, 0]);

            let yAxis: Axis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickFormat(function (d: any) {
                    return formatValue(d);
                });

            let x = d3.time.scale()
                .domain([firstDayDate, lastDayDate])
                .range([0, w]);

            let months: Array<string> = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            let xAxis: Axis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(d3.time.months)
                .tickSize(16, 0)
                .tickFormat(d3.time.format("%B"));

            let svg = d3.select("#athleteStatChart").append("svg")
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

            let line = d3.svg.line()
                .y(function (d: any, i: any) {
                    return y(d) + margin.top;
                })
                .x(function (d: any, i: any) {
                    let dateFrom: Date = new Date(firstDayDate.getTime());
                    if (i > 0) {
                        dateFrom.setHours(23, 59, 59);
                    }
                    dateFrom.setDate(dateFrom.getDate() + i);
                    return x(dateFrom) + margin.left;
                }).interpolate("basis");

            // #195 - D3 method for generation of target line
            let targetProjection = d3.svg.line()
                .y(function (d: any, i: any) {
                    return y(d) + margin.top;
                })
                .x(function (d: any, i: any) {
                    let dateFrom: Date = new Date(firstDayDate.getTime());
                    if (i > 0) {
                        dateFrom = lastDayDate;
                    }
                    return x(dateFrom) + margin.left;
                }).interpolate("linear");

            let color: Function = d3.scale.category10(),
                trendLinesGroup = svg.append("svg:g");

            let generateLines = function () {
                let i: number = 0;
                $("#athleteStatChartYears").empty();
                trendLinesGroup.selectAll("path.trend-line").remove();
                data.forEach(function (yearData: any) {
                    let yearIdentifier: string = yearData.year > currentYear ? "Target" : yearData.year;
                    let year: number = yearData.year,
                        id: string = "ascy" + year,
                        liYear: JQuery = $("<li style='margin: 8px'><input id='" + id + "' checked type='checkbox' value='" + year + "'/> <label for='" + id + "' style='display: inline; color: " + color(i.toString()) + ";'>" + yearIdentifier + "</label></li>"),
                        liSpan: JQuery = $("<span style='display: inline-block; margin-left: 10px; width: 80px; text-align: right; color: black;'></span>");

                    liYear.append(liSpan);
                    $("#athleteStatChartYears").prepend(liYear);
                    if (!yearData.target) {
                        yearData.element = trendLinesGroup.append('svg:path')
                            .attr('d', line(yearData.values))
                            .attr('stroke', color(i.toString()))
                            .attr('data-year', year)
                            .attr('class', 'trend-line');
                    } else {
                        // #195 - Dashed Line to show trend for the year based on target if set
                        if (currentTargetType) {
                            // #195 - Target is of distance type
                            if (currentDataType === 1 || currentDataType === 5) {
                                yearData.element = trendLinesGroup.append('svg:path')
                                    .attr('d', targetProjection(yearData.values))
                                    .attr('stroke', color(i.toString()))
                                    .attr('stroke-dasharray', '10, 10')
                                    .attr('data-year', currentYear + 1)
                                    .attr('class', 'trend-line');
                            }
                        } else if (!currentTargetType && currentDataType === 3) {
                            // #195 - Target is of time type
                            yearData.element = trendLinesGroup.append('svg:path')
                                .attr('d', targetProjection(yearData.values))
                                .attr('stroke', color(i.toString()))
                                .attr('stroke-dasharray', '10, 10')
                                .attr('data-year', currentYear + 1)
                                .attr('class', 'trend-line');
                        }
                    }
                    i++;
                    yearData.$value = liSpan;
                    if (typeof yearData.element != "undefined") {
                        yearData.element.classed("current", year == currentYear);
                    }
                });
            };
            generateLines();

            $("#athleteStatChartYears").on("click", "input[type=checkbox]", {}, function () {
                let year: number = $(this).val();
                data.filter(function (item: any) {
                    return item.year == year;
                }).forEach(function (item: any) {
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

            let hoverLine: any,
                hoverLineText: any,
                hoverLineXOffset: any,
                hoverLineYOffset: any,
                hoverLineGroup: any;

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

            let handleMouseOverGraph = function (event: any) {
                let mouseX: number = event.pageX - hoverLineXOffset,
                    mouseY: number = event.pageY - hoverLineYOffset;

                if (mouseX >= 0 && mouseX <= w && mouseY >= 0 && mouseY <= h) {
                    hoverLine.attr("x1", mouseX).attr("x2", mouseX);
                    hoverLineText.attr("x", mouseX + 5);

                    let date: Date = x.invert(mouseX),
                        day: number = dayOfYear(date);

                    data.forEach(function (item: any) {
                        if (day < item.values.length && !item.target) {
                            item.$value.text(formatValue(item.values[day]));
                        } else {
                            item.$value.text("");
                            // #195 - Handle mouse over event for trend line
                            if (item.target) {
                                switch (currentDataType) {
                                    case 1:
                                    case 3:
                                        let showValue: number = (item.values[1] - item.values[0]) / numberOfDays * day;
                                        item.$value.text(formatValue(showValue));
                                        break;
                                    case 5:
                                        item.$value.text(formatValue(item.values[0]));
                                        break;
                                }
                            }
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

        this.progressThisYear.insertBefore(progress);

        total = parseInt($("div.cycling table tbody:last tr:nth(2) td:last").text() || "0");
        total = total + parseInt($("div.running table tbody:last tr:last td:last").text() || "0");

        let measurementPreference: string = window.currentAthlete ? window.currentAthlete.get('measurement_preference') : 'meters';
        if (measurementPreference != 'meters') {
            self.distanceInKilometers = false;
            self.distanceUnit = "mi";
            self.elevationInMeters = false;
            self.elevationUnit = "ft";
        }

        if (total != activitiesFromCacheObject.length) {
            requests.push($.ajax({
                url: url + "1",
                dataType: "json",
                success: (data: any) => {
                    for (i = 2, max = Math.ceil(data.total / data.perPage); i <= max; i++) {
                        requests.push($.ajax({
                            url: url + i,
                            dataType: "json",
                        }));
                    }
                    $.when.apply(self, requests).done(() => {

                        _.each(requests, function (request: any) {
                            if (request.responseJSON.models) {
                                currentActivities = currentActivities.concat(request.responseJSON.models);
                            }
                        })

                        currentActivities = this.formatData(currentActivities);
                        self.init(currentActivities);
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
            self.init(activitiesFromCacheObject);
        }
    }


    handleProgressStatsForceRefresh(): void {
        localStorage.removeItem(this.cacheKey_);
        window.location.reload();
    }
}

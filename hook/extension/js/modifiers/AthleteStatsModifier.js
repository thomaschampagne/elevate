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
            activities = [],
            requests = [],
            activitiesFromCache = localStorage.getItem(this.cacheKey_),
            activitiesFromCacheObject = JSON.parse(activitiesFromCache) || [],
            progress = $("#progress-goals"),
            progressThisYear = $("<div class='section'><h3>My year progressions to current month/day <span id='athleteStatsLoading' class='ajax-loading-image'></span></h3><div>This panel allows you to see your progress for each beginning of year to current month and day. Assuming May 25 is today, this panel replies to \"What i've accomplished on May 25 of this year compared to the previous years on same period?\"<br/><br/></div><div><ul class='switches'><li><a class='button btn-xs' data-activity-type='0' style='display: none;'>Cycling</a></li><li class='last-child'><a class='button btn-xs' data-activity-type='1' style='display: none;'>Running</a></li><li>&nbsp;&nbsp;&nbsp;<a href='#' id='athleteStatsLoadingForceRefresh' style='display: none'>Force refresh</a></li></ul></div></div>");

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
                type = $this.data("activity-type");
            progressThisYear.find(".athletesStatTable").hide();
            progressThisYear.find("#athletesStatActivityType" + type).show();
            progressThisYear.find("a.button").removeClass("selected");
            $this.addClass("selected");
        });

        progressThisYear.insertAfter(progress);

        total = parseInt($("div.cycling table tbody:last tr:nth(2) td:last").text() || "0");
        total = total + parseInt($("div.running table tbody:last tr:last td:last").text() || "0");
        
        var measurementPreference = currentAthlete ? currentAthlete.get('measurement_preference') : 'meters';
        if (measurementPreference != 'meters') {
            this.distanceInKilometers = false;
            this.distanceUnit = "mi";
            this.elevationInMeters = false;
            this.elevationUnit = "ft";
        }

        if (total != activitiesFromCacheObject.length) {
            for (i = 1, max = Math.ceil(total / 20); i <= max; i++) {
                requests.push($.ajax(url + i));
            }
            $.when.apply(self, requests).done(function() {
                for (i in requests) {
                    var request = requests[i];
                    if (request.responseJSON.models) {
                        activities = activities.concat(request.responseJSON.models);
                    }
                }
                activities = formatData(activities);
                init(activities);
                localStorage.setItem(self.cacheKey_, JSON.stringify(activities));
            });
        } else {
            init(activitiesFromCacheObject);
        }
    },

    handleProgressStatsForceRefresh_: function handleProgressStatsForceRefresh_() {
        localStorage.removeItem(this.cacheKey_);
        window.location.reload();
    }
};

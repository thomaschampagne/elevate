/**
 *   AthleteStatsModifier is responsible of ...
 */
function AthleteStatsModifier() {
}

/**
 * Define prototype
 */
AthleteStatsModifier.prototype = {
    
    modify: function modify() {
        
        var progress = $("#progress-goals");
        
        var progressThisYear = $("<div class='section'><h3 class='bottomless'>My progress this year <span id='athleteStatsLoading'>(calculating...)</span></h3></div>");
        
        progressThisYear.insertAfter(progress);
        
        var count = 0, 
            total = 0, 
            page = 1, 
            url = '/athlete/training_activities?new_activity_only=false&activity_type=Ride&order=&page=',
            activities = [],
            currentDate = new Date(),
            currentYear = currentDate.getFullYear(),
            currentMonth = currentDate.getMonth(),
            currentDay = currentDate.getDate(),
            previousYear = currentYear - 1;
        
        var process = function() {
            $.ajax(url + page).done(function(json) {
                activities = activities.concat(json.models);
                page = json.page + 1;
                total += json.models.length;
                /*
                if (json.models.length > 0) {
                    var date = new Date(json.models[json.models.length - 1].start_time);
                    if (date.getFullYear() < previousYear) {
                        total = json.total;
                    }
                }
                */
                
                if (total < json.total) {
                    process();
                } else {
                    
                    
                    var currentYearKms = 0;
                    var previousYearKms = 0;
                    
                    var years = [];
                    
                    for (var i = 0, max = activities.length; i < max; i++) {
                        var activity = activities[i];
                        var activityDate = new Date(activity.start_time);
                        var year = activityDate.getFullYear();
                        var month = activityDate.getMonth();
                        var day = activityDate.getDate();
                        if (!years[year]) {
                            years[year] = {
                                year: year,
                                distance: 0,
                                elevation: 0,
                                time: 0
                            };
                        }                        
                        if ((month < currentMonth) || (month == currentMonth && day <= currentDay)) {
                            years[year].distance += activity.distance_raw;
                            years[year].elevation += activity.elevation_gain_raw;
                            years[year].time += activity.moving_time_raw;
                        }
                    }
                    
                    if (years.length === 0) {
                        progressThisYear.remove();
                        return;
                    }
                    
                    var $table = $("<table><thead><tr><th>Year</th><th>Distance</th><th>Elevation gain</th><th>Moving time</th></tr></thead><tbody></tbody></table>");
                    
                    years.sort(function(left, right) {
                        return left.year < right.year;
                    }).forEach(function(item) {
                        item.distance /= 1000;
                        
                        $table.find("tbody").append($(
                            "<tr class='" + (item.year === currentYear ? 'currentyear' : '') + "'>" +
                            "<td>" + item.year + "</td>" +
                            "<td>" + Helper.formatNumber(item.distance, 0) + " km</td>" +
                            "<td>" + Helper.formatNumber(item.elevation, 0) + " m</td>" + 
                            "<td>" + Helper.secondsToDHM(item.time) + "</td></tr>"
                        ));
                    });
                    
                    progressThisYear.append($table);
                    progressThisYear.find("#athleteStatsLoading").remove();
                }
            });
        };
        
        process();
    },
};

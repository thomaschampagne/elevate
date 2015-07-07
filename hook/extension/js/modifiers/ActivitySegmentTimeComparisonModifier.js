/**
 *   ActivitySegmentTimeComparisonModifier is responsible of ...
 */
function ActivitySegmentTimeComparisonModifier() {
}

/**
 * Define prototype
 */
ActivitySegmentTimeComparisonModifier.prototype = {

    modify: function modify() {
        
        // wait for Segments section load
        if ($("#segments").length === 0) {
            setTimeout(function() {
                modify();
            }, 500);
            return;
        }

        $("tr[data-segment-effort-id]").each(function() {            
            var $row = $(this),
                $timeCell = $row.find("td.time-col"),
                segmentEffortId = $row.data("segment-effort-id"),
                url = "/segment_efforts/" + segmentEffortId;
            
            $.getJSON(url, function(data) {
                if (!data) {
                    return;
                }
                                
                var komSeconds = Helper.HHMMSStoSeconds(data.kom_time),
                    seconds = data.elapsed_time_raw,
                    difference = (seconds - komSeconds);
                $timeCell.append("&nbsp;(<span title='Compare to the current KOM's time (" + Helper.secondsToHHMMSS(Math.abs(komSeconds), true) + ")' style='color:" + (difference > 0 ? "red" : "green") + ";'>" + Helper.secondsToHHMMSS(Math.abs(difference), true) + "</span><span></span>)");
                
                $.getJSON("/segments/" + data.segment_id + "/leaderboard?raw=true&page=1&per_page=1000000&viewer_context=false&filter=my_results", function(data) {
                    data.top_results.sort(function(left, right) {
                        return left.start_date_local_raw - right.start_date_local_raw;
                    });
                    
                    var currentSegmentEfforDateTime,
                        previousPersonalSeconds,
                        previousPersonalDate,
                        previousPersonalTime,
                        i,
                        max;
                    
                    for (i = 0, max = data.top_results.length; i < max; i++) {
                        data.top_results[i].__dateTime = new Date(data.top_results[i].start_date_local_raw);
                        if (data.top_results[i].id == segmentEffortId) {
                            currentSegmentEfforDateTime = data.top_results[i].__dateTime;
                        }
                    }
                    
                    if (segmentEffortId == 7975330999) debugger;
                    
                    if (!currentSegmentEfforDateTime) {
                        return;
                    }
                    
                    data.top_results.sort(function(left, right) {
                        return left.rank - right.rank;
                    });
                    
                    for (i = 0, max = data.top_results.length; i < max; i++) {
                        if (data.top_results[i].__dateTime < currentSegmentEfforDateTime) {
                            previousPersonalSeconds = data.top_results[i].elapsed_time_raw;
                            previousPersonalDate = data.top_results[i].start_date_local;
                            previousPersonalTime = data.top_results[i].elapsed_time;
                            break;
                        }
                    }
                    
                    if (!previousPersonalSeconds) {
                        return;
                    }
                    
                    difference = (seconds - previousPersonalSeconds);
                    $timeCell.find("span:last").append("&nbsp;|&nbsp;<span title='Compare to your previous best time (" + previousPersonalTime + " on " + previousPersonalDate + ")' style='color:" + (difference > 0 ? "red" : "green") + ";'>" + Helper.secondsToHHMMSS(Math.abs(difference), true) + "</span>");
                });
            });
        });

    },
};

/**
 *   ActivityBestSplitsModifier is responsible of ...
 */
function ActivityBestSplitsModifier(userSettings, activityJson, hasPowerMeter) {
    this.userSettings = userSettings;
    this.activityJson = activityJson;
    this.hasPowerMeter = hasPowerMeter;
}

ActivityBestSplitsModifier.Units = {
    Minutes: 0,
    Kilometers: 1,
    
    getLabel: function(unit) {
        switch (unit) {
            case ActivityBestSplitsModifier.Units.Kilometers:
                return "km";
                
            case ActivityBestSplitsModifier.Units.Minutes:
                return "min";
            
            default:
                return "";
        }
    }
};

/**
 * Define prototype
 */
ActivityBestSplitsModifier.prototype = {

    modify: function modify() {

        // wait for Segments section load
        if ($("#segments").length === 0) {
            setTimeout(function() {
                modify();
            }, 500);
            return;
        }

        var self = this,
            segments = $("#segments"),
            bestSplitsHeader = $("<h3 class=\"inset segments-header bestsplits-header-title\" style='cursor: pointer'>Best Splits</h3>"),
            segmentsHeader = segments.find("h3.segments-header")
                                .css("font-weight", "bold")
                                .css("text-decoration", "underline")
                                .css("cursor", "pointer")
                                .addClass("segments-header-title")
                                .before(bestSplitsHeader),
            bestSplitsSection = $("<section id='bestsplits' class='pinnable-anchor' style='display: none;'></section>"),
            map,
            splitPolyline,
            splitAltitude,
            splitColor = "blue";
                
        if (pageView) {
            if (pageView.contexts) {
                if (pageView.contexts.contexts) {
                    if (pageView.contexts.contexts.map["converted-elapsed-time"]) {
                        if (pageView.contexts.contexts.map["converted-elapsed-time"]._activityPolyline) {
                            if (pageView.contexts.contexts.map["converted-elapsed-time"]._activityPolyline._map) {
                                map = pageView.contexts.contexts.map["converted-elapsed-time"]._activityPolyline._map.instance;
                            }
                        }
                    }
                }
            }
        }
        
        if (segments.find("[data-segment-effort-id]").length) {
            bestSplitsSection.appendTo($("#segments section.segments-list"));
        } else {
            var container = segments.find(".no-segments");
            container.find(".icon-segment-marker-white").remove();
            container.append("<h3 class=\"inset segments-header\">Best Splits</h3>");
            container.append(bestSplitsSection);
            bestSplitsSection.show();
        }

        $(".bestsplits-header-title").click(function() {
            $(".bestsplits-header-title").css("font-weight", "bold").css("text-decoration", "underline");
            $(".segments-header-title").css("font-weight", "normal").css("text-decoration", "none");
            segments.find("table.segments").hide();
            bestSplitsSection.show();
        });
        
        $(".segments-header-title").click(function() {
            $(".segments-header-title").css("font-weight", "bold").css("text-decoration", "underline");
            $(".bestsplits-header-title").css("font-weight", "normal").css("text-decoration", "none");            
            bestSplitsSection.hide();
            segments.find("table.segments").show();
            if (map && splitPolyline) {
                map.removeLayer(splitPolyline);
                splitPolyline = null;
            }
            if (splitAltitude) {
                splitAltitude.attr("style", "fill: " + splitColor + "; opacity: 0");
            }
            $("[data-activity-points].selected").removeClass("selected").css({ "background-color": "", "color": "black" });
        });
                
        $(document).on("click", "[data-activity-points]", {}, function() {
            if (map) {
                $("[data-activity-points].selected").removeClass("selected").css({ "background-color": "", "color": "black" });
                $(this).addClass("selected").css({ "background-color": splitColor, "color": "white" });
                
                if (splitPolyline) {
                    map.removeLayer(splitPolyline);
                    splitPolyline = null;
                }                
                var range = $(this).attr("data-activity-points").split("-"),
                    start = parseInt(range[0]),
                    stop = parseInt(range[1]),
                    length = stop - start + 1;
                splitPolyline = L.polyline([], { color: splitColor });
                for (var i = start; i <= stop; i++) {
                    splitPolyline.addLatLng(L.latLng(self.activityJson.latlng[i][0], self.activityJson.latlng[i][1]));
                }
                splitPolyline.addTo(map);
                var chartRect = $("#grid rect:not([data-split])");
                if (chartRect.length === 0) {
                    return;
                }
                var width = parseInt(chartRect.attr("width")),
                    height = parseInt(chartRect.attr("height"));
                var xScale = d3.scale.linear().domain([0, self.activityJson.distance[self.activityJson.distance.length - 1]]).range([0, width]);
                if (!splitAltitude) {
                    splitAltitude = d3.select("#grid").insert("rect", "rect").attr("y", "0").attr("style", "fill: " + splitColor + "; opacity: 0").attr("data-split", "true");
                }
                
                splitAltitude.attr("x", xScale(self.activityJson.distance[start]));
                splitAltitude.attr("height", height);
                splitAltitude.attr("width", xScale(self.activityJson.distance[stop] - self.activityJson.distance[start]));
                splitAltitude.attr("style", "fill: " + splitColor + "; opacity: 0.3");
            }
        });
        
        var splitsTable = $("<table class='dense marginless best-splits' style='text-align: center'>" +
                            "<thead>" +
                            "<tr>" +
                            "<th style='text-align: center'>Split</th>" +
                            "<th style='text-align: center'>Time/Distance</th>" +
                            "<th style='text-align: center'>Avg Speed</th>" +
                            "<th style='text-align: center'>Avg HR</th>" +
                            "<th style='text-align: center'>Avg Power</th>" +
                            "<th style='text-align: center'>Avg Cadence</th>" +
                            "<th style='text-align: center'></th>" +
                            "</tr>" +
                            "</thead>" + 
                            "<tbody>" +
                            "<tfoot>" +
                            "<tr>" +
                            "<td colspan='7' style='text-align: center'><em>Data accuracy depends on GPS logging interval used to record this activity. Move cursor over values to see exact distance/time at which the value was computed. Click on any value to see the split on map and altitude chart.</em></th>" +
                            "</tr>" +
                            "</tfoot>" +
                            "</tbody");
        bestSplitsSection.append(splitsTable);
        var splitsTableBody = splitsTable.find("tbody");
        
        // todo: move it to user settings and allow to add new splits
        var splitsConfiguration = [
            { length: 1, unit: ActivityBestSplitsModifier.Units.Kilometers },
            { length: 10, unit: ActivityBestSplitsModifier.Units.Kilometers },
            { length: 30, unit: ActivityBestSplitsModifier.Units.Kilometers },
            { length: 50, unit: ActivityBestSplitsModifier.Units.Kilometers },
            { length: 1, unit: ActivityBestSplitsModifier.Units.Minutes },
            { length: 10, unit: ActivityBestSplitsModifier.Units.Minutes },
            { length: 20, unit: ActivityBestSplitsModifier.Units.Minutes },
            { length: 60, unit: ActivityBestSplitsModifier.Units.Minutes }
        ];
        
        var i,
            j,
            max,
            activityDistanceInMeters = this.activityJson.distance[this.activityJson.distance.length - 1],
            activityDurationInSeconds = this.activityJson.time[this.activityJson.time.length - 1];        
        
        i = 0;
        splitsConfiguration.forEach(function(split) {
            if (split.unit === ActivityBestSplitsModifier.Units.Kilometers && (split.length * 1000) > activityDistanceInMeters) {
                return;
            }
            if (split.unit === ActivityBestSplitsModifier.Units.Minutes && (split.length * 60) > activityDurationInSeconds) {
                return;
            }
            split.id = i;            
            splitsTableBody.append("<tr id='split-" + i + "'>" + 
                                   "<td>" + split.length + " " + ActivityBestSplitsModifier.Units.getLabel(split.unit) + "</td>" +
                                   "<td class='value'><div id='split-" + i + "-time'></div><div id='split-" + i + "-distance'></div></td>" +
                                   "<td class='value'><div id='split-" + i + "-avg-speed'></div></td>" +
                                   "<td class='value'><div id='split-" + i + "-avg-hr'></div></td>" +
                                   "<td class='value'><div id='split-" + i + "-avg-power'></div></td>" +
                                   "<td class='value'><div id='split-" + i + "-avg-cadence'></div></td>" +
                                   "<td><div id='split-" + i + "-remove'></div></td>" +
                                   "</tr>");
            i++;
        });
    
        var newSplitValue = function(value) {
            return {
                value: value || 0,
                begin: 0,
                end: -1,
                samples: function() {
                    return this.end - this.begin + 1;
                }
            };
        };
        
        var computeSplit = function(split, activityJson) {
            var i,
                j, 
                max,
                total,
                distance,
                hr,
                totalHr,
                totalCadence,
                avgCadence,
                totalPower,
                avgPower,
                avgSpeed,
                time,
                begin,
                end,                
                values = {
                    time: newSplitValue(999999999),
                    distance: newSplitValue(),
                    avgSpeed: newSplitValue(),
                    avgHr: newSplitValue(),
                    avgPower: newSplitValue(),
                    avgCadence: newSplitValue()
                },
                totalOfValues = function(start, end, array) {
                    var result = 0;
                    for (; array && start <= end; start++) {
                        result += array[start];
                    }
                    return result;
                },
                coutOfNonZero = function(start, end, array) {
                    var result = 0;
                    for (; array && start <= end; start++) {
                        if (array[start]) {
                            result += 1;
                        }
                    }
                    return result;
                },
                checkValues = function(timeOrDistance) {
                    totalHr = totalOfValues(begin, end, activityJson.heartrate);
                    hr = totalHr / (end - begin + 1);
                    if (hr > values.avgHr.value) {
                        values.avgHr.value = hr;
                        values.avgHr.begin = begin;
                        values.avgHr.end = end;
                        values.avgHr.timeOrDistance = timeOrDistance;
                    }
                    
                    totalCadence = totalOfValues(begin, end, activityJson.cadence);
                    avgCadence = totalCadence / coutOfNonZero(begin, end, activityJson.cadence);
                    if (avgCadence > values.avgCadence.value) {
                        values.avgCadence.value = avgCadence;
                        values.avgCadence.begin = begin;
                        values.avgCadence.end = end;
                        values.avgCadence.timeOrDistance = timeOrDistance;
                    }
                    
                    totalPower = totalOfValues(begin, end, activityJson.watts);
                    avgPower = totalPower / coutOfNonZero(begin, end, activityJson.watts);
                    if (avgPower > values.avgPower.value) {
                        values.avgPower.value = avgPower;
                        values.avgPower.begin = begin;
                        values.avgPower.end = end;
                        values.avgPower.timeOrDistance = timeOrDistance;
                    }
                    
                    avgSpeed = (distance / 1000) / (time / 60 / 60);
                    if (avgSpeed > values.avgSpeed.value) {
                        values.avgSpeed.value = avgSpeed;
                        values.avgSpeed.begin = begin;
                        values.avgSpeed.end = end;
                        values.avgSpeed.timeOrDistance = timeOrDistance;
                    }
                    
                }.bind(this);
            
            if (split.unit === ActivityBestSplitsModifier.Units.Minutes) {
                var splitInSeconds = split.length * 60,
                    timeBefore;
                for (i = 0, max = this.activityJson.time.length; i < max; i++) {
                    time = this.activityJson.time[i];
                    timeBefore = 0;
                    if (i > 0) {
                        timeBefore = this.activityJson.time[i - 1];
                        time -= timeBefore;                        
                    }
                    begin = i;
                    end = i;
                    j = i + 1;
                    while (splitInSeconds > time && j < max) {
                        end = j;
                        time = this.activityJson.time[end] - timeBefore;
                        j++;
                    }
                    if (time < splitInSeconds) {
                        break;
                    }
                    
                    distance = activityJson.distance[end] - activityJson.distance[begin];
                    if (distance > values.distance.value) {
                        values.distance.value = distance;
                        values.distance.begin = begin;
                        values.distance.end = end;
                        values.distance.timeOrDistance = time;
                    }
                    
                    checkValues(time);
                }
            }
            
            if (split.unit === ActivityBestSplitsModifier.Units.Kilometers) {
                var distanceInMeters = split.length * 1000,
                    distanceBefore;
                for (i = 0, max = this.activityJson.distance.length; i < max; i++) {
                    distance = this.activityJson.distance[i];
                    distanceBefore = 0;
                    if (i > 0) {
                        distanceBefore = this.activityJson.distance[i - 1];
                        distance -= distanceBefore;
                    }
                    begin = i;
                    end = i;
                    j = i + 1;
                    while (distanceInMeters > distance && j < max) {
                        end = j;
                        distance = this.activityJson.distance[end] - distanceBefore;
                        j++;
                    }
                    if (distance < distanceInMeters) {
                        break;
                    }
                    
                    time = activityJson.time[end] - activityJson.time[begin];
                    if (time < values.time.value) {
                        values.time.value = time;
                        values.time.begin = begin;
                        values.time.end = end;
                        values.time.timeOrDistance = distance;
                    }
                    
                    checkValues(distance);
                }
            }
            
            return values;
        }.bind(this);
        
        splitsConfiguration.forEach(function(split) {
            var splitId = "#split-" + split.id,
                splitRow = splitsTableBody.find(splitId),
                setValue = function(elementId, value, formatFunction, defValue, tooltipFormatFunction) {
                    var element = $(elementId);
                    element.html("");
                    if (value.samples()) {
                        var text = formatFunction ? formatFunction(value.value) : value.value;
                        element.text(text);
                        element.attr("data-activity-points", value.begin + "-" + value.end);
                        element.css({ "cursor": "pointer" });
                        if (value.timeOrDistance && tooltipFormatFunction) {
                            element.attr("title", tooltipFormatFunction(value.timeOrDistance));
                        }
                    } else {
                        if (defValue) {
                            element.text(defValue);
                        }
                    }
                };
            splitRow.find("td.value").append("<span class='ajax-loading-image'></span>");
            
            var value = computeSplit(split, self.activityJson),
                formatDistance = function(value) {
                    return Helper.formatNumber(value / 1000) + "km";
                },
                formatTime = function(value) {
                    return Helper.secondsToHHMMSS(value, true);
                },
                formatTooltip = split.unit === ActivityBestSplitsModifier.Units.Kilometers ? formatDistance : formatTime;
            
            setValue(splitId + "-time", value.time, formatTime, "", formatDistance);
            setValue(splitId + "-distance", value.distance, formatDistance, "", formatTime);
            setValue(splitId + "-avg-speed", value.avgSpeed, function(value) { return Helper.formatNumber(value) + "km/h"; }, "n/a", formatTooltip);
            setValue(splitId + "-avg-hr", value.avgHr, function(value) { return Helper.formatNumber(value, 0) + "bpm"; }, "n/a", formatTooltip);
            setValue(splitId + "-avg-power", value.avgPower, function(value) { return Helper.formatNumber(value, 0) + "W"; }, "n/a", formatTooltip);
            setValue(splitId + "-avg-cadence", value.avgCadence, function(value) { return Helper.formatNumber(value, 0); }, "n/a", formatTooltip);
            splitRow.find("td.value span.ajax-loading-image").remove();
        });
        
        // when a user clicks 'Analysis' #segments element is removed so we have to wait for it and re-run the modify function
        var waitForSegmentsSectionRemoved = function() {
            if ($("#segments").length !== 0) {
                setTimeout(function() {
                    waitForSegmentsSectionRemoved();
                }, 1000);
                return;
            }
            modify();
        };
        waitForSegmentsSectionRemoved();
    },
};

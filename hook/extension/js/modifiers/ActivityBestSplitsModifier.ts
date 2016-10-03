declare let L: any;

function BestSplitWorker() {

    class BestSplitComputer {

        protected newSplitValue(value?: any): any {
            return {
                value: value || 0,
                begin: 0,
                end: -1,
                samples: 0,
                timeOrDistance: 0
            };
        }

        protected newDropRiseValue(): any {
            return {
                value: {
                    value: 0,
                    beginValue: 0,
                    endValue: 0
                },
                begin: 0,
                end: -1,
                samples: 0,
                timeOrDistance: 0
            };
        }

        protected countSamples(value: any): void {
            value.samples = value.end - value.begin + 1;
        }

        protected averageOfValues(activityJson: any, start: number, end: number, array: Array<number>): number {
            let sumValues: number = 0;
            let sumTime: number = 0;
            let deltaTime: number;
            start++;
            for (; array && start <= end; start++) {
                deltaTime = activityJson.time[start] - activityJson.time[start - 1];
                sumValues += array[start] * deltaTime - ((array[start] - array[start - 1]) * deltaTime) / 2;
                sumTime += deltaTime;
            }
            if (sumTime === 0) {
                return 0;
            }
            return sumValues / sumTime;
        }

        protected totalGainOfValues(start: number, end: number, array: Array<number>): number {
            if (!array) {
                return 0;
            }
            let result: number = 0;
            let previous: number = array[start++];
            for (; start <= end; start++) {
                let value: number = array[start];
                if (previous < value) {
                    result += (value - previous);
                }
                previous = value;
            }
            return result;
        }

        protected totalDropOfValues(start: number, end: number, array: Array<number>): number {
            if (!array) {
                return 0;
            }
            let result: number = 0;
            let previous: number = array[start++];
            for (; start <= end; start++) {
                let value: number = array[start];
                if (previous > value) {
                    result += (previous - value);
                }
                previous = value;
            }
            return result;
        }


        protected dropOfValues(start: number, end: number, array: Array<number>): any {
            let dropHr: any = this.newSplitValue();
            let maxDrop: number = 0;
            let maxBegin: number = 0;
            let maxEnd: number = 0;
            let maxValueBegin: number = 0;
            let maxValueEnd: number = 0;
            if (array) {
                let previous: number = array[start++];
                let currentMax: number = previous;
                let begin = start;
                for (; start <= end; start++) {
                    if (array[start] > previous) {
                        if (maxValueEnd === 0 || array[start] - maxValueEnd > 5) {
                            currentMax = array[start];
                            begin = start;
                        }
                    } else if (currentMax - array[start] > maxDrop) {
                        maxDrop = currentMax - array[start];
                        maxBegin = begin;
                        maxEnd = start;
                        maxValueBegin = currentMax;
                        maxValueEnd = array[start];
                    }
                    previous = array[start];
                }
            }
            dropHr.value = {
                value: maxDrop,
                beginValue: maxValueBegin,
                endValue: maxValueEnd
            };
            dropHr.begin = maxBegin;
            dropHr.end = maxEnd;
            return dropHr;
        }

        protected riseOfValues(start: number, end: number, array: Array<number>): any {
            let riseHr: any = this.newSplitValue();
            let maxRise: number = 0;
            let maxBegin: number = 0;
            let maxEnd: number = 0;
            let maxValueBegin: number = 0;
            let maxValueEnd: number = 0;
            if (array) {
                let previous: number = array[start++];
                let currentMin: number = previous;
                let begin: number = start;
                for (; start <= end; start++) {
                    if (array[start] < previous) {
                        if (maxValueEnd === 0 || maxValueEnd - array[start] > 5) {
                            // restart
                            currentMin = array[start];
                            begin = start;
                        }
                    } else if (array[start] - currentMin > maxRise) {
                        maxRise = array[start] - currentMin;
                        maxBegin = begin;
                        maxEnd = start;
                        maxValueBegin = currentMin;
                        maxValueEnd = array[start];
                    }
                    previous = array[start];
                }
            }
            riseHr.value = {
                value: maxRise,
                beginValue: maxValueBegin,
                endValue: maxValueEnd
            };
            riseHr.begin = maxBegin;
            riseHr.end = maxEnd;
            return riseHr;
        }

        protected coutOfNonZero(start: number, end: number, array: Array<number>): number {
            let result: number = 0;
            for (; array && start <= end; start++) {
                if (array[start]) {
                    result += 1;
                }
            }
            return result;
        }


        compute(split: any, activityJson: any, options: any): any {

            let max: number,
                distance: number,
                hr: number,
                avgCadence: number,
                avgPower: number,
                avgSpeed: number,
                time: number,
                begin: number,
                end: number,

                values = {
                    time: this.newSplitValue(999999999),
                    distance: this.newSplitValue(),
                    avgSpeed: this.newSplitValue(),
                    avgHr: this.newSplitValue(),
                    dropHr: this.newDropRiseValue(),
                    riseHr: this.newDropRiseValue(),
                    avgPower: this.newSplitValue(),
                    avgCadence: this.newSplitValue(),
                    elevationGain: this.newSplitValue(),
                    elevationDrop: this.newSplitValue(),
                    timeOrDistance: 0
                },

                checkValues = (timeOrDistance: number, ratio: number) => {
                    hr = this.averageOfValues(activityJson, begin, end, activityJson.heartrate);
                    if (hr > values.avgHr.value) {
                        values.avgHr.value = hr;
                        values.avgHr.begin = begin;
                        values.avgHr.end = end;
                        values.avgHr.timeOrDistance = timeOrDistance;
                    }
                    let dropHr: any = this.dropOfValues(begin, end, activityJson.heartrate);
                    dropHr.value.value = dropHr.value.value * ratio;
                    if (dropHr.value.value > values.dropHr.value.value) {
                        values.dropHr = dropHr;
                    }

                    let riseHr: any = this.riseOfValues(begin, end, activityJson.heartrate);
                    riseHr.value.value = riseHr.value.value * ratio;
                    if (riseHr.value.value > values.riseHr.value.value) {
                        values.riseHr = riseHr;
                    }

                    avgCadence = this.averageOfValues(activityJson, begin, end, activityJson.cadence);
                    if (avgCadence > values.avgCadence.value) {
                        values.avgCadence.value = avgCadence;
                        values.avgCadence.begin = begin;
                        values.avgCadence.end = end;
                        values.avgCadence.timeOrDistance = timeOrDistance;
                    }

                    avgPower = this.averageOfValues(activityJson, begin, end, activityJson.watts);
                    if (avgPower > values.avgPower.value) {
                        values.avgPower.value = avgPower;
                        values.avgPower.begin = begin;
                        values.avgPower.end = end;
                        values.avgPower.timeOrDistance = timeOrDistance;
                    }

                    let elevationGain: number = this.totalGainOfValues(begin, end, activityJson.filteredAltitude) * ratio;
                    let elevationDrop: number = this.totalDropOfValues(begin, end, activityJson.filteredAltitude) * ratio;
                    if (elevationGain > values.elevationGain.value) {
                        values.elevationGain.value = elevationGain;
                        values.elevationGain.begin = begin;
                        values.elevationGain.end = end;
                        values.elevationGain.timeOrDistance = timeOrDistance;
                    }
                    if (elevationDrop > values.elevationDrop.value) {
                        values.elevationDrop.value = elevationDrop;
                        values.elevationDrop.begin = begin;
                        values.elevationDrop.end = end;
                        values.elevationDrop.timeOrDistance = timeOrDistance;
                    }

                    avgSpeed = (distance / 1000) / (time / 60 / 60);
                    if (avgSpeed > values.avgSpeed.value) {
                        values.avgSpeed.value = avgSpeed;
                        values.avgSpeed.begin = begin;
                        values.avgSpeed.end = end;
                        values.avgSpeed.timeOrDistance = timeOrDistance;
                    }

                };

            if (split.unit === options.Minutes || split.unit === options.Seconds) {

                let splitInSeconds: number;

                if (split.unit === options.Minutes) {
                    splitInSeconds = split.length * 60;
                } else {

                    splitInSeconds = split.length;
                }

                for (let i: number = 0, max = activityJson.time.length; i < max; i++) {
                    time = 0;
                    begin = i;
                    end = i + 1;
                    while (splitInSeconds > time && end < max) {
                        time = activityJson.time[end] - activityJson.time[begin];
                        end++;
                    }
                    end--;
                    if (time < splitInSeconds) {
                        break;
                    }

                    distance = (activityJson.distance[end] - activityJson.distance[begin]);
                    let ratio: number = splitInSeconds / time;
                    if (distance * ratio > values.distance.value) {
                        values.distance.value = distance * ratio;
                        values.distance.begin = begin;
                        values.distance.end = end;
                        values.distance.timeOrDistance = time;
                    }

                    checkValues(time, ratio);
                }

                time = activityJson.time[values.riseHr.end] - activityJson.time[values.riseHr.begin];
                values.riseHr.timeOrDistance = time;
                time = activityJson.time[values.dropHr.end] - activityJson.time[values.dropHr.begin];
                values.dropHr.timeOrDistance = time;

                if (options.distanceUnit === options.Miles) {
                    values.distance.value *= options.MetersTo0001hMileFactor;
                    values.avgSpeed.value *= options.KilometersToMilesFactor;
                }
            }

            if (split.unit === options.Kilometers || split.unit === options.Miles) {
                let distanceInMeters: number = split.length * (split.unit === options.Miles ? options.MilesToMetersFactor : options.KilometersToMetersFactor),
                    distanceInUserUnits: number;
                for (let i: number = 0, max = activityJson.distance.length; i < max; i++) {
                    distance = 0;
                    begin = i;
                    end = i + 1;
                    while (distanceInMeters > distance && end < max) {
                        distance = activityJson.distance[end] - activityJson.distance[begin];
                        end++;
                    }
                    end--;
                    if (distance < distanceInMeters) {
                        break;
                    }
                    let ratio: number = distanceInMeters / distance;
                    distanceInUserUnits = distance * (options.distanceUnit === options.Miles ? options.MetersTo0001hMileFactor : 1);

                    time = activityJson.time[end] - activityJson.time[begin];
                    if (time * ratio < values.time.value) {
                        values.time.value = time * ratio;
                        values.time.begin = begin;
                        values.time.end = end;
                        values.time.timeOrDistance = distanceInUserUnits;
                    }

                    checkValues(distanceInUserUnits, ratio);
                }

                distance = activityJson.distance[values.riseHr.end] - activityJson.distance[values.riseHr.begin];
                distanceInUserUnits = distance * (options.distanceUnit === options.Miles ? options.MetersTo0001hMileFactor : 1);
                values.riseHr.timeOrDistance = distanceInUserUnits;
                distance = activityJson.distance[values.dropHr.end] - activityJson.distance[values.dropHr.begin];
                distanceInUserUnits = distance * (options.distanceUnit === options.Miles ? options.MetersTo0001hMileFactor : 1);
                values.dropHr.timeOrDistance = distanceInUserUnits;

                if (options.distanceUnit === options.Miles) {
                    values.distance.value *= options.MetersTo0001hMileFactor;
                    values.avgSpeed.value *= options.KilometersToMilesFactor;
                }
            }

            this.countSamples(values.avgCadence);
            this.countSamples(values.avgHr);
            this.countSamples(values.dropHr);
            this.countSamples(values.riseHr);
            this.countSamples(values.avgPower);
            this.countSamples(values.elevationGain);
            this.countSamples(values.elevationDrop);
            this.countSamples(values.avgSpeed);
            this.countSamples(values.distance);
            this.countSamples(values.time);

            return values;
        };
    }


    this.onmessage = (message: MessageEvent) => {

        if (message.data && message.data.split && message.data.activity && message.data.options) {

            // If result has always been given by cache, then publish results without computing new ones
            if (message.data.result) {
                message.data.result = JSON.parse(message.data.result);
                this.postMessage(message.data);
            } else {

                let bestSplitComputer: BestSplitComputer = new BestSplitComputer();

                message.data.result = bestSplitComputer.compute(message.data.split, message.data.activity, message.data.options);

                this.postMessage(message.data);
            }
        }
    };
}

class ActivityBestSplitsModifier implements IModifier {

    public static Units = {

        Seconds: -1,
        Minutes: 0,
        Kilometers: 1,
        Miles: 2,

        MetersToMilesFactor: 0.000621371192,
        MetersTo0001hMileFactor: 0.621371192,
        KilometersToMilesFactor: 0.621371192,
        MilesToMetersFactor: 1609.344,
        KilometersToMetersFactor: 1000,

        getLabel: (unit: number) => {
            switch (unit) {
                case ActivityBestSplitsModifier.Units.Kilometers:
                    return "km";

                case ActivityBestSplitsModifier.Units.Miles:
                    return "mi";

                case ActivityBestSplitsModifier.Units.Minutes:
                    return "min";

                case ActivityBestSplitsModifier.Units.Seconds:
                    return "sec";
                default:
                    return "";
            }
        }
    };

    private activityId: number;
    private userSettings: IUserSettings;
    private activityJson: any;
    private hasPowerMeter: boolean;
    private splitsConfiguration: any;
    private saveSplitsConfigrationMethod: Function;
    private distanceUnit: number;
    private cacheKeyPrefix: string;


    constructor(activityId: number, userSettings: IUserSettings, activityJson: any, hasPowerMeter: boolean, splitsConfiguration: any, saveSplitsConfigrationMethod: Function) {
        this.activityId = activityId;
        this.userSettings = userSettings;
        this.activityJson = activityJson;
        this.hasPowerMeter = hasPowerMeter;
        this.splitsConfiguration = splitsConfiguration;
        this.saveSplitsConfigrationMethod = saveSplitsConfigrationMethod || function () {
            };
        this.distanceUnit = ActivityBestSplitsModifier.Units.Kilometers;
        this.cacheKeyPrefix = 'stravistix_bestsplit_' + this.activityId + '_';
    }

    protected filterData(data: Array<number>, distance: Array<number>, smoothing: number): Array<number> {
        /*
         if (data && distance) {
         let result = [];
         result[0] = data[0];
         for (i = 1, max = data.length; i < max; i++) {
         result[i] = result[i - 1] + (distance[i] - distance[i - 1]) * (data[i] - result[i - 1]) / smoothing;
         }
         return result;
         */
        // Below algorithm is applied in this method
        // http://phrogz.net/js/framerate-independent-low-pass-filter.html
        // value += (currentValue - value) / (smoothing / timeSinceLastSample);
        // it is adapted for stability - if (smoothing / timeSinceLastSample) is less then 1, set it to 1 -> no smoothing for that sample
        let max: number;
        if (data && distance) {
            let smooth_factor: number = 0;
            let result: Array<number> = [];
            result[0] = data[0];
            for (let i: number = 1, max = data.length; i < max; i++) {
                if (smoothing === 0) {
                    result[i] = data[i];
                } else {
                    smooth_factor = smoothing / (distance[i] - distance[i - 1]);
                    result[i] = result[i - 1] + (data[i] - result[i - 1]) / (smooth_factor > 1 ? smooth_factor : 1); // low limit smooth_factor to 1!!!
                    //                    result[i] = result[i - 1] + (data[i] - result[i - 1]) / ( smooth_factor ); // no stability check
                    // only apply filter if smooth_factor > 1, else this leads to instability !!!
                }
            }
            return result;
        }
    }

    protected addSplitToTable(split: any, splitsTableBody: JQuery, activityDistanceInMeters: number, activityDurationInSeconds: number) {

        if (split.unit === ActivityBestSplitsModifier.Units.Kilometers && (split.length * ActivityBestSplitsModifier.Units.KilometersToMetersFactor) > activityDistanceInMeters) {
            return;
        }
        if (split.unit === ActivityBestSplitsModifier.Units.Miles && (split.length * ActivityBestSplitsModifier.Units.MilesToMetersFactor) > activityDistanceInMeters) {
            return;
        }
        if (split.unit === ActivityBestSplitsModifier.Units.Minutes && (split.length * 60) > activityDurationInSeconds) {
            return;
        }

        if (split.unit === ActivityBestSplitsModifier.Units.Seconds && split.length > activityDurationInSeconds) {
            return;
        }

        split.id = split.id || Helper.guid();
        splitsTableBody.append("<tr id='split-" + split.id + "'>" +
            "<td style='white-space: nowrap;'>" + split.length + " " + ActivityBestSplitsModifier.Units.getLabel(split.unit) + "</td>" +
            "<td class='value'><div id='split-" + split.id + "-time'></div><div id='split-" + split.id + "-distance'></div></td>" +
            "<td class='value'><div id='split-" + split.id + "-avg-speed'></div></td>" +
            "<td class='value'><div id='split-" + split.id + "-avg-hr'></div></td>" +
            "<td class='value'><div id='split-" + split.id + "-drop-hr'></div></td>" +
            "<td class='value'><div id='split-" + split.id + "-rise-hr'></div></td>" +
            "<td class='value'><div id='split-" + split.id + "-avg-power'></div></td>" +
            "<td class='value'><div id='split-" + split.id + "-avg-cadence'></div></td>" +
            "<td class='value'><div id='split-" + split.id + "-elevation-gain'></div></td>" +
            "<td class='value'><div id='split-" + split.id + "-elevation-drop'></div></td>" +
            "<td><button class='compact minimal toggle-effort-visibility best-split-remove' data-split-id='" + split.id + "'>Del</button></td>" +
            "</tr>");
    }

    modify(): void {

        // wait for Segments section load
        if ($("#segments").length === 0) {
            setTimeout(() => {
                this.modify();
            }, 500);
            return;
        }

        $("#segments").addClass("best-splits-processed");

        let segments: JQuery = $("#segments"),
            bestSplitsHeader = $('<h3 class="button bestsplits-header-title" style="width: 45%; padding-right:50px; padding-left:50px; margin-left:20px;">Best splits</h3>')
                .css("display", "inline")
                .css("margin-right", "5px"),

            bestSplitsSection = $("<section id='bestsplits' class='pinnable-anchor' style='display: none;'></section>"),
            map: any,
            splitPolyLine: any,
            splitAltitude: any,
            splitColor = "black",
            selectedSplitId: string,
            measurementPreference = window.currentAthlete ? window.currentAthlete.get('measurement_preference') : 'meters';


        this.activityJson.filteredAltitude = this.filterData(this.activityJson.altitude, this.activityJson.distance, 22); // fixed smoothing 200 way way too high!

        this.distanceUnit = (measurementPreference == 'meters') ? ActivityBestSplitsModifier.Units.Kilometers : ActivityBestSplitsModifier.Units.Miles;

        segments.find("h3.segments-header")
            .html("Segment efforts")
            .css("cursor", "pointer")
            .css("display", "inline")
            .css("padding-right", "50px")
            .css("padding-left", "50px")
            .css("color", "#FC4C02")
            .css("background", "white")
            .css("margin-right", "5px")
            .addClass("button")
            .addClass("btn-primary")
            .addClass("segments-header-title")
            .removeClass("inset")
            .before(bestSplitsHeader);

        if (window.pageView) {
            if (window.pageView.contexts) {
                if (window.pageView.contexts.contexts) {
                    if (window.pageView.contexts.contexts.map["converted-elapsed-time"]) {
                        if (window.pageView.contexts.contexts.map["converted-elapsed-time"]) {
                            if (window.pageView.contexts.contexts.map["converted-elapsed-time"]._map) {
                                map = window.pageView.contexts.contexts.map["converted-elapsed-time"]._map.instance;
                            }
                        }
                    }
                }
            }
        }

        if (segments.find("[data-segment-effort-id]").length) {
            bestSplitsSection.appendTo($("#segments section.segments-list"));
        } else {
            let container: JQuery = segments.find(".no-segments");
            container.find(".icon-segment-marker-white").remove();
            container.append("<h3 class=\"inset segments-header\">Best Splits</h3>");
            container.append(bestSplitsSection);
            bestSplitsSection.show();
        }

        $(".bestsplits-header-title").click(() => {
            $(".bestsplits-header-title")
                .addClass("btn-primary")
                .css("color", "#FC4C02")
                .css("background", "white");

            $(".segments-header-title")
                .css("font-weight", "normal")
                .css("text-decoration", "none")
                .css("color", "black")
                .removeClass("btn-primary");

            $("#segment-filter").hide();

            segments.find("table.segments").hide();
            segments.find("div.show-hide-segments").hide();
            segments.find("div.hidden-segments-container").hide();
            bestSplitsSection.show();
        });

        let removeSplitSelection = () => {
            if (map && splitPolyLine) {
                map.removeLayer(splitPolyLine);
                splitPolyLine = null;
            }
            if (splitAltitude) {
                splitAltitude.attr("style", "fill: " + splitColor + "; opacity: 0");
            }
            $("[data-activity-points].selected").removeClass("selected").css({
                "background-color": "",
                "color": "black"
            });
            selectedSplitId = undefined;
        };

        $(".segments-header-title").click(() => {
            $(".segments-header-title")
                .css("color", "#FC4C02")
                .addClass("btn-primary");

            $(".bestsplits-header-title")
                .css("font-weight", "normal")
                .css("text-decoration", "none")
                .css("color", "black")
                .removeClass("btn-primary");

            $("#segment-filter").show();

            bestSplitsSection.hide();
            segments.find("table.segments").show();
            segments.find("div.show-hide-segments").show();
            if ($("#show-hidden-efforts").hasClass("hidden")) {
                segments.find("div.hidden-segments-container").show();
            }
            removeSplitSelection();
        });

        $(document).on("click", "[data-activity-points]", {}, (eventObject: JQueryEventObject) => {

            if (map) {

                $("[data-activity-points].selected").removeClass("selected").css({
                    "background-color": "",
                    "color": "black"
                });

                $(eventObject.currentTarget).addClass("selected").css({
                    "background-color": splitColor,
                    "color": "white"
                });

                if (splitPolyLine) {
                    map.removeLayer(splitPolyLine);
                    splitPolyLine = null;
                }

                let range: Array<string> = $(eventObject.currentTarget).attr("data-activity-points").split("-"),
                    start = parseInt(range[0]),
                    stop = parseInt(range[1]);


                splitPolyLine = L.polyline([], {
                    color: splitColor
                });

                for (let i: number = start; i <= stop; i++) {
                    splitPolyLine.addLatLng(L.latLng(this.activityJson.latlng[i][0], this.activityJson.latlng[i][1]));
                }

                splitPolyLine.addTo(map);

                let chartRect: JQuery = $("#grid rect:not([data-split])");
                if (chartRect.length === 0) {
                    return;
                }
                let width: number = parseInt(chartRect.attr("width")),
                    height: number = parseInt(chartRect.attr("height"));
                let xScale = d3.scale.linear().domain([0, this.activityJson.distance[this.activityJson.distance.length - 1]]).range([0, width]);
                if (!splitAltitude) {
                    splitAltitude = d3.select("#grid").insert("rect", "rect").attr("y", "0").attr("style", "fill: " + splitColor + "; opacity: 0").attr("data-split", "true");
                }

                splitAltitude.attr("x", xScale(this.activityJson.distance[start]));
                splitAltitude.attr("height", height);
                splitAltitude.attr("width", xScale(this.activityJson.distance[stop] - this.activityJson.distance[start]));
                splitAltitude.attr("style", "fill: " + splitColor + "; opacity: 0.3");

                selectedSplitId = $(eventObject.currentTarget).data("split-id");
            }
        });

        let splitsTable: JQuery = $("<table class='dense marginless best-splits' style='text-align: center'>" +
            "<thead>" +
            "<tr>" +
            "<th style='text-align: center; vertical-align: top;'>Split</th>" +
            "<th style='text-align: center; vertical-align: top;'>Time Distance</th>" +
            "<th style='text-align: center; vertical-align: top;'>Avg Speed</th>" +
            "<th style='text-align: center; vertical-align: top;'>Avg HR</th>" +
            "<th style='text-align: center; vertical-align: top;'>Drop HR</th>" +
            "<th style='text-align: center; vertical-align: top;'>Rise HR</th>" +
            "<th style='text-align: center; vertical-align: top;'>Avg Power</th>" +
            "<th style='text-align: center; vertical-align: top;'>Avg Cadence</th>" +
            "<th style='text-align: center; vertical-align: top;'>Elevation gain</th>" +
            "<th style='text-align: center; vertical-align: top;'>Elevation drop</th>" +
            "<th style='text-align: center; vertical-align: top;'></th>" +
            "</tr>" +
            "</thead>" +
            "<tfoot>" +
            "<tr>" +
            "<td colspan='11'>Length:&nbsp;" +
            "<input type='number' min='1' max='9999' value='5' id='best-split-new-length' style='width: 100px' />&nbsp;" +
            "Type:&nbsp;<select id='best-split-new-unit'>" +
            "<option selected value='" + ActivityBestSplitsModifier.Units.Minutes + "'>" + ActivityBestSplitsModifier.Units.getLabel(ActivityBestSplitsModifier.Units.Minutes) + "</option>" +
            "<option value='" + ActivityBestSplitsModifier.Units.Seconds + "'>" + ActivityBestSplitsModifier.Units.getLabel(ActivityBestSplitsModifier.Units.Seconds) + "</option>" +
            "<option value='" + ActivityBestSplitsModifier.Units.Kilometers + "'>" + ActivityBestSplitsModifier.Units.getLabel(ActivityBestSplitsModifier.Units.Kilometers) + "</option>" +
            "<option value='" + ActivityBestSplitsModifier.Units.Miles + "'>" + ActivityBestSplitsModifier.Units.getLabel(ActivityBestSplitsModifier.Units.Miles) + "</option>" +
            "</select>&nbsp;" +
            "<a class='button' id='best-split-new-add'>Add new split</a>" +
            "</td>" +
            "</tr>" +
            "<tr>" +
            "<td colspan='11' style='text-align: center'><em>Data accuracy depends on GPS logging interval used to record this activity. Move cursor over values to see exact distance/time at which the value was computed. Click on any value to see the split on map and altitude chart.</em></th>" +
            "</tr>" +
            "</tfoot>" +
            "<tbody class='splits-list'>" +
            "</tbody" +
            "</table>");

        bestSplitsSection.append(splitsTable);
        let splitsTableBody: JQuery = splitsTable.find("tbody");

        let splitsArray: Array<any> = [{
            length: 1,
            unit: ActivityBestSplitsModifier.Units.Kilometers,
            id: Helper.guid()
        }, {
            length: 10,
            unit: ActivityBestSplitsModifier.Units.Kilometers,
            id: Helper.guid()
        }, {
            length: 30,
            unit: ActivityBestSplitsModifier.Units.Kilometers,
            id: Helper.guid()
        }, {
            length: 50,
            unit: ActivityBestSplitsModifier.Units.Kilometers,
            id: Helper.guid()
        }, {
            length: 1,
            unit: ActivityBestSplitsModifier.Units.Minutes,
            id: Helper.guid()
        }, {
            length: 10,
            unit: ActivityBestSplitsModifier.Units.Minutes,
            id: Helper.guid()
        }, {
            length: 20,
            unit: ActivityBestSplitsModifier.Units.Minutes,
            id: Helper.guid()
        }, {
            length: 60,
            unit: ActivityBestSplitsModifier.Units.Minutes,
            id: Helper.guid()
        }];

        if (this.splitsConfiguration) {
            splitsArray = this.splitsConfiguration.splits || splitsArray;
        }
        splitsArray.sort((left, right) => {
            if (left.unit === right.unit) {
                return left.length - right.length;
            } else {
                return left.unit - right.unit;
            }
        });

        let activityDistanceInMeters: number = this.activityJson.distance[this.activityJson.distance.length - 1],
            activityDurationInSeconds: number = this.activityJson.time[this.activityJson.time.length - 1];


        splitsArray.forEach((split: any) => {
            this.addSplitToTable(split, splitsTableBody, activityDistanceInMeters, activityDurationInSeconds)
        });

        let saveSplitsConfiguration = (splitsArray: Array<any>) => {
            this.saveSplitsConfigrationMethod({
                splits: splitsArray
            });
        };

        $(document).on("click", ".best-split-remove", (event: JQueryEventObject) => {

            event.preventDefault();

            let splitId: string = $(event.currentTarget).data("split-id");
            if (splitId === selectedSplitId) {
                removeSplitSelection();
            }

            splitsTableBody.find("#split-" + splitId).fadeOut(() => {
                $(event.currentTarget).remove();
            });

            splitsArray = splitsArray.filter((split: any) => {
                return split.id != splitId;
            });

            saveSplitsConfiguration(splitsArray);
        });

        $("#best-split-new-add").click((e: Event) => {
            e.preventDefault();
            let splitLength = parseInt($("#best-split-new-length").val());
            if (splitLength < 1) {
                $("#best-split-new-length").focus();
                return;
            }
            let splitType = parseInt($("#best-split-new-unit").val());

            let splitAlreadyExist = _.findWhere(splitsArray, {
                length: splitLength,
                unit: splitType
            });

            if (splitAlreadyExist) {
                alert('This split already exist.');
                return;
            }

            switch (splitType) {

                case ActivityBestSplitsModifier.Units.Minutes:
                    if ((splitLength * 60) > activityDurationInSeconds) {
                        $.fancybox({
                            'autoScale': true,
                            'transitionIn': 'fade',
                            'transitionOut': 'fade',
                            'type': 'iframe',
                            'content': '<div>The length of the split cannot be longer than the activity time.</div>',
                            'afterClose': () => {
                                $("#best-split-new-length").focus();
                            }
                        });
                        return;
                    }
                    break;

                case ActivityBestSplitsModifier.Units.Seconds:
                    if (splitLength > activityDurationInSeconds) {
                        $.fancybox({
                            'autoScale': true,
                            'transitionIn': 'fade',
                            'transitionOut': 'fade',
                            'type': 'iframe',
                            'content': '<div>The length of the split cannot be longer than the activity time.</div>',
                            'afterClose': () => {
                                $("#best-split-new-length").focus();
                            }
                        });
                        return;
                    }
                    break;

                case ActivityBestSplitsModifier.Units.Kilometers:
                case ActivityBestSplitsModifier.Units.Miles:
                    let valueToCheck = splitLength * (splitType === ActivityBestSplitsModifier.Units.Miles ? ActivityBestSplitsModifier.Units.MilesToMetersFactor : ActivityBestSplitsModifier.Units.KilometersToMetersFactor);
                    if (valueToCheck > activityDistanceInMeters) {
                        $.fancybox({
                            'autoScale': true,
                            'transitionIn': 'fade',
                            'transitionOut': 'fade',
                            'type': 'iframe',
                            'content': '<div>The length of the split cannot be longer than the activity distance.</div>',
                            'afterClose': () => {
                                $("#best-split-new-length").focus();
                            }
                        });
                        return;
                    }
                    break;

                default:
                    $("#best-split-new-unit").focus();
                    return;
            }

            let newSplit = {
                id: Helper.guid(),
                unit: splitType,
                length: splitLength
            };
            splitsArray.push(newSplit);
            saveSplitsConfiguration(splitsArray);
            this.addSplitToTable(newSplit, splitsTableBody, activityDistanceInMeters, activityDurationInSeconds)
            processSplit(newSplit);
        });

        let worker: Worker,
            workerPromises: Array<JQueryDeferred<any>> = [];
        let computeSplit = (split: any, activity: any) => {
            // TODO Implement cache for best split here. Avoid computation of split each time to load the page faster
            if (!worker) {
                let blobURL = URL.createObjectURL(new Blob(['(',
                    BestSplitWorker.toString(),
                    ')()'
                ], {
                    type: 'application/javascript'
                }));
                worker = new Worker(blobURL);
                worker.onmessage = (message: MessageEvent) => {
                    workerPromises[message.data.split.id].resolve(message.data.result);
                    delete workerPromises[message.data.split.id];
                };
                URL.revokeObjectURL(blobURL);
            }
            workerPromises[split.id] = $.Deferred();
            worker.postMessage({
                result: localStorage.getItem(this.cacheKeyPrefix + split.id),
                split: split,
                activity: activity,
                options: {
                    distanceUnit: this.distanceUnit,
                    Minutes: ActivityBestSplitsModifier.Units.Minutes,
                    Seconds: ActivityBestSplitsModifier.Units.Seconds,
                    Kilometers: ActivityBestSplitsModifier.Units.Kilometers,
                    Miles: ActivityBestSplitsModifier.Units.Miles,
                    MetersTo0001hMileFactor: ActivityBestSplitsModifier.Units.MetersTo0001hMileFactor,
                    KilometersToMilesFactor: ActivityBestSplitsModifier.Units.KilometersToMilesFactor,
                    MilesToMetersFactor: ActivityBestSplitsModifier.Units.MilesToMetersFactor,
                    KilometersToMetersFactor: ActivityBestSplitsModifier.Units.KilometersToMetersFactor
                }
            });
            return workerPromises[split.id].promise();
        };

        let processSplit = (split: any) => {
            let splitId = "#split-" + split.id,
                splitRow = splitsTableBody.find(splitId),
                setValue = (elementId: string, value: any, formatFunction: Function, defValue: string, tooltipFormatFunction: Function) => {
                    let element = $(elementId);
                    element.html("");
                    if (value.samples) {
                        let text = formatFunction ? formatFunction(value.value) : value.value;
                        element.text(text);
                        element.attr("data-activity-points", value.begin + "-" + value.end);
                        element.data("split-id", split.id);
                        element.css({
                            "cursor": "pointer"
                        });
                        if (value.timeOrDistance && tooltipFormatFunction) {
                            element.attr("title", tooltipFormatFunction(value));
                        }
                    } else {
                        if (defValue) {
                            element.text(defValue);
                        }
                    }
                };
            splitRow.find("td.value").append("<span class='ajax-loading-image'></span>");

            let formatDistance = (value: any) => {
                    return Helper.formatNumber(value.timeOrDistance / 1000) + ActivityBestSplitsModifier.Units.getLabel(this.distanceUnit);
                },
                formatTime = (value: any) => {
                    return Helper.secondsToHHMMSS(value.timeOrDistance, true);
                },
                formatTooltip = split.unit === ActivityBestSplitsModifier.Units.Minutes ? formatTime : formatDistance,
                formatTooltipDropRise = (value: any) => {
                    let arrow = value.value.beginValue > value.value.endValue ? "\u2198" : "\u2197";
                    return Helper.formatNumber(value.value.beginValue, 0) + arrow + Helper.formatNumber(value.value.endValue, 0) + " " + formatTooltip(value);
                },
                speedLabel = this.distanceUnit === ActivityBestSplitsModifier.Units.Miles ? "mph" : "km/h";

            computeSplit(split, this.activityJson).done((value: any) => {

                // Set or update split result in cache
                if (!localStorage.getItem(this.cacheKeyPrefix + split.id)) {
                    try {
                        localStorage.setItem(this.cacheKeyPrefix + split.id, JSON.stringify(value));
                    } catch (err) {
                        console.warn(err);
                        localStorage.clear();
                    }
                }

                setValue(splitId + "-time", value.time, (value: any) => {
                    return Helper.secondsToHHMMSS(value, true);
                }, "", formatDistance);
                setValue(splitId + "-distance", value.distance, (value: any) => {
                    return Helper.formatNumber(value / 1000) + ActivityBestSplitsModifier.Units.getLabel(this.distanceUnit);
                }, "", formatTime);
                setValue(splitId + "-avg-speed", value.avgSpeed, (value: any) => {
                    return Helper.formatNumber(value) + speedLabel;
                }, "n/a", formatTooltip);
                setValue(splitId + "-avg-hr", value.avgHr, (value: any) => {
                    return Helper.formatNumber(value, 0) + "bpm";
                }, "n/a", formatTooltip);
                setValue(splitId + "-drop-hr", value.dropHr, (value: any) => {
                    return "-" + Helper.formatNumber(value.value, 0) + "bpm";
                }, "n/a", formatTooltipDropRise);
                setValue(splitId + "-rise-hr", value.riseHr, (value: any) => {
                    return "+" + Helper.formatNumber(value.value, 0) + "bpm";
                }, "n/a", formatTooltipDropRise);
                setValue(splitId + "-avg-power", value.avgPower, (value: any) => {
                    return Helper.formatNumber(value, 0) + "W";
                }, "n/a", formatTooltip);
                setValue(splitId + "-elevation-gain", value.elevationGain, (value: any) => {
                    return Helper.formatNumber(value, 0) + "m";
                }, "n/a", formatTooltip);
                setValue(splitId + "-elevation-drop", value.elevationDrop, (value: any) => {
                    return Helper.formatNumber(value, 0) + "m";
                }, "n/a", formatTooltip);
                setValue(splitId + "-avg-cadence", value.avgCadence, (value: any) => {
                    return Helper.formatNumber(value, 0);
                }, "n/a", formatTooltip);
                splitRow.find("td.value span.ajax-loading-image").remove();
            });
        };

        splitsArray.forEach((split: any) => {
            processSplit(split);
        });

        // when a user clicks 'Analysis' #segments element is removed so we have to wait for it and re-run the modify function
        let waitForSegmentsSectionRemoved = () => {
            if ($("#segments.best-splits-processed").length !== 0) {
                setTimeout(() => {
                    waitForSegmentsSectionRemoved();
                }, 1000);
                return;
            }
            this.modify();
        };
        waitForSegmentsSectionRemoved();
    }

}
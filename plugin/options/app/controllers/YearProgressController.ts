interface IYearProgress {
    year: number;
    progressions: Array<IProgression>;
}
interface IProgression {
    onTimestamp: number;
    onYear: number;
    onDayOfYear: number;
    totalDistance: number; // meters
    totalTime: number; // seconds
    totalElevation: number; // meters
    count: number;
}

interface YearProgressActivity extends ISyncActivityComputed {
    year: number;
    dayOfYear: number;
}

class YearProgressComputer {

    public compute(yearProgressActivities: Array<YearProgressActivity>, types: Array<string>): Array<IYearProgress> {

        if (_.isEmpty(yearProgressActivities)) {
            return;
        }

        // Keep from types
        yearProgressActivities = _.filter(yearProgressActivities, (activity: YearProgressActivity) => {
            if (_.indexOf(types, activity.type) !== -1) {
                let momentStartTime: Moment = moment(activity.start_time);
                activity.year = momentStartTime.year();
                activity.dayOfYear = momentStartTime.dayOfYear();
                return true;
            }
            return false
        });


        if (yearProgressActivities.length === 0) {
            return;
        }

        // Sort yearProgressActivities along start_time
        yearProgressActivities = _.sortBy(yearProgressActivities, (activity: YearProgressActivity) => {
            return activity.start_time;
        });

        // Find along types date from & to / From: 1st january of first year / To: Today
        let fromMoment: Moment = moment(_.first(yearProgressActivities).start_time).startOf('year'); // 1st january of first year
        let todayMoment: Moment = moment().endOf('day'); // Today end of day

        // Init required IYearProgress result
        let result: Array<IYearProgress> = [];


        // From 'fromMoment' to 'todayMoment' loop on days...
        let currentDayMoment = moment(fromMoment);
        let currentYearProgress: IYearProgress = null;
        let lastProgression: IProgression = null;

        while (currentDayMoment.isSameOrBefore(todayMoment)) {

            let currentYear = currentDayMoment.year();
            let progression: IProgression = null;

            // Create new year progress if current year do not exists
            if (!_.findWhere(result, {year: currentYear})) {
                lastProgression = null; // New year then remove
                currentYearProgress = {
                    year: currentYear,
                    progressions: []
                };
                // Start totals from 0
                progression = {
                    onTimestamp: currentDayMoment.toDate().getTime(),
                    onYear: currentDayMoment.year(),
                    onDayOfYear: currentDayMoment.dayOfYear(),
                    totalDistance: 0,
                    totalTime: 0,
                    totalElevation: 0,
                    count: 0
                };
                result.push(currentYearProgress); // register inside result
            } else {
                // Year exists
                progression = {
                    onTimestamp: currentDayMoment.toDate().getTime(),
                    onYear: currentDayMoment.year(),
                    onDayOfYear: currentDayMoment.dayOfYear(),
                    totalDistance: lastProgression.totalDistance,
                    totalTime: lastProgression.totalTime,
                    totalElevation: lastProgression.totalElevation,
                    count: lastProgression.count
                };
            }

            // Find matching activities
            let foundOnToday: Array<ISyncActivityComputed> = _.where(yearProgressActivities, {
                year: currentDayMoment.year(),
                dayOfYear: currentDayMoment.dayOfYear()
            });

            if (foundOnToday.length > 0) {
                for (let i: number = 0; i < foundOnToday.length; i++) {
                    // Then apply totals...
                    progression.totalDistance += foundOnToday[i].distance_raw;
                    progression.totalTime += foundOnToday[i].moving_time_raw;
                    progression.totalElevation += foundOnToday[i].elevation_gain_raw;
                    progression.count++;
                }
            }
            lastProgression = progression; // Keep tracking for tomorrow day.
            currentYearProgress.progressions.push(progression);
            currentDayMoment.add(1, 'days'); // Add a day until todayMoment
        }
        return result;
    }
}
enum DataType {
    DISTANCE,
    TIME,
    ELEVATION,
    COUNT
}

// TODO Targets?
// TODO Remove old feature?

class YearProgressController {

    public static $inject = ['$scope', 'ChromeStorageService', '$mdDialog'];

    constructor($scope: any, chromeStorageService: ChromeStorageService, $mdDialog: IDialogService) {

        let yearProgressComputer: YearProgressComputer = new YearProgressComputer();

        $scope.enabledFeature = true;
        $scope.computedActivities = [];

        $scope.today = Date.now();

        // Data type
        $scope.dataType = [
            {value: DataType.DISTANCE, text: 'Distance (km)'},
            {value: DataType.TIME, text: 'Time (h)'},
            {value: DataType.ELEVATION, text: 'Elevation (m)'},
            {value: DataType.COUNT, text: 'Count'},
        ];


        $scope.dataTypeSelected = (localStorage.getItem('yearProgressDataType') && _.isNumber(parseInt(localStorage.getItem('yearProgressDataType')))) ? _.findWhere($scope.dataType, {value: parseInt(localStorage.getItem('yearProgressDataType'))}) : $scope.dataType[0];
        $scope.dataTypeChanged = () => {
            localStorage.setItem('yearProgressDataType', $scope.dataTypeSelected.value); // Store value
            $scope.applyData($scope.computedActivities, $scope.searchTypesSelected, $scope.dataTypeSelected.value);
        };



        $scope.typesChanged = () => {
            localStorage.setItem('yearProgressActivitiesType', angular.toJson($scope.searchTypesSelected)); // Store value
            $scope.applyData($scope.computedActivities, $scope.searchTypesSelected, $scope.dataTypeSelected.value);
        };

        $scope.showHelp = () => {
            let todayMoment = moment().format('MMMM Do');
            let dialog = $mdDialog.alert()
                .htmlContent("This panel displays your progress for each beginning of year to current month and day. Today is " + todayMoment + ", this panel shows \"What I've accomplished by " + todayMoment + " of this year compared to previous years to the same date.\"")
                .ok('Got it !');
            $mdDialog.show(dialog);
        };

        // Start...
        chromeStorageService.fetchComputedActivities().then((computedActivities: Array<ISyncActivityComputed>) => {

            $scope.computedActivities = computedActivities;

            let typesCount = _.countBy(_.pluck($scope.computedActivities, 'type'));

            let mostPerformedType: string = <string> _.first(_.last(_.sortBy(_.pairs(typesCount), (value: any) => {
                return value[1];
            })));

            // Try use types from localStorage or use the most performed sport by the user
            $scope.searchTypesSelected = (localStorage.getItem('yearProgressActivitiesType')) ? angular.fromJson(localStorage.getItem('yearProgressActivitiesType')) : (mostPerformedType) ? [mostPerformedType] : null;

            // Which text displayed in activities types?
            $scope.getSearchTypesSelectedText = function () {
                if ($scope.searchTypesSelected.length) {
                    return $scope.searchTypesSelected.length + ' selected';
                } else {
                    return "Activities types";
                }
            };

            $scope.searchStatsTypes = _.keys(typesCount); // Handle uniques activity types for selection in UI

            if (_.isEmpty($scope.computedActivities)) {
                $scope.enabledFeature = false;
                // return;
            }
            $scope.applyData($scope.computedActivities, $scope.searchTypesSelected, $scope.dataTypeSelected.value);
        });

        $scope.applyData = function (computedActivities: Array<ISyncActivityComputed>, types: Array<string>, dataType: DataType) {

            let yearProgressions = yearProgressComputer.compute(<Array<YearProgressActivity>> computedActivities, types);

            // Compute curves & rows
            let curves: Array<any> = [];
            let tableRows: Array<any> = [];

            _.each(yearProgressions, (yearProgress: IYearProgress, index: number, yearProgressionsIterator: Array<IYearProgress>) => {

                let yearValues: Array<{x: number, y: number}> = [];

                _.each(yearProgress.progressions, (progression: IProgression) => {

                    let date = new Date(progression.onTimestamp);
                    let flatDate = new Date(0, date.getMonth(), date.getDate(), 0, 0, 0, 0);

                    let value: number;

                    switch (dataType) {
                        case DataType.DISTANCE:
                            value = progression.totalDistance / 1000; // km
                            break;
                        case DataType.TIME:
                            value = progression.totalTime / 3600; // hours
                            break;
                        case DataType.ELEVATION:
                            value = progression.totalElevation; // meters
                            break;
                        case DataType.COUNT:
                            value = progression.count; // meters
                            break;
                    }
                    yearValues.push({
                        x: flatDate.getTime(),
                        y: value
                    });
                });

                // Add row
                let progressAtThisDayOfYear: IProgression = _.findWhere(yearProgress.progressions, {
                    onDayOfYear: moment().dayOfYear()
                });

                let tableRow: any = {};
                tableRow.year = yearProgress.year;

                tableRow.totalDistance = progressAtThisDayOfYear.totalDistance / 1000;
                tableRow.totalTime = moment.duration(progressAtThisDayOfYear.totalTime * 1000).asHours();
                tableRow.totalElevation = progressAtThisDayOfYear.totalElevation;
                tableRow.count = progressAtThisDayOfYear.count;

                if (yearProgressionsIterator[index - 1]) {

                    let progressAtThisDayOfLastYear: IProgression = _.findWhere(yearProgressionsIterator[index - 1].progressions, {
                        onDayOfYear: moment().dayOfYear()
                    });

                    tableRow.deltaPreviousDistance = (progressAtThisDayOfYear.totalDistance - progressAtThisDayOfLastYear.totalDistance) / 1000;
                    tableRow.deltaPreviousDistanceColor = (tableRow.deltaPreviousDistance >= 0) ? "green" : "red";
                    tableRow.deltaPreviousTime = moment.duration((progressAtThisDayOfYear.totalTime - progressAtThisDayOfLastYear.totalTime) * 1000).asHours();
                    tableRow.deltaPreviousTimeColor = (tableRow.deltaPreviousTime >= 0) ? "green" : "red";
                    tableRow.deltaPreviousElevation = progressAtThisDayOfYear.totalElevation - progressAtThisDayOfLastYear.totalElevation;
                    tableRow.deltaPreviousElevationColor = (tableRow.deltaPreviousElevation >= 0) ? "green" : "red";
                    tableRow.deltaPreviousCount = progressAtThisDayOfYear.count - progressAtThisDayOfLastYear.count;
                    tableRow.deltaPreviousCountColor = (tableRow.deltaPreviousCount >= 0) ? "green" : "red";
                }

                tableRows.push(tableRow);

                // Add curve
                curves.push({
                    key: yearProgress.year,
                    values: yearValues,
                });
            });

            $scope.tableData = _.sortBy(tableRows, (row) => {
                return -1 * row.year;
            });

            $scope.graphData = _.sortBy(curves, (curve) => {
                return -1 * curve.key;
            });
        };

        $scope.graphOptions = {
            chart: {
                type: 'lineChart',
                // height: window.innerHeight * 0.65,
                height: 575,
                margin: {
                    top: 20,
                    right: 50,
                    bottom: 80,
                    left: 50
                },
                x: (d: any) => {
                    return d.x;
                },
                y: (d: any) => {
                    return d.y;
                },
                useInteractiveGuideline: true,
                dispatch: {
                    stateChange: (e: any) => {
                        console.log("stateChange");
                    },
                    changeState: (e: any) => {
                        console.log("changeState");
                    },
                    tooltipShow: (e: any) => {
                        console.log("tooltipShow");
                    },
                    tooltipHide: (e: any) => {
                        console.log("tooltipHide");
                    }
                },
                xAxis: {
                    ticks: 12,
                    tickFormat: (d: any) => {
                        return moment(d).format('MMM Do');
                    },
                    staggerLabels: true
                },
                yAxis: {
                    ticks: 10,
                    tickFormat: (d: any) => {
                        return d3.format('.01f')(d);
                    },
                    axisLabelDistance: -10,
                },
                callback: (chart: any) => {
                    console.log('Graph loaded');
                    $scope.nvd3api.update();

                }
            }
        };

        $scope.selected = [];

        $scope.tableQuery = {
            order: 'name',
            limit: 5,
            page: 1
        };

    }
}

app.controller("YearProgressController", YearProgressController);

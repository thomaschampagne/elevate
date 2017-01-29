// types: Array<string>;

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
                    progression.totalTime += foundOnToday[i].elapsed_time_raw;
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
class YearProgressController {

    public static $inject = ['$scope', 'ChromeStorageService', '$mdDialog', '$window'];

    protected computedActivities: Array<ISyncActivityComputed> = [];

    constructor($scope: any, chromeStorageService: ChromeStorageService, $mdDialog: IDialogService, $window: IWindowService) {

        let yearProgressComputer: YearProgressComputer = new YearProgressComputer();

        // Data type
        $scope.dataType = [
            {value: DataType.DISTANCE, text: 'Distance'},
            {value: DataType.TIME, text: 'Time'},
            {value: DataType.ELEVATION, text: 'Elevation'},
            {value: DataType.COUNT, text: 'Count'},
        ];
        $scope.dataTypeSelected = $scope.dataType[0];
        $scope.dataTypeChanged = () => {
            $scope.applyData(this.computedActivities, $scope.searchTypesSelected, $scope.dataTypeSelected.value);
        };

        // Activities type
        $scope.searchTypesSelected = ['Ride', 'VirtualRide']; // Defaults
        $scope.getSearchTypesSelectedText = function () {
            if ($scope.searchTypesSelected.length) {
                return $scope.searchTypesSelected.length + ' selected';
            } else {
                return "Activities types";
            }
        };
        $scope.typesChanged = () => {
            $scope.applyData(this.computedActivities, $scope.searchTypesSelected, $scope.dataTypeSelected.value);
        };

        // Start...
        chromeStorageService.fetchComputedActivities().then((computedActivities: Array<ISyncActivityComputed>) => {

            this.computedActivities = computedActivities;
            $scope.searchStatsTypes = _.uniq(_.flatten(_.pluck(computedActivities, 'type'))); // Handle uniques activity types for selection in UI

            setTimeout(() => {
                $scope.applyData(this.computedActivities, $scope.searchTypesSelected, $scope.dataTypeSelected.value);
            });
        });

        $scope.applyData = function (computedActivities: Array<ISyncActivityComputed>, types: Array<string>, dataType: DataType) {

            if (_.isEmpty(computedActivities) || _.isEmpty(types)) {
                alert('hide graph');
                return;
            }

            let yearProgressions = yearProgressComputer.compute(<Array<YearProgressActivity>> computedActivities, types);

            // Compute curves & rows
            let curves: Array<any> = [];
            let rows: Array<any> = [];

            _.each(yearProgressions, (yearProgress: IYearProgress) => {

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

                let row: any = {};
                row.year = yearProgress.year;
                row.totalDistance = progressAtThisDayOfYear.totalDistance / 1000;
                row.totalTime = moment.duration(progressAtThisDayOfYear.totalTime * 1000).asHours();
                row.totalElevation = progressAtThisDayOfYear.totalElevation;
                row.count = progressAtThisDayOfYear.count;
                rows.push(row);

                // Add curve
                curves.push({
                    key: yearProgress.year,
                    values: yearValues,
                });
            });

            $scope.tableData = _.sortBy(rows, (row) => {
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
                height: 650,
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
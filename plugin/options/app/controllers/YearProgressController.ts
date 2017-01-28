// types: Array<string>;

interface IYearProgress {
    year: number;
    progressions: Array<IProgression>;
}

interface IProgression {
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

        // console.warn(yearProgressActivities);

        // Find along types date from & to / From: 1st january of first year / To: Today
        let fromMoment: Moment = moment(_.first(yearProgressActivities).start_time).startOf('year'); // 1st january of first year
        let todayMoment: Moment = moment().endOf('day'); // Today end of day

        // console.warn(fromMoment.toDate());
        // console.warn(todayMoment.toDate());
        //

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

class YearProgressController {

    public static $inject = ['$scope', 'ChromeStorageService', '$mdDialog', '$window'];

    constructor($scope: any, chromeStorageService: ChromeStorageService, $mdDialog: IDialogService, $window: IWindowService) {


        let yearProgressComputer: YearProgressComputer = new YearProgressComputer();

        chromeStorageService.fetchComputedActivities().then((computedActivities: Array<ISyncActivityComputed>) => {

            // let result = yearProgressComputer.compute(<Array<YearProgressActivity>> computedActivities, ['Ride', 'VirtualRide']);
            // let result = yearProgressComputer.compute(<Array<YearProgressActivity>> computedActivities, ['Run']);
            let result = yearProgressComputer.compute(<Array<YearProgressActivity>> computedActivities, ['VirtualRide']);

            console.log(result);
        });

        $scope.options = {
            chart: {
                type: 'lineChart',
                height: window.innerHeight * 0.65,
                // showLegend: false,
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
                    axisLabel: 'Time (ms)'
                },
                yAxis: {
                    axisLabel: 'Voltage (v)',
                    tickFormat: (d: any) => {
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: -10
                },
                callback: (chart: any) => {
                    console.log("!!! lineChart callback !!!");
                }
            },

        };

        // $scope.data = sinAndCos();

        /*Random Data Generator */

        // function sinAndCos() {
        //     var sin = [],sin2 = [],
        //         cos = [];
        //
        //     //Data is represented as an array of {x,y} pairs.
        //     for (var i = 0; i < 100; i++) {
        //         sin.push({x: i, y: Math.sin(i/10)});
        //         sin2.push({x: i, y: i % 10 == 5 ? null : Math.sin(i/10) *0.25 + 0.5});
        //         cos.push({x: i, y: .5 * Math.cos(i/10+ 2) + Math.random() / 10});
        //     }
        //
        //     //Line chart data should be sent as an array of series objects.
        //     return [
        //         {
        //             values: sin,      //values - represents the array of {x,y} data points
        //             key: 'Sine Wave', //key  - the name of the series.
        //             color: '#ff7f0e',  //color - optional: choose your own line color.
        //             strokeWidth: 2,
        //             classed: 'dashed'
        //         },
        //         {
        //             values: cos,
        //             key: 'Cosine Wave',
        //             color: '#2ca02c'
        //         },
        //         {
        //             values: sin2,
        //             key: 'Another sine wave',
        //             color: '#7777ff',
        //             area: true      //area - set to true if you want this line to turn into a filled area chart.
        //         }
        //     ];
        // };

    }

}

app.controller("YearProgressController", YearProgressController);
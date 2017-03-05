interface IFitnessTrendGraphScope extends IScope {
    nvd3api: any;
    userFTP: number;
    userSwimFTP: number;
    makeGraph: Function;
    showTrainingZone: boolean;
    showTrainingZoneChanged: Function;
    trainingZoneOnToday: ITrainingZone;
    getTrainingZone: (tsb: number) => ITrainingZone;
    usePowerMeter: boolean;
    usePowerMeterChanged: () => void;
    useSwimStressScore: boolean;
    useSwimStressScoreChanged: () => void;
    colors: IColors;
    fitnessDataOnToday: IFitnessActivity;
    makeTooltip: (d: any) => string;
    drawHtmlSeparator: () => string;
    drawLegendSquare: (color: string, width: number, text: string) => string;
    onGraphDrawn: () => void;
    lastSyncDate: number;
    toDate: Date;
    fromDate: Date;
    fitnessData: Array<IFitnessActivity>;
    maxDate: Date;
    minDate: Date;
    generateFitnessGraphData: (fitnessData: Array<IFitnessActivity>, fromTimestamp: number, toTimestamp: number) => IFitnessGraphData;
    configureGraph: () => void;
    updateFitnessChartGraph: (lastMonthPeriodChange: boolean, fromOrToDateChange: boolean) => void;
    toDateChanged: () => void;
    fromDateChanged: () => void;
    lastMonthsPeriodChanged: (periodSelected: {days: number, label: string}) => void;
    periodSelected: {days: Number, label: String};
    periodsToWatch: {days: Number, label: String}[];
    activityTypes: Array<string>;
    fitnessChartOptions: any;
    fitnessChartData: IFitnessGraphData;
    showHelp: () => void;
    loadFitnessData(): void;
}

interface IFitnessGraphData {
    curves: {key: string, values: Array<any>, color: string, area?: boolean, classed?: string}[];
    yDomain: Array<number>;
}

interface ITrainingZone {
    name: string;
    level: number;
    color: string;
}

class FitnessTrendGraph {

    static $inject: string[] = ['$scope', '$colors', '$window', '$mdDialog', '$location'];

    constructor(public $scope: IFitnessTrendGraphScope, public $colors: IColors, public $window: IWindowService, public $mdDialog: IDialogService, public $location: ILocationService) {

        let onGraphDrawTimeStart: number;
        let onGraphDrawnTimeDone: number;

        $scope.colors = $colors;

        // Check showTrainingZone stored cfg
        $scope.showTrainingZone = (_.isEmpty(localStorage.getItem('showTrainingZone')) || localStorage.getItem('showTrainingZone') === '1');
        $scope.showTrainingZoneChanged = () => {
            localStorage.setItem('showTrainingZone', $scope.showTrainingZone ? '1' : '0'); // Store value
            $scope.updateFitnessChartGraph(false, true);
        };

        $scope.$on(FitnessTrendController.fitnessDataLoaded, (event: any, message: any) => {

            console.log('FitnessTrendGraph: message ' + FitnessTrendController.fitnessDataLoaded + ' received');

            $scope.usePowerMeter = message.usePowerMeter;
            $scope.userFTP = message.userFTP;
            $scope.useSwimStressScore = message.useSwimStressScore;
            $scope.userSwimFTP = message.userSwimFTP;
            $scope.fitnessData = message.fitnessData;
            $scope.fitnessDataOnToday = _.last(_.where($scope.fitnessData, {
                previewDay: false
            }));
            $scope.trainingZoneOnToday = $scope.getTrainingZone($scope.fitnessDataOnToday.tsb);
            $scope.updateFitnessChartGraph(true, false);
        });


        // User just trigger power meter use toggle
        $scope.usePowerMeterChanged = () => {

            if (!_.isNumber($scope.userFTP)) {

                $scope.usePowerMeter = false; // Reset

                let confirm = $mdDialog.confirm()
                    .htmlContent('Your Cycling Functional Threshold Power (FTP) is not defined. Please set it in athlete settings and reload this page.')
                    .cancel('cancel').ok('Go to athlete settings');

                $mdDialog.show(confirm).then(() => {
                    $location.path(routeMap.athleteSettingsRoute);
                }, () => {
                });

            } else {

                // Apply graph changes
                localStorage.setItem('usePowerMeter', $scope.usePowerMeter ? '1' : '0'); // Store value

                // Call parent FitnessTrendController:loadFitnessData to re-compute fitness data
                // A FitnessTrendController.fitnessDataLoaded message will be re-send
                $scope.loadFitnessData();
            }
        };

        $scope.useSwimStressScoreChanged = () => {

            if (!_.isNumber($scope.userSwimFTP)) {

                $scope.useSwimStressScore = false; // Reset

                let confirm = $mdDialog.confirm()
                    .htmlContent('Your Swimming Functional Threshold Pace is not defined. Please set it in athlete settings and reload this page.')
                    .cancel('cancel').ok('Go to athlete settings');

                $mdDialog.show(confirm).then(() => {
                    $location.path(routeMap.athleteSettingsRoute);
                }, () => {
                });

            } else {

                // Apply graph changes
                localStorage.setItem('useSwimStressScore', $scope.useSwimStressScore ? '1' : '0'); // Store value

                // Call parent FitnessTrendController:loadFitnessData to re-compute fitness data
                // A FitnessTrendController.fitnessDataLoaded message will be re-send
                $scope.loadFitnessData();
            }
        }

        $scope.periodsToWatch = [{
            days: moment.duration(moment().diff(moment().subtract(7, 'days'))).asDays(),
            label: 'Last 7 days'
        }, {
            days: moment.duration(moment().diff(moment().subtract(14, 'days'))).asDays(),
            label: 'Last 14 days'
        }, {
            days: moment.duration(moment().diff(moment().subtract(1, 'months'))).asDays(),
            label: 'Last month'
        }, {
            days: moment.duration(moment().diff(moment().subtract(6, 'weeks'))).asDays(),
            label: 'Last 6 weeks'
        }, {
            days: moment.duration(moment().diff(moment().subtract(2, 'months'))).asDays(),
            label: 'Last 2 months'
        }, {
            days: moment.duration(moment().diff(moment().subtract(4, 'months'))).asDays(),
            label: 'Last 4 months'
        }, {
            days: moment.duration(moment().diff(moment().subtract(6, 'months'))).asDays(),
            label: 'Last 6 months'
        }, {
            days: moment.duration(moment().diff(moment().subtract(1, 'years'))).asDays(),
            label: 'Last 12 months'
        }, {
            days: moment.duration(moment().diff(moment().subtract(2, 'years'))).asDays(),
            label: 'Last 24 months'
        }, {
            days: 0,
            label: 'From the beginning'
        }];

        // Re-select last month period chosen
        let index = parseInt(localStorage.getItem('lastMonthPeriodSelected'));

        if (_.isNumber(index) && !_.isNaN(index) && !_.isEmpty($scope.periodsToWatch[index])) {
            $scope.periodSelected = $scope.periodsToWatch[index];
        } else {
            $scope.periodSelected = $scope.periodsToWatch[6];
        }

        $scope.lastMonthsPeriodChanged = (periodSelected: {days: number, label: string}) => {
            let index: number = _.indexOf($scope.periodsToWatch, periodSelected);
            if (index !== -1) {
                localStorage.setItem('lastMonthPeriodSelected', index.toString()); // Store value
            }
            $scope.updateFitnessChartGraph(true, false);
        };

        $scope.fromDateChanged = () => {
            $scope.updateFitnessChartGraph(false, true);
        };

        $scope.toDateChanged = () => {
            $scope.updateFitnessChartGraph(false, true);
        };

        $scope.updateFitnessChartGraph = (lastMonthPeriodChange: boolean, fromOrToDateChange: boolean) => {

            onGraphDrawTimeStart = performance.now(); // Track graph draw time

            // Compute from timestamp
            let fromTimestamp: number, toTimestamp: number;

            $scope.minDate = moment(_.first($scope.fitnessData).timestamp).startOf('day').toDate();
            $scope.maxDate = new Date(); //moment(_.last($scope.fitnessData).timestamp).endOf('day').toDate();

            if (lastMonthPeriodChange) {

                if ($scope.periodSelected.days === 0) {
                    fromTimestamp = $scope.minDate.getTime();
                } else {
                    fromTimestamp = moment().startOf('day').subtract($scope.periodSelected.days.toString(), 'days').toDate().getTime();
                }

                toTimestamp = $scope.maxDate.getTime();

                // Update date pickers
                $scope.fromDate = new Date(fromTimestamp);
                $scope.toDate = new Date(toTimestamp);
            }

            if (fromOrToDateChange) {
                fromTimestamp = $scope.fromDate.getTime();
                toTimestamp = moment($scope.toDate).endOf('day').toDate().getTime();
            }

            $scope.fitnessChartData = $scope.generateFitnessGraphData($scope.fitnessData, fromTimestamp, toTimestamp);

            $scope.configureGraph();
        };

        $scope.drawLegendSquare = (color: string, width: number, text: string) => {
            return '<span style="width: ' + width + 'px; height: ' + width + 'px; border: 1px solid grey; background-color: ' + color + '; vertical-align: middle;"></span> <span style="vertical-align: middle;">' + text + '</span>';
        };
        $scope.drawHtmlSeparator = () => {
            return '<div style="width: 100%; border-bottom: 1px solid ' + $colors.lightGrey + '; padding-bottom: 3px; padding-top: 3px;"></div>';
        };

        $scope.getTrainingZone = (tsb: number) => {

            let trainingZone: ITrainingZone = {
                level: null,
                name: null,
                color: null
            };

            if (tsb > 25) {
                trainingZone.level = 2;
                trainingZone.name = 'Transition';
                trainingZone.color = '#00b40c';
            } else if (25 >= tsb && tsb > 5) {
                trainingZone.level = 1;
                trainingZone.name = 'Freshness';
                trainingZone.color = '#00b40c';
            } else if (5 >= tsb && tsb > -10) {
                trainingZone.level = 0;
                trainingZone.name = 'Neutral';
                trainingZone.color = '#00acf8';
            } else if (-10 >= tsb && tsb > -30) {
                trainingZone.level = -1;
                trainingZone.name = 'Optimal';
                trainingZone.color = '#ffa300';
            } else if (-30 >= tsb) {
                trainingZone.level = -2;
                trainingZone.name = 'Over Load';
                trainingZone.color = '#ff001f';
            }

            return trainingZone;
        };

        $scope.makeTooltip = (d: any) => {

            let fitnessObject: IFitnessActivity = <IFitnessActivity> (_.findWhere($scope.fitnessData, {
                timestamp: d.value
            }));

            let hasActivities: boolean = (fitnessObject.activitiesName.length) ? true : false;

            let trainingZone: ITrainingZone = $scope.getTrainingZone(fitnessObject.tsb);

            let html: string = '';

            html += '<table class="trendGraphTooltipTable" style="color: ' + $colors.midGrey + ';">';

            // Title
            html += '   <tr>';
            html += '       <td colspan="3" class="dayType underlined" style="color: ' + (hasActivities ? $colors.strava : $colors.midGrey) + ';">' + ((fitnessObject.previewDay) ? 'PREVIEW' : (hasActivities ? 'ACTIVE' : 'REST')) + '</td>';
            html += '   </tr>';

            // Names
            if (hasActivities) {
                html += '   <tr>';
                html += '       <td class="title" style="vertical-align: top;">Name</td>';
                html += '       <td colspan="2" style="white-space:pre-wrap ; word-wrap:break-word;">' + fitnessObject.activitiesName + '</td>';
                html += '   </tr>';
            }

            // Type
            if (hasActivities) {
                html += '   <tr>';
                html += '       <td class="title">Type</td>';
                html += '       <td colspan="2">' + fitnessObject.type + '</td>';
                html += '   </tr>';
            }

            // Date
            html += '   <tr>';
            html += '       <td class="title underlined">Date</td>';
            html += '       <td class="underlined" colspan="2">' + moment(d.point.x).format('MMMM Do YYYY') + '</td>';
            html += '   </tr>';

            if (hasActivities) {

                html += '   <tr>';
                html += '       <td class="title"></td>';
                html += '       <td class="" colspan="2"></td>';
                html += '   </tr>';

                if (fitnessObject.trimpScore > 0) {
                    html += '   <tr>';
                    html += '       <td class="title">TRIMP</td>';
                    html += '       <td>' + fitnessObject.trimpScore.toFixed(0) + '</td>';
                    html += '   </tr>';
                }

                if (fitnessObject.powerStressScore > 0) {
                    html += '   <tr>';
                    html += '       <td class="title">PSS</td>';
                    html += '       <td>' + fitnessObject.powerStressScore.toFixed(0) + '</td>';
                    html += '   </tr>';
                }


                if (fitnessObject.swimStressScore > 0) {
                    html += '   <tr>';
                    html += '       <td class="title">Swim Score</td>';
                    html += '       <td>' + fitnessObject.swimStressScore.toFixed(0) + '</td>';
                    html += '   </tr>';
                }

                if (fitnessObject.finalStressScore > 0) {
                    html += '   <tr>';
                    html += '       <td class="title">Final Stress</td>';
                    html += '       <td>' + fitnessObject.finalStressScore.toFixed(0) + '</td>';
                    html += '   </tr>';
                }

                html += '   <tr>';
                html += '       <td class="title underlined"></td>';
                html += '       <td class="underlined" colspan="2"></td>';
                html += '   </tr>';
            }

            // Type
            html += '   <tr>';
            html += '       <td class="title" colspan="2">' + $scope.drawLegendSquare($colors.ctl, 10, 'FITNESS') + '</td>';
            html += '       <td>' + fitnessObject.ctl.toFixed(1) + '</td>';
            html += '   </tr>';
            html += '   <tr>';
            html += '       <td class="title" colspan="2">' + $scope.drawLegendSquare($colors.atl, 10, 'FATIGUE') + '</td>';
            html += '       <td>' + fitnessObject.atl.toFixed(1) + '</td>';
            html += '   </tr>';
            html += '   <tr>';
            html += '       <td class="title" colspan="2">' + $scope.drawLegendSquare($colors.tsb, 10, 'FORM') + '</td>';
            html += '       <td class="">' + fitnessObject.tsb.toFixed(1) + ' @ <span style="color: ' + trainingZone.color + ';">' + trainingZone.name.toUpperCase() + '</span>' + '</td>';
            html += '   </tr>';

            // html += '   <tr>';
            // html += '       <td class="title" colspan="2">Training Zone</td>';
            // html += '       <td style="color: ' + trainingZone.color + ';">' + trainingZone.name.toUpperCase() + '</td>';
            // html += '   </tr>';

            // Hint
            if (hasActivities) {
                html += '   <tr>';
                html += '       <td class="underlined" colspan="3"></td>';
                html += '   </tr>';
                html += '   <tr>';
                html += '       <td colspan="3" class="hint"><i>Hint: Click to open activities</i></td>';
                html += '   </tr>';
            }

            html += '</table>';

            return html;
        };

        $scope.configureGraph = () => {

            console.log('Configure graph options');

            $scope.fitnessChartOptions = {

                chart: {
                    type: 'lineWithFocusChart',
                    height: window.innerHeight * 0.65,
                    showLegend: false,
                    margin: {
                        top: 20,
                        right: 50,
                        bottom: 80,
                        left: 50
                    },
                    yDomain: $scope.fitnessChartData.yDomain,
                    x: (d: any) => {
                        return d.x;
                    },
                    y: (d: any) => {
                        return d.y;
                    },
                    dispatch: {
                        stateChange: (e: any) => {
                            console.log("stateChange");
                        },
                        changeState: (e: any) => {
                        },
                        tooltipShow: (e: any) => {
                            console.log("tooltipShow");
                        },
                        tooltipHide: (e: any) => {
                            console.log("tooltipHide");
                        },
                    },
                    lines: {
                        dispatch: {
                            elementClick: function (d: any) {
                                // Open activities on point click
                                let fitnessObject: IFitnessActivity = <IFitnessActivity> (_.findWhere($scope.fitnessData, {
                                    timestamp: d.point.x
                                }));

                                _.each(fitnessObject.ids, (activityId: number) => {
                                    $window.open('https://www.strava.com/activities/' + activityId, '_blank');
                                });
                            }
                        }
                    },
                    interactive: true,
                    tooltip: {
                        enabled: true,
                        hideDelay: 500,
                        contentGenerator: (d: any) => {
                            return $scope.makeTooltip(d);
                        }
                    },
                    xAxis: {
                        ticks: 12,
                        tickFormat: (d: any) => {
                            return (new Date(d)).toLocaleDateString();
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
                    y2Axis: {
                        tickFormat: (d: any) => {
                            return d3.format('.01f')(d);
                        },
                    },
                    x2Axis: {
                        ticks: 10,
                        tickFormat: (d: any) => {
                            return; //(new Date(d)).toLocaleDateString();
                        },
                        // tickSize:[100, 100],
                        tickPadding: 15,
                        // padding: {
                        //     top: 20,
                        //     right: 50,
                        //     bottom: 80,
                        //     left: 50
                        // },
                        // staggerLabels: true,
                        // axisLabelDistance: -10,
                        // height: 150
                    },
                    callback: (chart: any) => {

                        // Disable "clicks" enable/disable curves on legend
                        chart.legend.updateState(false);

                        $scope.onGraphDrawn();
                    },
                }
            };

        };

        $scope.generateFitnessGraphData = (fitnessData: Array<IFitnessActivity>, fromTimestamp: number, toTimestamp: number) => {

            let ctlValues: Array<any> = [];
            let atlValues: Array<any> = [];
            let tsbValues: Array<any> = [];
            let activitiesPoints: Array<any> = [];

            // Constants training zones
            let freshness_zone_points: Array<any> = [];
            let neutral_zone_points: Array<any> = [];
            let optimal_zone_points: Array<any> = [];
            let overtrain_zone_points: Array<any> = [];

            _.each(fitnessData, (fitData: IFitnessActivity) => {

                if (!fitData.previewDay && fitData.timestamp >= fromTimestamp && fitData.timestamp <= toTimestamp) {

                    ctlValues.push({
                        x: fitData.timestamp,
                        y: fitData.ctl
                    });

                    atlValues.push({
                        x: fitData.timestamp,
                        y: fitData.atl
                    });

                    tsbValues.push({
                        x: fitData.timestamp,
                        y: fitData.tsb
                    });

                    if (fitData.activitiesName.length > 0) {
                        activitiesPoints.push({
                            x: fitData.timestamp,
                            y: 0
                        });
                    }

                    // Constants training zones
                    freshness_zone_points.push({
                        x: fitData.timestamp,
                        y: 25
                    });
                    neutral_zone_points.push({
                        x: fitData.timestamp,
                        y: 5
                    });
                    optimal_zone_points.push({
                        x: fitData.timestamp,
                        y: -10
                    });
                    overtrain_zone_points.push({
                        x: fitData.timestamp,
                        y: -30
                    });
                }
            });

            // Adding days of preview (CTL + ATL + TSB dashed) after if toTimestamp is today
            let ctlPreviewValues: Array<any> = [];
            let atlPreviewValues: Array<any> = [];
            let tsbPreviewValues: Array<any> = [];

            let fitnessDataPreview: Array<IFitnessActivity> = _.where(fitnessData, {
                previewDay: true
            });

            // If "toTimestamp" is today
            // We add preview curves...
            if (moment(toTimestamp).format('YYYYMMDD') === moment().format('YYYYMMDD')) {

                _.each(fitnessDataPreview, (fitData: IFitnessActivity) => {

                    ctlPreviewValues.push({
                        x: fitData.timestamp,
                        y: fitData.ctl
                    });

                    atlPreviewValues.push({
                        x: fitData.timestamp,
                        y: fitData.atl
                    });

                    tsbPreviewValues.push({
                        x: fitData.timestamp,
                        y: fitData.tsb
                    });

                    // Constants training zones
                    if ($scope.showTrainingZone) {
                        freshness_zone_points.push({
                            x: fitData.timestamp,
                            y: 25
                        });
                        neutral_zone_points.push({
                            x: fitData.timestamp,
                            y: 5
                        });
                        optimal_zone_points.push({
                            x: fitData.timestamp,
                            y: -10
                        });
                        overtrain_zone_points.push({
                            x: fitData.timestamp,
                            y: -30
                        });
                    }

                });
            }

            // Find min/max of curves
            let yDomainMax = d3.max([
                d3.max(ctlValues, (d: any) => {
                    return parseInt(d.y);
                }),
                d3.max(atlValues, (d: any) => {
                    return parseInt(d.y);
                }),
                d3.max(tsbValues, (d: any) => {
                    return parseInt(d.y);
                }),
                d3.max(ctlPreviewValues, (d: any) => {
                    return parseInt(d.y);
                }),
                d3.max(atlPreviewValues, (d: any) => {
                    return parseInt(d.y);
                }),
                d3.max(tsbPreviewValues, (d: any) => {
                    return parseInt(d.y);
                })
            ], (d: any) => {
                return d;
            });

            let yDomainMin = d3.min([
                d3.min(ctlValues, (d: any) => {
                    return parseInt(d.y);
                }),
                d3.min(atlValues, (d: any) => {
                    return parseInt(d.y);
                }),
                d3.min(tsbValues, (d: any) => {
                    return parseInt(d.y);
                }),
                d3.min(ctlPreviewValues, (d: any) => {
                    return parseInt(d.y);
                }),
                d3.min(atlPreviewValues, (d: any) => {
                    return parseInt(d.y);
                }),
                d3.min(tsbPreviewValues, (d: any) => {
                    return parseInt(d.y);
                })
            ], (d: any) => {
                return d;
            });

            let fitnessGraphData: IFitnessGraphData = {
                curves: [{
                    key: "Fatigue/ATL",
                    values: atlValues,
                    color: $colors.atl
                }, {
                    key: "Form/TSB",
                    values: tsbValues,
                    color: $colors.tsb,
                    area: true
                }, {
                    key: "Fitness/CTL",
                    values: ctlValues,
                    color: $colors.ctl,
                }, {
                    key: "Active days",
                    values: activitiesPoints,
                    color: $colors.strongGrey
                }, {
                    key: "Preview_ATL",
                    values: atlPreviewValues,
                    color: $colors.atl
                }, {
                    key: "Preview_TSB",
                    values: tsbPreviewValues,
                    color: $colors.tsb
                }, {
                    key: "Preview_CTL",
                    values: ctlPreviewValues,
                    color: $colors.ctl
                }],
                yDomain: [yDomainMin * 1.05, yDomainMax * 1.05]
            };

            if ($scope.showTrainingZone) {
                fitnessGraphData.curves = _.union(fitnessGraphData.curves, [{
                    key: "freshness_zone_points",
                    values: freshness_zone_points,
                    color: '#00b40c'
                }, {
                    key: "neutral_zone_points",
                    values: neutral_zone_points,
                    color: '#00acf8'
                }, {
                    key: "optimal_zone_points",
                    values: optimal_zone_points,
                    color: '#ffa300'
                }, {
                    key: "overtrain_zone_points",
                    values: overtrain_zone_points,
                    color: '#ff001f'
                }]);
            }

            return fitnessGraphData;
        };

        $scope.onGraphDrawn = () => {

            onGraphDrawnTimeDone = performance.now(); // Track graph draw time on done
            console.log("Generating Fitness Graph took " + (onGraphDrawnTimeDone - onGraphDrawTimeStart).toFixed(0) + " ms.");

            setTimeout(() => {
                $scope.nvd3api.update();
            });
        };

        $scope.showHelp = () => {
            $mdDialog.show({
                controller: ($scope: any) => {
                    $scope.hide = () => {
                        $mdDialog.hide();
                    };
                },
                templateUrl: 'directives/fitnessTrend/templates/fitnessHelper.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        // This fix as "workaround" graph cropped when sidebar show/hide. Listen events broadcasted by "$broadcast('window-resize-gt-md');"
        // Better solution?!
        $scope.$on('window-resize-gt-md', () => {
            // Send fake js window resize to make sure graph is re-drawn (to avoid cropping by sidebar) over a window resize around gt-md.
            $scope.nvd3api.update();
        });
    }
}

app.directive('fitnessTrendGraph', [() => {
    return {
        templateUrl: 'directives/fitnessTrend/templates/fitnessTrendGraph.html',
        controller: FitnessTrendGraph
    };
}]);

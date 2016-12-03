interface IFitnessTrendGraphScope extends IScope {
    colors: IColors;
    fitnessDataOnToday: IFitnessTrimpObject;
    makeTooltip: (d: any) => string;
    drawHtmlSeparator: () => string;
    drawLegendSquare: (color: string, width: number, text: string) => string;
    displayOnFirstDrawn: boolean;
    onGraphDrawn: () => void;
    lastSyncDate: number;
    toDate: Date;
    fromDate: Date;
    fitnessData: Array<IFitnessTrimpObject>;
    maxDate: Date;
    minDate: Date;
    generateFitnessGraphData: (fitnessData: Array<IFitnessTrimpObject>, fromTimestamp: number, toTimestamp: number) => IFitnessGraphData;
    generateGraph: () => void;
    updateFitnessChartGraph: (lastMonthPeriodChange: boolean, fromOrToDateChange: boolean) => void;
    toDateChanged: () => void;
    fromDateChanged: () => void;
    lastMonthsPeriodChanged: () => void;
    periodSelected: {days: Number, label: String};
    periodsToWatch: {days: Number, label: String}[];
    activityTypes: Array<string>;
    fitnessChartOptions: any;
    fitnessChartData: IFitnessGraphData;
    fitnessTrendGraphDataLoaded: (hasFitnessData: boolean) => void; // coming from $parent
    showHelp: () => void;
}

interface IFitnessGraphData {
    curves: {key: string, values: Array<any>, color: string, area?: boolean, classed?: string}[];
    yDomain: Array<number>;
}

class FitnessTrendGraph {

    static $inject: string[] = ['$scope', 'FitnessDataService', '$colors', '$window', '$mdDialog'];

    constructor(public $scope: IFitnessTrendGraphScope, public fitnessDataService: IFitnessDataService, public $colors: IColors, public $window: IWindowService, public $mdDialog: IDialogService) {

        let onGraphDrawTimeStart: number;
        let onGraphDrawnTimeDone: number;

        $scope.displayOnFirstDrawn = false;
        $scope.colors = $colors;

        fitnessDataService.getFitnessData().then((fitnessData: Array<IFitnessTrimpObject>) => {

            $scope.fitnessData = fitnessData;

            $scope.fitnessDataOnToday = _.last(_.where($scope.fitnessData, {
                previewDay: false
            }));

            // Notify parent of data loaded
            $scope.fitnessTrendGraphDataLoaded(!_.isEmpty($scope.fitnessData));

            // Handle uniques activity types for selection in UI
            // $scope.activityTypes = _.uniq(_.flatten(_.pluck($scope.fitnessData, 'type')));

            setTimeout(() => { // Postpone execution at the end
                $scope.updateFitnessChartGraph(true, false);
            });

        });

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

        $scope.periodSelected = $scope.periodsToWatch[5]; // 6 months default

        $scope.lastMonthsPeriodChanged = () => {
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

            $scope.generateGraph();
        };

        $scope.drawLegendSquare = (color: string, width: number, text: string) => {
            return '<span style="width: ' + width + 'px; height: ' + width + 'px; border: 1px solid grey; background-color: ' + color + '; vertical-align: middle;"></span> <span style="vertical-align: middle;">' + text + '</span>';
        };
        $scope.drawHtmlSeparator = () => {
            return '<div style="width: 100%; border-bottom: 1px solid ' + $colors.lightGrey + '; padding-bottom: 3px; padding-top: 3px;"></div>';
        };

        $scope.makeTooltip = (d: any) => {

            let fitnessObject: IFitnessTrimpObject = <IFitnessTrimpObject> (_.findWhere($scope.fitnessData, {
                timestamp: d.value
            }));

            let hasActivities: boolean = (fitnessObject.activitiesName.length) ? true : false;

            let html: string = '';

            html += '<table class="trendGraphTooltipTable" style="color: ' + $colors.midGrey + ';">';

            // Title
            html += '   <tr>';
            html += '       <td colspan="3" class="dayType underlined" style="color: ' + (hasActivities ? $colors.strava : $colors.midGrey) + ';">' + ((fitnessObject.previewDay) ? 'PREVIEW' : (hasActivities ? 'ACTIVE' : 'REST')) + '</td>';
            html += '   </tr>';

            // Names
            if (hasActivities) {
                html += '   <tr>';
                html += '       <td class="title">Name</td>';
                html += '       <td colspan="2">' + fitnessObject.activitiesName + '</td>';
                html += '   </tr>';
            }

            // Type
            if (hasActivities) {
                html += '   <tr>';
                html += '       <td class="title">Type</td>';
                html += '       <td colspan="2">' + fitnessObject.type + '</td>';
                html += '   </tr>';
            }


            if (hasActivities) {
                html += '   <tr>';
                html += '       <td class="title" colspan="2">TRIMP</td>';
                html += '       <td >' + fitnessObject.trimp + '</td>';
                html += '   </tr>';
            }

            // Date
            html += '   <tr>';
            html += '       <td class="title underlined">Date</td>';
            html += '       <td class="underlined" colspan="2">' + moment(d.point.x).format('MMMM Do YYYY') + '</td>';
            html += '   </tr>';

            // Type
            html += '   <tr>';
            html += '       <td class="title" colspan="2">' + $scope.drawLegendSquare($colors.ctl, 10, 'FITNESS') + '</td>';
            html += '       <td>' + fitnessObject.ctl + '</td>';
            html += '   </tr>';
            html += '   <tr>';
            html += '       <td class="title" colspan="2">' + $scope.drawLegendSquare($colors.atl, 10, 'FATIGUE') + '</td>';
            html += '       <td>' + fitnessObject.atl + '</td>';
            html += '   </tr>';
            html += '   <tr>';
            html += '       <td class="title" colspan="2">' + $scope.drawLegendSquare($colors.tsb, 10, 'FORM') + '</td>';
            html += '       <td>' + fitnessObject.tsb + '</td>';
            html += '   </tr>';

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

        $scope.generateGraph = () => {

            $scope.fitnessChartOptions = {

                chart: {
                    type: 'lineWithFocusChart',
                    height: window.innerHeight * 0.58,
                    // height: window.innerHeight * 0.65, // When alpha feature is not enabled
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
                                let fitnessObject: IFitnessTrimpObject = <IFitnessTrimpObject> (_.findWhere($scope.fitnessData, {
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

        $scope.generateFitnessGraphData = (fitnessData: Array<IFitnessTrimpObject>, fromTimestamp: number, toTimestamp: number) => {

            let ctlValues: Array<any> = [];
            let atlValues: Array<any> = [];
            let tsbValues: Array<any> = [];
            let activitiesPoints: Array<any> = [];

            _.each(fitnessData, (fitData: IFitnessTrimpObject) => {

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
                }
            });

            // Adding days of preview (CTL + ATL + TSB dashed) after if toTimestamp is today
            let ctlPreviewValues: Array<any> = [];
            let atlPreviewValues: Array<any> = [];
            let tsbPreviewValues: Array<any> = [];

            let fitnessDataPreview: Array<IFitnessTrimpObject> = _.where(fitnessData, {
                previewDay: true
            });

            // If "toTimestamp" is today
            // We add preview curves...
            if(moment(toTimestamp).format('YYYYMMDD') === moment().format('YYYYMMDD')) {

                _.each(fitnessDataPreview, (fitData: IFitnessTrimpObject) => {

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
                    key: "Fitness/CTL",
                    values: ctlValues,
                    color: $colors.ctl,
                }, {
                    key: "Fatigue/ATL",
                    values: atlValues,
                    color: $colors.atl
                }, {
                    key: "Form/TSB",
                    values: tsbValues,
                    color: $colors.tsb,
                    area: true
                }, {
                    key: "Active days",
                    values: activitiesPoints,
                    color: $colors.strongGrey
                }, {
                    key: "Preview_CTL",
                    values: ctlPreviewValues,
                    color: $colors.ctl
                }, {
                    key: "Preview_ATL",
                    values: atlPreviewValues,
                    color: $colors.atl
                }, {
                    key: "Preview_TSB",
                    values: tsbPreviewValues,
                    color: $colors.tsb
                }],
                yDomain: [yDomainMin * 1.05, yDomainMax * 1.05]
            };

            return fitnessGraphData;
        };

        $scope.onGraphDrawn = () => {

            $scope.displayOnFirstDrawn = true;
            $scope.$apply();

            onGraphDrawnTimeDone = performance.now(); // Track graph draw time on done
            console.log("Generating Fitness Graph took " + (onGraphDrawnTimeDone - onGraphDrawTimeStart).toFixed(0) + " ms.");

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
            $window.dispatchEvent(new Event('resize'));
        });
    }
}

app.directive('fitnessTrendGraph', [() => {
    return {
        templateUrl: 'directives/fitnessTrend/templates/fitnessTrendGraph.html',
        controller: FitnessTrendGraph
    };
}]);

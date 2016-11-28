class RunningExtendedDataModifier extends AbstractExtendedDataModifier {

    constructor(activityProcessor: ActivityProcessor, activityId: number, activityType: string, appResources: IAppResources, userSettings: IUserSettings, athleteId: number, athleteIdAuthorOfActivity: number, basicInfos: any, type: number) {
        super(activityProcessor, activityId, activityType, appResources, userSettings, athleteId, athleteIdAuthorOfActivity, basicInfos, type);
    }

    protected insertContentSummaryGridContent(): void {

        super.insertContentSummaryGridContent();

        // Speed and pace
        let q3Move: string = '-';
        if (this.analysisData.paceData && this.userSettings.displayAdvancedSpeedData) {
            q3Move = Helper.secondsToHHMMSS(this.analysisData.paceData.upperQuartilePace / this.speedUnitsData.speedUnitFactor, true);
            this.insertContentAtGridPosition(1, 0, q3Move, '75% Quartile Pace', '/' + this.speedUnitsData.units, 'displayAdvancedSpeedData');
        }

        // Avg climb pace
        let climbPaceDisplayed: string = '-';
        if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {

            // Convert speed to pace
            let avgClimbPace: number = this.convertSpeedToPace(this.analysisData.gradeData.upFlatDownMoveData.up);

            if (avgClimbPace !== -1) {
                // let seconds: number = parseInt((avgClimbPace / speedUnitFactor).toFixed(0));
                let seconds: number = avgClimbPace / this.speedUnitsData.speedUnitFactor;// / speedUnitFactor).toFixed(0));
                if (seconds) {
                    climbPaceDisplayed = Helper.secondsToHHMMSS(seconds, true);
                }
            }

            this.insertContentAtGridPosition(1, 2, climbPaceDisplayed, 'Avg climbing pace', '/' + this.speedUnitsData.units, 'displayAdvancedGradeData');
        }
    }


    protected placeSummaryPanel(panelAdded: () => void): void {
        this.makeSummaryGrid(2, 3);
        super.placeSummaryPanel(panelAdded);
    }


    protected placeExtendedStatsButtonSegment(buttonAdded: ()=>void): void {

        setTimeout(() => { // Execute at the end to make sure DOM is ready
            let htmlButton: string = '<section>';
            htmlButton += '<a class="btn-block btn-xs button raceshape-btn btn-primary" data-xtd-seg-effort-stats id="' + this.segmentEffortButtonId + '">';
            htmlButton += 'Show extended statistics of effort';
            htmlButton += '</a>';
            htmlButton += '</section>';

            if ($('[data-xtd-seg-effort-stats]').length === 0) {
                $('.leaderboard-summary').after(htmlButton).each(() => {
                    super.placeExtendedStatsButtonSegment(buttonAdded);
                });
            }
        });
    }

    protected setDataViewsNeeded(): void {

        super.setDataViewsNeeded();

        // Pace view
        if (this.analysisData.paceData && this.userSettings.displayAdvancedSpeedData) {

            let measurementPreference: string = window.currentAthlete.get('measurement_preference');
            let units: string = (measurementPreference == 'meters') ? '/km' : '/mi';

            let paceDataView: PaceDataView = new PaceDataView(this.analysisData.paceData, units);
            paceDataView.setAppResources(this.appResources);
            paceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            paceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(paceDataView);
        }

        if (this.analysisData.cadenceData && this.userSettings.displayCadenceData) {
            let runningCadenceDataView: RunningCadenceDataView = new RunningCadenceDataView(this.analysisData.cadenceData, 'spm', this.userSettings);
            runningCadenceDataView.setAppResources(this.appResources);
            runningCadenceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            runningCadenceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(runningCadenceDataView);
        }

        if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
            let runningGradeDataView: RunningGradeDataView = new RunningGradeDataView(this.analysisData.gradeData, '%');
            runningGradeDataView.setAppResources(this.appResources);
            runningGradeDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            runningGradeDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(runningGradeDataView);
        }

        if (this.analysisData.elevationData && this.userSettings.displayAdvancedElevationData) {
            let elevationDataView: ElevationDataView = new ElevationDataView(this.analysisData.elevationData, 'm');
            elevationDataView.setAppResources(this.appResources);
            elevationDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            elevationDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(elevationDataView);
        }
    }
}


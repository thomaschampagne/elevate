class FeaturedDataView extends AbstractDataView {

    protected analysisData: IAnalysisData;
    protected basicInfo: IActivityBasicInfo;
    protected userSettings: IUserSettings;

    constructor(analysisData: IAnalysisData, userSettings: IUserSettings, basicInfo: any) {

        super(null);
        this.hasGraph = false;
        this.analysisData = analysisData;
        this.userSettings = userSettings;
        this.basicInfo = basicInfo;

        if (!this.analysisData || !this.userSettings) {
            console.error('analysisData and userSettings are required');
        }

        if (this.isSegmentEffortView && !_.isEmpty(this.basicInfo.segmentEffort)) {
            this.mainColor = [252, 76, 2];
        }
    }

    public render(): void {

        if (this.analysisData.moveRatio && this.userSettings.displayActivityRatio ||
            this.analysisData.toughnessScore && this.userSettings.displayMotivationScore ||
            this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData ||
            this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData ||
            this.analysisData.powerData && this.userSettings.displayAdvancedPowerData ||
            this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {

            let title: string = '<img src="' + this.appResources.lightbulbIcon + '" style="vertical-align: baseline; height:20px;"/>';

            if (this.isSegmentEffortView && !_.isEmpty(this.basicInfo.segmentEffort)) { // Segment effort only
                title += ' EFFORT STATS on <i>&lt;' + this.basicInfo.segmentEffort.name + '&gt;</i> SEGMENT // TIME ' + Helper.secondsToHHMMSS(this.basicInfo.segmentEffort.elapsedTimeSec);
                this.content += this.generateSectionTitle(title);
            } else { // Complete activity
                title += ' STATS on <i>&lt;' + this.basicInfo.activityName + '&gt;</i> ACTIVITY';
                this.content += this.generateSectionTitle(title);
            }

            // Add a title
            this.makeGrid(7, 1); // (col, row)

            this.insertDataIntoGrid();

            this.content += '<div class="featuredData">' + this.grid.html() + '</div>';
        }
    }

    protected insertDataIntoGrid(): void {

        let speedUnitsData: ISpeedUnitData = Helper.getSpeedUnitData();

        if (this.analysisData.moveRatio && this.userSettings.displayActivityRatio && _.isEmpty(this.basicInfo.segmentEffort)) {
            this.insertContentAtGridPosition(0, 0, this.analysisData.moveRatio.toFixed(2), 'Move Ratio', '', 'displayActivityRatio'); // Move ratio
        }

        if (this.analysisData.toughnessScore && this.userSettings.displayMotivationScore) {
            this.insertContentAtGridPosition(1, 0, this.analysisData.toughnessScore.toFixed(0), 'Toughness Factor', '', 'displayMotivationScore'); // Toughness score
        }

        if (this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData) {
            this.insertContentAtGridPosition(2, 0, (this.analysisData.speedData.upperQuartileSpeed * speedUnitsData.speedUnitFactor).toFixed(1), '75% Quartile Speed', speedUnitsData.speedUnitPerHour, 'displayAdvancedSpeedData'); // Q3 Speed
        }

        if (this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData) {
            this.insertContentAtGridPosition(3, 0, this.analysisData.heartRateData.TRIMP.toFixed(0), 'TRaining IMPulse', '', 'displayAdvancedHrData');
            this.insertContentAtGridPosition(4, 0, this.analysisData.heartRateData.activityHeartRateReserve.toFixed(0), 'Heart Rate Reserve Avg', '%', 'displayAdvancedHrData');
        }

        if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData && this.analysisData.powerData.weightedWattsPerKg) {
            this.insertContentAtGridPosition(5, 0, this.analysisData.powerData.weightedWattsPerKg.toFixed(2), 'Weighted Watts/kg', 'w/kg', 'displayAdvancedPowerData'); // Avg watt /kg
        }

        if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
            this.insertContentAtGridPosition(6, 0, this.analysisData.gradeData.gradeProfile, 'Grade Profile', '', 'displayAdvancedGradeData');
        }

        // Remove empty case in grid. This avoid unwanted padding on feature view rendering
        this.grid.find('td:empty').remove();
    }
}


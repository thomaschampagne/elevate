var FeaturedDataView = AbstractDataView.extend(function(base) {

    return {

        analysisData: null,

        init: function(analysisData, userSettings, basicInfos) {

            this.setViewId('FeaturedDataView_0as19sdqfd7f98q');

            base.init.call(this);

            this.hasGraph = false;

            if (!analysisData || !userSettings) {
                console.error('analysisData and userSettings are required');
            }

            this.analysisData = analysisData;

            this.userSettings = userSettings;

            this.basicInfos = basicInfos;
        },

        render: function() {

            base.render.call(this);

            if (this.analysisData.moveRatio && this.userSettings.displayActivityRatio ||
                this.analysisData.toughnessScore && this.userSettings.displayMotivationScore ||
                this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData ||
                this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData ||
                this.analysisData.powerData && this.userSettings.displayAdvancedPowerData ||
                this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {

                if (this.isSegmentEffortView && !_.isEmpty(this.basicInfos.segmentEffort)) { // Segment effort only
                    this.content += this.generateSectionTitle('<img src="' + this.appResources.lightbulbIcon + '" style="vertical-align: baseline; height:20px;"/> SEGMENT EFFORT STATS on ' + ' <i>"' + this.basicInfos.segmentEffort.name + '"</i> // TIME ' + Helper.secondsToHHMMSS(this.basicInfos.segmentEffort.elapsedTimeSec) + ' // ACTIVITY "' + this.basicInfos.activityName + '"');
                } else { // Complete activity
                    this.content += this.generateSectionTitle('<img src="' + this.appResources.lightbulbIcon + '" style="vertical-align: baseline; height:20px;"/> HIGHLIGHTED STATS for ' + ' <i>"' + this.basicInfos.activityName + '" @ ' + this.basicInfos.activityTime + "</i>");
                }

                // Add a title
                this.makeGrid(7, 1); // (col, row)

                this.insertFeaturedDataIntoGrid();

                this.content += '<div class="featuredData">' + this.grid.html() + '</div>';
            }
        },

        insertFeaturedDataIntoGrid: function() {

            var speedUnitsData = this.getSpeedUnitData();
            var speedUnitPerhour = speedUnitsData[0];
            var speedUnitFactor = speedUnitsData[1];

            if (this.analysisData.moveRatio && this.userSettings.displayActivityRatio && _.isEmpty(this.basicInfos.segmentEffort)) {
                this.insertContentAtGridPosition(0, 0, this.analysisData.moveRatio.toFixed(2), 'Move Ratio', '', 'displayActivityRatio'); // Move ratio
            }

            if (this.analysisData.toughnessScore && this.userSettings.displayMotivationScore) {
                this.insertContentAtGridPosition(1, 0, this.analysisData.toughnessScore.toFixed(0), 'Toughness Factor', '', 'displayMotivationScore'); // Toughness score
            }

            if (this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData) {
                this.insertContentAtGridPosition(2, 0, (this.analysisData.speedData.upperQuartileSpeed * speedUnitFactor).toFixed(1), '75% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData'); // Q3 Speed
            }

            if (this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData) {
                this.insertContentAtGridPosition(3, 0, this.analysisData.heartRateData.TRIMP.toFixed(0), 'TRaining IMPulse', '', 'displayAdvancedHrData');
                this.insertContentAtGridPosition(4, 0, this.analysisData.heartRateData.activityHeartRateReserve.toFixed(0), 'Heart Rate Reserve Avg', '%', 'displayAdvancedHrData');
            }

            if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData) {
                this.insertContentAtGridPosition(5, 0, this.analysisData.powerData.weightedWattsPerKg.toFixed(2), 'Weighted Watts/kg', 'w/kg', 'displayAdvancedPowerData'); // Avg watt /kg
            }

            if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
                this.insertContentAtGridPosition(6, 0, this.analysisData.gradeData.gradeProfile, 'Grade Profile', '', 'displayAdvancedGradeData');
            }

            // Remove empty case in grid. This avoid unwanted padding on feature view rendering
            this.grid.find('td:empty').remove();
        }
    }
});

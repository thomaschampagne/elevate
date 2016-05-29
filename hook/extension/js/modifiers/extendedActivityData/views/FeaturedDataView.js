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

            if (this.isSegmentEffortView && !_.isEmpty(this.basicInfos.segmentEffort)) {
                this.mainColor = [252, 76, 2];
            }
        },

        render: function() {

            base.render.call(this);

            if (this.analysisData.moveRatio && this.userSettings.displayActivityRatio ||
                this.analysisData.toughnessScore && this.userSettings.displayMotivationScore ||
                this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData ||
                this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData ||
                this.analysisData.powerData && this.userSettings.displayAdvancedPowerData ||
                this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {

                var title = '<img src="' + this.appResources.lightbulbIcon + '" style="vertical-align: baseline; height:20px;"/>';

                if (this.isSegmentEffortView && !_.isEmpty(this.basicInfos.segmentEffort)) { // Segment effort only
                    var transTitle = Helper.formatMessage(this.appResources.globalizeInstance, "extendedStats/feature_data/seg_effort_title", this.basicInfos.segmentEffort.name);
                    title += transTitle;
                    this.content += this.generateSectionTitle(title);
                } else { // Complete activity
                    var transTitle = Helper.formatMessage(this.appResources.globalizeInstance, "extendedStats/feature_data/section_title", this.basicInfos.activityName);
                    title += transTitle;
                    this.content += this.generateSectionTitle(title);
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
                this.insertContentAtGridPosition(0, 0, this.analysisData.moveRatio.toFixed(2), 'Move Ratio', '', 'displayActivityRatio', 'extendedStats/move_ratio'); // Move ratio
            }

            if (this.analysisData.toughnessScore && this.userSettings.displayMotivationScore) {
                this.insertContentAtGridPosition(1, 0, this.analysisData.toughnessScore.toFixed(0), 'Toughness Factor', '', 'displayMotivationScore', 'extendedStats/feature_data/tough_score'); // Toughness score
            }

            if (this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData) {
                this.insertContentAtGridPosition(2, 0, (this.analysisData.speedData.upperQuartileSpeed * speedUnitFactor).toFixed(1), '75% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData', 'extendedStats/75quartspeed'); // Q3 Speed
            }

            if (this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData) {
                this.insertContentAtGridPosition(3, 0, this.analysisData.heartRateData.TRIMP.toFixed(0), 'TRaining IMPulse', '', 'displayAdvancedHrData', 'extendedStats/trimp');
                this.insertContentAtGridPosition(4, 0, this.analysisData.heartRateData.activityHeartRateReserve.toFixed(0), 'Heart Rate Reserve Avg', '%', 'displayAdvancedHrData', 'extendedStats/heart_reserve_avg');
            }

            if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData) {
                this.insertContentAtGridPosition(5, 0, this.analysisData.powerData.weightedWattsPerKg.toFixed(2), 'Weighted Watts/kg', 'w/kg', 'displayAdvancedPowerData', 'extendedStats/feature_data/watt_kg'); // Avg watt /kg
            }

            if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
                this.insertContentAtGridPosition(6, 0, this.analysisData.gradeData.gradeProfile, 'Grade Profile', '', 'displayAdvancedGradeData', 'extendedStats/feature_data/grade_profile');
            }

            // Remove empty case in grid. This avoid unwanted padding on feature view rendering
            this.grid.find('td:empty').remove();
        }
    }
});

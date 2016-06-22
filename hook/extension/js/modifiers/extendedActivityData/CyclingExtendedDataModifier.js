var CyclingExtendedDataModifier = AbstractExtendedDataModifier.extend(function(base) {

    return {

        init: function(activityProcessor, activityId, activityType, appResources, userSettings, athleteId, athleteIdAuthorOfActivity, basicInfos, type) {
            base.init.call(this, activityProcessor, activityId, activityType, appResources, userSettings, athleteId, athleteIdAuthorOfActivity, basicInfos, type);
        },

        insertContentSummaryGridContent: function() {

            base.insertContentSummaryGridContent.call(this); // Super call

            var speedUnitPerhour = this.speedUnitsData[0];
            var speedUnitFactor = this.speedUnitsData[1];

            // Speed and pace
            var q3Move = '-';
            if (this.analysisData_.speedData && this.userSettings_.displayAdvancedSpeedData) {
                q3Move = (this.analysisData_.speedData.upperQuartileSpeed * speedUnitFactor).toFixed(1);
                this.insertContentAtGridPosition(1, 0, q3Move, '75% Quartile Speed', speedUnitPerhour + ' <span class="summarySubGridTitle">(&sigma; :' + (this.analysisData_.speedData.standardDeviationSpeed * speedUnitFactor).toFixed(1) + ' )</span>', 'displayAdvancedSpeedData');
            }

            // ...
            var climbSpeed = '-';
            if (this.analysisData_.gradeData && this.userSettings_.displayAdvancedGradeData) {
                climbSpeed = (this.analysisData_.gradeData.upFlatDownMoveData.up * speedUnitFactor).toFixed(1);
            }
            this.insertContentAtGridPosition(1, 2, climbSpeed, 'Avg climbing speed', speedUnitPerhour, 'displayAdvancedGradeData');

            // Cadence
            var medianCadence = '-';
            var standardDeviationCadence = '-';
            if (this.analysisData_.cadenceData && this.userSettings_.displayCadenceData) {
                medianCadence = this.analysisData_.cadenceData.medianCadence;
                standardDeviationCadence = this.analysisData_.cadenceData.standardDeviationCadence;
            }
            this.insertContentAtGridPosition(0, 3, medianCadence, 'Median Cadence', (standardDeviationCadence !== '-') ? ' rpm <span class="summarySubGridTitle">(&sigma; :' + standardDeviationCadence + ' )</span>' : '', 'displayCadenceData');

            var cadenceTimeMoving = '-';
            var cadencePercentageMoving = '-';
            if (this.analysisData_.cadenceData && this.userSettings_.displayCadenceData) {
                cadenceTimeMoving = Helper.secondsToHHMMSS(this.analysisData_.cadenceData.cadenceTimeMoving);
                cadencePercentageMoving = this.analysisData_.cadenceData.cadencePercentageMoving.toFixed(0);
            }
            this.insertContentAtGridPosition(1, 3, cadenceTimeMoving, 'Pedaling Time', (cadencePercentageMoving !== '-') ? ' <span class="summarySubGridTitle">(' + cadencePercentageMoving + '% of activity)</span>' : '', 'displayCadenceData');

            var weightedPower = '-';
            if (this.analysisData_.powerData && this.userSettings_.displayAdvancedPowerData) {
                weightedPower = this.analysisData_.powerData.weightedPower.toFixed(0);
                var labelWeightedPower = 'Weighted Avg Power';
                if (!this.analysisData_.powerData.hasPowerMeter) {
                    labelWeightedPower = 'Estimated ' + labelWeightedPower;
                }
                this.insertContentAtGridPosition(0, 4, weightedPower, labelWeightedPower, ' w <span class="summarySubGridTitle" style="font-size: 11px;">(Dr. A. Coggan formula)</span>', 'displayAdvancedPowerData');
            }

            var avgWattsPerKg = '-';
            if (this.analysisData_.powerData && this.userSettings_.displayAdvancedPowerData) {
                avgWattsPerKg = this.analysisData_.powerData.avgWattsPerKg.toFixed(2);
                var labelWKg = 'Watts Per Kilograms';
                if (!this.analysisData_.powerData.hasPowerMeter) {
                    labelWKg = 'Estimated ' + labelWKg;
                }
                this.insertContentAtGridPosition(1, 4, avgWattsPerKg, labelWKg, ' w/kg', 'displayAdvancedPowerData');
            }
        },

        placeSummaryPanel: function(panelAdded) {

            this.makeSummaryGrid(2, 6);

            base.placeSummaryPanel.call(this, panelAdded); // Super call
        },

        placeExtendedStatsButtonSegment: function(buttonAdded) {
            var htmlButton = '<section>';
            htmlButton += '<a class="btn-block btn-xs button raceshape-btn btn-primary" data-xtd-seg-effort-stats id="' + this.segmentEffortButtonId + '">';
            htmlButton += 'Show extended statistics of effort';
            htmlButton += '</a>';
            htmlButton += '</section>';

            if ($('[data-xtd-seg-effort-stats]').length === 0)  {
                $('.raceshape-btn').last().after(htmlButton).each(function() {
                    base.placeExtendedStatsButtonSegment.call(this, buttonAdded); // Super call
                }.bind(this));
            }
        },

        setDataViewsNeeded: function() {

            base.setDataViewsNeeded.call(this);

            // Speed view
            if (this.analysisData_.speedData && this.userSettings_.displayAdvancedSpeedData) {

                var measurementPreference = currentAthlete.get('measurement_preference');
                var units = (measurementPreference == 'meters') ? 'kph' : 'mph';

                var speedDataView = new SpeedDataView(this.analysisData_.speedData, units);
                speedDataView.setAppResources(this.appResources_);
                speedDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                speedDataView.setActivityType(this.activityType);
                speedDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
                this.dataViews.push(speedDataView);
            }

            if (this.analysisData_.powerData && this.userSettings_.displayAdvancedPowerData) {
                var powerDataView = new PowerDataView(this.analysisData_.powerData, 'w');
                powerDataView.setAppResources(this.appResources_);
                powerDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                powerDataView.setActivityType(this.activityType);
                powerDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
                this.dataViews.push(powerDataView);
            }

            if (this.analysisData_.cadenceData && this.userSettings_.displayCadenceData) {
                var cyclingCadenceDataView = new CyclingCadenceDataView(this.analysisData_.cadenceData, 'rpm');
                cyclingCadenceDataView.setAppResources(this.appResources_);
                cyclingCadenceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                cyclingCadenceDataView.setActivityType(this.activityType);
                cyclingCadenceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
                this.dataViews.push(cyclingCadenceDataView);
            }

            if (this.analysisData_.gradeData && this.userSettings_.displayAdvancedGradeData) {
                var cyclingGradeDataView = new CyclingGradeDataView(this.analysisData_.gradeData, '%');
                cyclingGradeDataView.setAppResources(this.appResources_);
                cyclingGradeDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                cyclingGradeDataView.setActivityType(this.activityType);
                cyclingGradeDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
                this.dataViews.push(cyclingGradeDataView);
            }

            if (this.analysisData_.elevationData && this.userSettings_.displayAdvancedElevationData) {
                var elevationDataView = new ElevationDataView(this.analysisData_.elevationData, 'm');
                elevationDataView.setAppResources(this.appResources_);
                elevationDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                elevationDataView.setActivityType(this.activityType);
                elevationDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
                this.dataViews.push(elevationDataView);

                if (this.analysisData_.elevationData.ascentSpeed && this.analysisData_.elevationData.ascentSpeedZones) {
                    var ascentSpeedDataView = new AscentSpeedDataView(this.analysisData_.elevationData, 'Vm/h');
                    ascentSpeedDataView.setAppResources(this.appResources_);
                    ascentSpeedDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                    ascentSpeedDataView.setActivityType(this.activityType);
                    this.dataViews.push(ascentSpeedDataView);
                }
            }

        }
    };
});

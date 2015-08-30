var AbstractExtendedActivityDataModifier = Fiber.extend(function(base) {

    return {

        content: '',

        isAuthorOfViewedActivity: null,

        dataViews: [],

        summaryGrid: null,

        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity, basicInfos) {

            this.analysisData_ = analysisData;
            this.appResources_ = appResources;
            this.userSettings_ = userSettings;
            this.athleteId_ = athleteId;
            this.athleteIdAuthorOfActivity_ = athleteIdAuthorOfActivity;
            this.basicInfos = basicInfos;

            this.isAuthorOfViewedActivity = (this.athleteIdAuthorOfActivity_ == this.athleteId_);

            this.speedUnitsData = this.getSpeedUnitData();

            this.setDataViewsNeeded();
        },


        modify: function() {

            _.each(this.dataViews, function(view) {
                // Append result of view.render() to this.content
                view.render();
                this.content += view.getContent();
            }.bind(this));

        },

        placeSummaryPanel: function(panelAdded) {

            this.makeSummaryGrid(2, 4);

            this.insertContentSummaryGridContent();

            $('.inline-stats.section').first().after(this.summaryGrid.html()).each(function() {
                // Grid placed
                if (panelAdded) panelAdded();
            });
        },

        placeExtendedStatsButton: function(buttonAdded) {

            var htmlButton = '<section>';
            htmlButton += '<a class="button btn-block btn-primary" id="extendedStatsButton" href="#">';
            htmlButton += 'Show extended statistics';
            htmlButton += '</a>';
            htmlButton += '</section>';

            $('.inline-stats.section').first().after(htmlButton).each(function() {

                $('#extendedStatsButton').click(function() {

                    $.fancybox({
                        'width': '100%',
                        'height': '100%',
                        'autoScale': true,
                        'transitionIn': 'fade',
                        'transitionOut': 'fade',
                        'type': 'iframe',
                        'content': '<div class="stravistiXExtendedData">' + this.content + '</div>'
                    });

                    // For each view start making the assossiated graphs
                    _.each(this.dataViews, function(view) {
                        view.displayGraph();
                    }.bind(this));


                }.bind(this));

                if (buttonAdded) buttonAdded();

            }.bind(this));
        },

        makeSummaryGrid: function(columns, rows) {

            var summaryGrid = '';
            summaryGrid += '<div>';
            summaryGrid += '<div class="summaryGrid">';
            summaryGrid += '<table>';

            for (var i = 0; i < rows; i++) {
                summaryGrid += '<tr>';
                for (var j = 0; j < columns; j++) {
                    summaryGrid += '<td data-column="' + j + '" data-row="' + i + '">';
                    summaryGrid += '</td>';
                }
                summaryGrid += '</tr>';
            }
            summaryGrid += '</table>';
            summaryGrid += '</div>';
            summaryGrid += '</div>';
            this.summaryGrid = $(summaryGrid);
        },

        insertContentAtGridPosition: function(columnId, rowId, data, title, units, userSettingKey) {

            var onClickHtmlBehaviour = "onclick='javascript:window.open(\"" + this.appResources_.settingsLink + "#/commonSettings?viewOptionHelperId=" + userSettingKey + "\",\"_blank\");'";

            if (this.summaryGrid) {
                var content = '<span class="summaryGridDataContainer" ' + onClickHtmlBehaviour + '>' + data + ' <span class="summaryGridUnits">' + units + '</span><br /><span class="summaryGridTitle">' + title + '</span></span>';
                this.summaryGrid.find('[data-column=' + columnId + '][data-row=' + rowId + ']').html(content);
            } else {
                console.error('Grid is not initialized');
            }
        },

        insertContentSummaryGridContent: function() {
            // Insert summary data
            var moveRatio = '-';
            if (this.analysisData_.moveRatio && this.userSettings_.displayActivityRatio) {
                moveRatio = this.analysisData_.moveRatio.toFixed(2);
            }
            this.insertContentAtGridPosition(0, 0, moveRatio, 'Move Ratio', '', 'displayActivityRatio');

            // ...
            var TRIMP = activityHeartRateReserve = '-';
            var activityHeartRateReserveUnit = '%';
            if (this.analysisData_.heartRateData && this.userSettings_.displayAdvancedHrData) {
                TRIMP = this.analysisData_.heartRateData.TRIMP.toFixed(0) + ' <span class="summarySubGridTitle">(' + this.analysisData_.heartRateData.TRIMPPerHour.toFixed(0) + ' / hour)</span>';
                activityHeartRateReserve = this.analysisData_.heartRateData.activityHeartRateReserve.toFixed(0);
                activityHeartRateReserveUnit = '%  <span class="summarySubGridTitle">(Max: ' + this.analysisData_.heartRateData.activityHeartRateReserveMax.toFixed(0) + '% @ ' + this.analysisData_.heartRateData.maxHeartRate + 'bpm)</span>';
            }
            this.insertContentAtGridPosition(0, 1, TRIMP, 'TRaining IMPulse', '', 'displayAdvancedHrData');
            this.insertContentAtGridPosition(1, 1, activityHeartRateReserve, 'Heart Rate Reserve Avg', activityHeartRateReserveUnit, 'displayAdvancedHrData');

            // ...
            var climbTime = '-';
            var climbTimeExtra = '';
            if (this.analysisData_.gradeData && this.userSettings_.displayAdvancedGradeData) {
                climbTime = Helper.secondsToHHMMSS(this.analysisData_.gradeData.upFlatDownInSeconds.up);
                climbTimeExtra = '<span class="summarySubGridTitle">(' + (this.analysisData_.gradeData.upFlatDownInSeconds.up / this.analysisData_.gradeData.upFlatDownInSeconds.total * 100).toFixed(0) + '% of time)</span>';
            }

            this.insertContentAtGridPosition(0, 2, climbTime, 'Time climbing', climbTimeExtra, 'displayAdvancedGradeData');

        },


        /**
         * Affect default view needed
         */
        setDataViewsNeeded: function() {

            // By default we have... If data exist of course...

            // Featured view
            if (this.analysisData_) {
                var featuredDataView = new FeaturedDataView(this.analysisData_, this.userSettings_, this.basicInfos);
                featuredDataView.setAppResources(this.appResources_);
                featuredDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(featuredDataView);
            }

            // Heart view
            if (this.analysisData_.heartRateData && this.userSettings_.displayAdvancedHrData) {
                var heartRateDataView = new HeartRateDataView(this.analysisData_.heartRateData, 'hrr', this.userSettings_);
                heartRateDataView.setAppResources(this.appResources_);
                heartRateDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(heartRateDataView);
            }
        },

        getSpeedUnitData: function() {
            var measurementPreference = currentAthlete.get('measurement_preference');
            var units = (measurementPreference == 'meters') ? 'km' : 'mi';
            var speedUnitPerhour = (measurementPreference == 'meters') ? 'km/h' : 'mi/h';
            var speedUnitFactor = (speedUnitPerhour == 'km/h') ? 1 : 0.62137;
            return [speedUnitPerhour, speedUnitFactor, units];
        },
    }
});

var AbstractExtendedDataModifier = Fiber.extend(function(base) {

    return {

        content: '',

        isAuthorOfViewedActivity: null,

        dataViews: [],

        summaryGrid: null,

        type: null,

        analysisData_: null,

        segmentEffortButtonId: 'extendedStatsButtonSegment',

        init: function(activityProcessor, activityId, activityType, appResources, userSettings, athleteId, athleteIdAuthorOfActivity, basicInfos, type) {

            this.activityProcessor_ = activityProcessor;
            this.activityId_ = activityId;
            this.activityType = activityType;
            this.appResources_ = appResources;
            this.userSettings_ = userSettings;
            this.athleteId_ = athleteId;
            this.athleteIdAuthorOfActivity_ = athleteIdAuthorOfActivity;
            this.basicInfos = basicInfos;
            this.isAuthorOfViewedActivity = (this.athleteIdAuthorOfActivity_ == this.athleteId_);
            this.speedUnitsData = this.getSpeedUnitData();
            this.type = type;

            if (_.isNull(this.type)) {
                console.error('ExtendedDataModifier must be set');
            }

            this.activityProcessor_.setActivityType(activityType);

            // Getting data to display at least summary panel. Cache will be normally used next if user click 'Show extended stats' in ACTIVITY mode
            this.activityProcessor_.getAnalysisData(
                this.activityId_,
                this.userSettings_.userGender,
                this.userSettings_.userRestHr,
                this.userSettings_.userMaxHr,
                this.userSettings_.userFTP,
                null, // No bounds given, full activity requested
                function(analysisData) { // Callback when analysis data has been computed

                    this.analysisData_ = analysisData;
                    if (this.type === AbstractExtendedDataModifier.TYPE_ACTIVITY) {

                        this.placeSummaryPanel(function() { // Summary panel has been placed...
                            // Add Show extended statistics to page
                            this.placeExtendedStatsButton(function() {}); // Button has been placed...
                        }.bind(this));

                    } else if (this.type === AbstractExtendedDataModifier.TYPE_SEGMENT) {
                        // Place button for segment
                        this.placeExtendedStatsButtonSegment(function() {}); // Button has been placed...
                    }
                }.bind(this)
            );

        },

        renderViews: function() {

            this.content = '';

            this.setDataViewsNeeded();

            _.each(this.dataViews, function(view) {
                // Append result of view.render() to this.content
                view.render();
                this.content += view.getContent();
            }.bind(this));

        },

        placeSummaryPanel: function(panelAdded) {

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

                    this.activityProcessor_.setActivityType(this.activityType);

                    this.activityProcessor_.getAnalysisData(
                        this.activityId_,
                        this.userSettings_.userGender,
                        this.userSettings_.userRestHr,
                        this.userSettings_.userMaxHr,
                        this.userSettings_.userFTP,
                        null, // No bounds given, full activity requested
                        function(analysisData) { // Callback when analysis data has been computed

                            this.analysisData_ = analysisData;

                            this.renderViews();

                            this.showResultsAndRefeshGraphs();

                        }.bind(this)
                    );

                }.bind(this));

                if (buttonAdded) buttonAdded();

            }.bind(this));
        },

        placeExtendedStatsButtonSegment: function(buttonAdded, buttonId) { // Note: This method has been overriden in childs

            $('#' + this.segmentEffortButtonId).click(function() {

                this.getSegmentInfos(function(segmentInfosResponse) {

                    // Call Activity Processor with bounds
                    if (!segmentInfosResponse.start_index && segmentInfosResponse.end_index) {
                        return;
                    }

                    // Update basic Infos
                    this.basicInfos.segmentEffort = {
                        name: segmentInfosResponse.display_name,
                        elapsedTimeSec: segmentInfosResponse.elapsed_time_raw
                    };

                    this.activityProcessor_.getAnalysisData(
                        this.activityId_,
                        this.userSettings_.userGender,
                        this.userSettings_.userRestHr,
                        this.userSettings_.userMaxHr,
                        this.userSettings_.userFTP,

                        [segmentInfosResponse.start_index, segmentInfosResponse.end_index], // Bounds given, full activity requested

                        function(analysisData) { // Callback when analysis data has been computed

                            this.analysisData_ = analysisData;
                            this.renderViews();
                            this.showResultsAndRefeshGraphs();

                        }.bind(this));

                }.bind(this));

            }.bind(this));

            if (buttonAdded) buttonAdded();
        },

        getSegmentInfos: function(callback) {

            var effortId = (window.location.pathname.split('/')[4] || window.location.hash.replace('#', '')) || false;

            if (!effortId) {
                console.error('No effort id found');
                return;
            }

            // Get segment effort bounds
            var segmentInfosResponse;
            $.when(
                $.ajax({
                    url: '/segment_efforts/' + effortId,
                    type: 'GET',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                    },
                    dataType: 'json',
                    success: function(xhrResponseText) {
                        segmentInfosResponse = xhrResponseText;
                    },
                    error: function(err) {
                        console.error(err);
                    }
                })

            ).then(function() {
                callback(segmentInfosResponse);
            }.bind(this));
        },

        showResultsAndRefeshGraphs: function() {

            $.fancybox({
                'padding': 0,
                'margin': 15,
                'width': '100%',
                'height': '100%',
                'autoScale': true,
                'transitionIn': 'none',
                'transitionOut': 'none',
                'closeBtn': false,
                'type': 'iframe',
                'content': '<div class="stravistiXExtendedData">' + this.content + '</div>'
            });

            // For each view start making the assossiated graphs
            _.each(this.dataViews, function(view) {
                view.displayGraph();
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
            var TRIMP = '-';
            var activityHeartRateReserve = '-';
            var activityHeartRateReserveUnit = '%';
            if (this.analysisData_.heartRateData && this.userSettings_.displayAdvancedHrData) {
                TRIMP = this.analysisData_.heartRateData.TRIMP.toFixed(0) + ' <span class="summarySubGridTitle">(' + this.analysisData_.heartRateData.TRIMPPerHour.toFixed(1) + ' / hour)</span>';
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

        cleanDataViews: function() {

            if (!_.isEmpty(this.dataViews)) {
                for (var i = 0; i < this.dataViews.length; i++) {
                    this.dataViews[i] = null;
                    delete this.dataViews[i];
                }
                this.dataViews = [];
            }
        },

        /**
         * Affect default view needed
         */
        setDataViewsNeeded: function() {

            // Clean Data View Before
            this.cleanDataViews();

            // By default we have... If data exist of course...
            // Featured view
            if (this.analysisData_) {
                var featuredDataView = new FeaturedDataView(this.analysisData_, this.userSettings_, this.basicInfos);
                featuredDataView.setAppResources(this.appResources_);
                featuredDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                featuredDataView.setActivityType(this.activityType);
                featuredDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
                this.dataViews.push(featuredDataView);
            }

            // Heart view
            if (this.analysisData_.heartRateData && this.userSettings_.displayAdvancedHrData && this.isAuthorOfViewedActivity) {
                var heartRateDataView = new HeartRateDataView(this.analysisData_.heartRateData, 'hrr', this.userSettings_);
                heartRateDataView.setAppResources(this.appResources_);
                heartRateDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                heartRateDataView.setActivityType(this.activityType);
                heartRateDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
                this.dataViews.push(heartRateDataView);
            }
        },

        getSpeedUnitData: function() {
            var measurementPreference = currentAthlete.get('measurement_preference');
            var units = (measurementPreference == 'meters') ? 'km' : 'mi';
            var speedUnitPerhour = (measurementPreference == 'meters') ? 'km/h' : 'mi/h';
            var speedUnitFactor = (speedUnitPerhour == 'km/h') ? 1 : 0.621371;
            return [speedUnitPerhour, speedUnitFactor, units];
        },

        /**
         * @param speed in kph
         * @return pace in seconds/km
         */
        convertSpeedToPace: function(speed) {
            if (_.isNaN(speed)) {
                return 0;
            }
            return (speed === 0) ? 'infinite' : parseInt((1 / speed) * 60 * 60);
        }
    };
});

AbstractExtendedDataModifier.TYPE_ACTIVITY = 0;
AbstractExtendedDataModifier.TYPE_SEGMENT = 1;

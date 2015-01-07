/*
 *   ExtendedActivityDataModifier is responsible of ...
 */
function ExtendedActivityDataModifier(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {
    this.analysisData_ = analysisData;
    this.appResources_ = appResources;
    this.userSettings_ = userSettings;
    this.athleteId_ = athleteId;
    this.athleteIdAuthorOfActivity_ = athleteIdAuthorOfActivity;
}

ExtendedActivityDataModifier.hideDefaultTitle = 'Hide StravaPlus Extended Stats';
ExtendedActivityDataModifier.showDefaultTitle = 'Show StravaPlus Extended Stats';
ExtendedActivityDataModifier.hideExtendedStatsPanelCookieKey = 'sp_hideExtendedStatsPanelCookie';


/**
 * Define prototype
 */
ExtendedActivityDataModifier.prototype = {

    statAnchor: null,

    activityPanel_: null,

    /**
     *
     */
    modify: function modify() {

        // Creating panel
        this.statAnchor = this.getStatAnchor_();
        this.activityPanel_ = this.createActivityPanel_();

        // NEW LINE With 'StravaPlus Extended Stats' title
        this.makeHideShowExtendedDataLink_();

        // Display Various related data
        this.handleVariousData_();

        // Display speed related data
        this.handleSpeedRelatedData_();

        // Display power related data
        this.handlePowerRelatedData_();

        // Display pedaling related data
        this.handlePedalingRelatedData_();

        // Display heartrate related data
        this.handleHeartrateRelatedData_();

    },

    makeHideShowExtendedDataLink_: function makeHideShowExtendedDataLink_() {

        var style = 'font-style: italic; font-size:11px; padding: 1px; text-align: center; color: white; background: #fc4c02; margin-top: 5px; cursor: pointer;';
        this.statAnchor.append('<div style="padding-top: 3px; padding-bottom: 3px;"><input type="checkbox" id="hideExtendedStatsPanelCheckbox" value="checked"/> Force hide "Extended Stats" panel</div><div id="extendedDataTitle" style="' + style + '">' + ExtendedActivityDataModifier.hideDefaultTitle + '<div>').each(function() {

            // Handle listener on hide/show title
            jQuery('#extendedDataTitle').on('click', function() {

                if (jQuery('#extendedActivityDataContent').is(":visible")) {
                    jQuery('#extendedActivityDataContent').slideUp(function() {
                        jQuery('#extendedDataTitle').html(ExtendedActivityDataModifier.showDefaultTitle);
                    });

                } else {
                    jQuery('#extendedActivityDataContent').slideDown(function() {
                        jQuery('#extendedDataTitle').html(ExtendedActivityDataModifier.hideDefaultTitle);
                    });
                }
            });

            // Handle listener on "Extended Stats" panel hide checkbox
            jQuery('#hideExtendedStatsPanelCheckbox').on('click', function() {
                if (jQuery('#hideExtendedStatsPanelCheckbox').is(':checked')) {
                    StorageManager.setCookie(ExtendedActivityDataModifier.hideExtendedStatsPanelCookieKey, true, 365);
                } else {
                    StorageManager.setCookie(ExtendedActivityDataModifier.hideExtendedStatsPanelCookieKey, false, 365);
                }
            });
        });

        // Once all have been Added to panel
        // We need to know if user asked for "Extended Stats" panel hide by default or not
        this.handleExtendedStatsHideFromUserNeed_();
    },

    /**
     *
     */
    handleExtendedStatsHideFromUserNeed_: function handleExtendedStatsHideFromUserNeed_() {

        setTimeout(function() {

            var hideExtendedStatsPanelCookieValue = JSON.parse(StorageManager.getCookie(ExtendedActivityDataModifier.hideExtendedStatsPanelCookieKey));

            if (!_.isNull(hideExtendedStatsPanelCookieValue) && _.isEqual(hideExtendedStatsPanelCookieValue, true)) {

                // Check the checkbox hideExtendedStatsPanelCheckbox
                jQuery('#hideExtendedStatsPanelCheckbox').prop('checked', true);

                // Hide #extendedActivityDataContent panel
                jQuery('#extendedActivityDataContent').slideUp(function() {
                    // Set title
                    jQuery('#extendedDataTitle').html(ExtendedActivityDataModifier.showDefaultTitle);
                });

            } else {

                // UnCheck the checkbox hideExtendedStatsPanelCheckbox
                jQuery('#hideExtendedStatsPanelCheckbox').prop('checked', false);

                // Show #extendedActivityDataContent panel
                jQuery('#extendedActivityDataContent').slideDown(function() {
                    // Set title
                    jQuery('#extendedDataTitle').html(ExtendedActivityDataModifier.hideDefaultTitle);
                });
            }
        });
    },

    /**
     *
     */
    handleVariousData_: function handleVariousData_() {

        if (this.userSettings_.displayMotivationScore && !_.isNull(this.analysisData_.toughnessScore)) {
            this.appendAnalyseDataToStatsPanel_('displayMotivationScore', 'Toughness Factor', this.analysisData_.toughnessScore.toFixed(0), null, null);
        }

        if (this.userSettings_.displayActivityRatio) {
            this.appendAnalyseDataToStatsPanel_('displayActivityRatio', 'Move ratio', this.analysisData_.moveRatio.toFixed(2), null, null);
        }
    },

    /**
     *
     */
    handlePowerRelatedData_: function handlePowerRelatedData_() {

        if (this.userSettings_.displayAdvancedPowerData && !_.isNull(this.analysisData_.powerData)) {

            this.createNewLineData_('lineForPowerData', null, 'margin-bottom: 5px;');

            // Estimated Normalized Power
            this.appendAnalyseDataToStatsPanel_('displayAdvancedPowerData', 'Estimated Normalized Power', this.analysisData_.powerData.normalizedPower.toFixed(0), 'W', 'color: #838383;');

            // Estimated Variability Index
            this.appendAnalyseDataToStatsPanel_('displayAdvancedPowerData', 'Estimated Variability Index', this.analysisData_.powerData.variabilityIndex.toFixed(2), null, 'color: #838383;');

            // Estimated Intensity Factor
            if (this.athleteId_ == this.athleteIdAuthorOfActivity_) {

                var intensityFactorOnToday = (_.isNull(this.analysisData_.powerData.intensityFactor)) ?
                    "<a style='font-size: 12px;' href='" + this.appResources_.settingsLink + "' target='_blank'>Configure FTP</a>" :
                    this.analysisData_.powerData.intensityFactor.toFixed(2);

                this.appendAnalyseDataToStatsPanel_('displayAdvancedPowerData', 'Estimated Intensity Factor', intensityFactorOnToday, null, 'color: #838383;');
            }

            // Normalized W/Kg
            this.appendAnalyseDataToStatsPanel_('displayAdvancedPowerData', 'Estimated Normalized W/Kg', this.analysisData_.powerData.normalizedWattsPerKg.toFixed(2), null, 'color: #838383;');

            // New line
            this.createNewLineData_('lineForPowerDataBis', null, 'margin-bottom: 5px;');

            // median, quartiles..
            this.appendAnalyseDataToStatsPanel_('displayAdvancedPowerData', '25% Quartile Watts', this.analysisData_.powerData.lowerQuartileWatts.toFixed(0), "W", 'color: #838383;');
            this.appendAnalyseDataToStatsPanel_('displayAdvancedPowerData', '50% Median Watts', this.analysisData_.powerData.medianWatts.toFixed(0), "W", 'color: #838383;');
            this.appendAnalyseDataToStatsPanel_('displayAdvancedPowerData', '75% Quartile Watts', this.analysisData_.powerData.upperQuartileWatts.toFixed(0), "W", 'color: #838383;');
        }
    },

    /**
     *
     */
    handleSpeedRelatedData_: function handleSpeedRelatedData_() {

        // Display Q1, Median, Q3 and standard deviation speed below
        if (this.userSettings_.displayAdvancedSpeedData) {

            this.createNewLineData_('lineForHeartSpeedData', null, 'margin-bottom: 5px;');

            // add Speeds to panel Speed unit here: pageView.activityAthlete().attributes.measurement_preference
            var measurementPreference = pageView.activityAthlete().attributes.measurement_preference;
            var unit = (measurementPreference == 'meters') ? 'km' : 'mi';
            var speedUnit = (measurementPreference == 'meters') ? 'km/h' : 'mi/h';
            var toMilesOnNot = (speedUnit == 'km/h') ? 1 : 0.62137;

            var paceTimePerDistance = Helper.secondsToHHMMSS(this.analysisData_.speedData.avgPace / toMilesOnNot);
            paceTimePerDistance = paceTimePerDistance.replace('00:', '');

            this.appendAnalyseDataToStatsPanel_('displayAdvancedSpeedData', 'Pace', paceTimePerDistance, '/' + unit, 'color: #3399FF;');
            this.appendAnalyseDataToStatsPanel_('displayAdvancedSpeedData', '25% Quartile Speed', (this.analysisData_.speedData.lowerQuartileSpeed * toMilesOnNot).toFixed(1), speedUnit, 'color: #3399FF;');
            this.appendAnalyseDataToStatsPanel_('displayAdvancedSpeedData', '50% Median Speed', (this.analysisData_.speedData.medianSpeed * toMilesOnNot).toFixed(1), speedUnit, 'color: #3399FF;');
            this.appendAnalyseDataToStatsPanel_('displayAdvancedSpeedData', '75% Quartile Speed', (this.analysisData_.speedData.upperQuartileSpeed * toMilesOnNot).toFixed(1), speedUnit, 'color: #3399FF;');
            this.appendAnalyseDataToStatsPanel_('displayAdvancedSpeedData', 'Standard Deviation Speed &sigma;', (this.analysisData_.speedData.standardDeviationSpeed * toMilesOnNot).toFixed(1), speedUnit, 'color: #3399FF;');
            // this.appendAnalyseDataToStatsPanel_('displayAdvancedSpeedData', 'Raw Avg Speed', (this.analysisData_.speedData.rawAvgSpeed * toMilesOnNot).toFixed(1), speedUnit, 'color: #3399FF;');
        }
    },

    /**
     *
     */
    handlePedalingRelatedData_: function handlePedalingRelatedData_() {

        if (this.userSettings_.displayPedalingData && !_.isNull(this.analysisData_.pedalingData)) {

            this.createNewLineData_('lineForPedalingData', null, 'margin-bottom: 5px;');

            this.appendAnalyseDataToStatsPanel_('displayPedalingData', 'Pedaling % while moving', this.analysisData_.pedalingData.pedalingPercentageMoving.toFixed(2), '%', 'color: #CC00FF;');
            this.appendAnalyseDataToStatsPanel_('displayPedalingData', 'Pedaling Time while moving', Helper.secondsToHHMMSS(this.analysisData_.pedalingData.pedalingTimeMoving), null, 'color: #CC00FF;');
            this.appendAnalyseDataToStatsPanel_('displayPedalingData', 'Crank Revolutions', this.analysisData_.pedalingData.crankRevolutions.toFixed(0), null, 'color: #CC00FF;');
        }
    },

    /**
     *
     */
    handleHeartrateRelatedData_: function handleHeartrateRelatedData_() {

        // Display TRIMP, % HRR, Q1, Median and Q3 HR Data
        if (this.userSettings_.displayAdvancedHrData && !_.isNull(this.analysisData_.heartRateData)) {

            this.createNewLineData_('lineForHeartrateData', null, 'margin-bottom: 5px;');

            // Determine if user looking current activity page is the athlete who done it.
            var iamAuthorOfThisActivity = this.athleteId_ == this.athleteIdAuthorOfActivity_;

            if (iamAuthorOfThisActivity) {
                // TRIMP and %HRR are displayed only if user looking current activity page is the athlete who done it
                // because theses indicators depends on their HRMax and HRRest. They are alone to own these infos.
                this.appendAnalyseDataToStatsPanel_('displayAdvancedHrData', 'TRaining<br />IMPulse', this.analysisData_.heartRateData.TRIMP.toFixed(0), null, 'color: #FF2B42;');
                this.appendAnalyseDataToStatsPanel_('displayAdvancedHrData', '%Heart Rate Reserve Avg', this.analysisData_.heartRateData.activityHeartRateReserve.toFixed(0), '%', 'color: #FF2B42;');
            }

            // Append HeartRate quartiles
            this.appendAnalyseDataToStatsPanel_('displayAdvancedHrData', '25% Quartile HeartRate', this.analysisData_.heartRateData.lowerQuartileHeartRate.toFixed(0), 'bpm', 'color: #FF2B42;');
            this.appendAnalyseDataToStatsPanel_('displayAdvancedHrData', '50% Median HeartRate', this.analysisData_.heartRateData.medianHeartRate.toFixed(0), 'bpm', 'color: #FF2B42;');
            this.appendAnalyseDataToStatsPanel_('displayAdvancedHrData', '75% Quartile HeartRate', this.analysisData_.heartRateData.upperQuartileHeartRate.toFixed(0), 'bpm', 'color: #FF2B42;');

            // "Octo zones distribution of % Heart Rate Reserve in minutes" graph is displayed only if user looking current activity page is the athlete who done italic
            if (iamAuthorOfThisActivity) {
                this.showHRRGraphDistribution_(); // Let's generate that ***** graph !
            }
        }

    },

    showHRRGraphDistribution_: function showHRRGraphDistribution_() {

        var labelsData = [];
        for (var zone in this.analysisData_.heartRateData.hrrZones) {
            var label = "Z" + (parseInt(zone) + 1) + " " + this.analysisData_.heartRateData.hrrZones[zone].fromHrr + "% - " + this.analysisData_.heartRateData.hrrZones[zone].toHrr + "%";
            labelsData.push(label);
        }

        var hrDistributionInMinutesArray = [];
        for (var zone in this.analysisData_.heartRateData.hrrZones) {
            hrDistributionInMinutesArray.push((this.analysisData_.heartRateData.hrrZones[zone].s / 60).toFixed(0));
        }

        var data = {
            labels: labelsData,
            datasets: [{
                label: "Heart Rate Reserve Distribution",
                fillColor: "#FF2B42",
                strokeColor: "rgba(220,220,220,0.8)",
                data: hrDistributionInMinutesArray
            }]
        };

        // Append now the canvas for drawing graph inside
        this.activityPanel_.append('<div><canvas id="hrrChartDistribution" height="300" width="400"></canvas></div>').each(function() {

            // Generating the chart
            new Chart(document.getElementById("hrrChartDistribution").getContext("2d")).Bar(data, {
                barShowStroke: false,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                showTooltips: false,
            });

            // Create %HRR Octo zone distribution HTML table
            var hrrChartDistributionHtml = '<style>';
            hrrChartDistributionHtml += '#hrrChartTable {margin: 0;} #hrrChartTable td { text-align: center; padding: 3px;} #hrrChartTable strong { font-size: 12px;}';
            hrrChartDistributionHtml += '</style>';
            hrrChartDistributionHtml += '<div style="text-align: center; font-style: italic;">Zones distribution of <a href="http://fellrnr.com/wiki/Heart_Rate_Reserve" target="_blank">% Heart Rate Reserve</a> in minutes</div>';
            hrrChartDistributionHtml += '<table id="hrrChartTable">';
            hrrChartDistributionHtml += '<tr>'; // Zone
            hrrChartDistributionHtml += '<td>Zone</td>'; // Zone
            hrrChartDistributionHtml += '<td>%HRR</td>'; // %HRR
            hrrChartDistributionHtml += '<td>BPM</td>'; // bpm
            hrrChartDistributionHtml += '<td>Time</br>(hh:mm:ss)</td>'; // Time
            hrrChartDistributionHtml += '<td>% in zone</td>'; // % in zone
            hrrChartDistributionHtml += '</tr>';
            var zoneId = 1;
            for (var zone in this.analysisData_.heartRateData.hrrZones) {
                hrrChartDistributionHtml += '<tr>'; // Zone
                hrrChartDistributionHtml += '<td>Z' + zoneId + '</td>'; // Zone
                hrrChartDistributionHtml += '<td>' + this.analysisData_.heartRateData.hrrZones[zone].fromHrr + "% - " + this.analysisData_.heartRateData.hrrZones[zone].toHrr + "%" + '</th>'; // %HRR
                hrrChartDistributionHtml += '<td>' + this.analysisData_.heartRateData.hrrZones[zone].fromHr + " - " + this.analysisData_.heartRateData.hrrZones[zone].toHr + '</td>'; // bpm%
                hrrChartDistributionHtml += '<td>' + Helper.secondsToHHMMSS(this.analysisData_.heartRateData.hrrZones[zone].s) + '</td>'; // Time%
                hrrChartDistributionHtml += '<td>' + this.analysisData_.heartRateData.hrrZones[zone].percentDistrib.toFixed(0) + '%</td>'; // % in zone
                hrrChartDistributionHtml += '</tr>';
                zoneId++;
            }
            hrrChartDistributionHtml += '</table>';

            // Insert the chart
            jQuery('#hrrChartDistribution').after(hrrChartDistributionHtml);

        }.bind(this));
    },

    /**
     *   Add data to current activity panel
     */
    appendAnalyseDataToStatsPanel_: function appendAnalyseDataToStatsPanel_(userSettingKey, title, valueHtml, unit, style) {

        var onClickHtmlBehaviour = "onclick='javascript:window.open(\"" + this.appResources_.settingsLink + "#/comonSettings?viewOptionHelperId=" + userSettingKey + "\",\"_blank\");'";

        var isA = jQuery(valueHtml).is('a');

        // Add unit if needed        
        valueHtml = valueHtml + ((unit === null) ? "" : "<abbr class='unit'>" + unit + "</abbr>");
        var analyzeDataToAppend = jQuery("<li style='margin-right: 8px; cursor: pointer;' " + ((!isA) ? onClickHtmlBehaviour : '') + ">" +
            "<strong style='" + style + "'>" + valueHtml + "</strong>" +
            "<div class='label' " + ((isA) ? onClickHtmlBehaviour : '') + ">" + title + "</div>" +
            "</li>");

        // Add to current panel
        this.activityPanel_.append(analyzeDataToAppend);

        // Insert after root stat panel
        this.statAnchor.append(this.activityPanel_);
    },

    /**
     *   Returns anchor panel element
     */
    getStatAnchor_: function getStatAnchor_() {
        // return jQuery('div.inset>.secondary-stats');
        var anchor = jQuery('div.inset>.inline-stats.section.secondary-stats');
        if (anchor.length === 0) {
            anchor = jQuery('div.inset>.inline-stats.section');
        }
        return anchor;
    },

    /**
     *   Returns panel element in activity
     */
    createActivityPanel_: function createActivityPanel_() {
        return new jQuery('<ul id="extendedActivityDataContent" class="inline-stats section"></ul>');
    },

    /**
     * Create New Line data on second stats panel
     */
    createNewLineData_: function createNewLineData_(id, htmlContent, style, lineCreatedCallback) {

        this.activityPanel_.append('<div id="' + id + '"style="' + style + '">' + ((htmlContent) ? htmlContent : '') + '<div>').each(function() {
            if (!_.isUndefined(lineCreatedCallback)) {
                lineCreatedCallback();
            }
        });
    }
};

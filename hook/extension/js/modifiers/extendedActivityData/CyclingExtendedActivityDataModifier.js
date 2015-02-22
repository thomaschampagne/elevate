var CyclingExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {

        content: 'Cycle content',

        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {

            console.log('CyclingExtendedActivityDataModifier::init');

            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);
        },

        modify: function() {

            this.content += " ahhhhh";

        },

        /*
        handleVariousData_: function() {

            if (this.userSettings_.displayMotivationScore && !_.isNull(this.analysisData_.toughnessScore)) {
                this.appendAnalyseDataToStatsPanel_('displayMotivationScore', 'Toughness Factor&nbsp;&nbsp;&nbsp;', this.analysisData_.toughnessScore.toFixed(0), null, null);
            }

            if (this.userSettings_.displayActivityRatio) {
                this.appendAnalyseDataToStatsPanel_('displayActivityRatio', 'Move ratio', this.analysisData_.moveRatio.toFixed(2), null, null);
            }
        },

        appendAnalyseDataToStatsPanel_: function(userSettingKey, title, valueHtml, unit, style) {

            var onClickHtmlBehaviour = "onclick='javascript:window.open(\"" + this.appResources_.settingsLink + "#/commonSettings?viewOptionHelperId=" + userSettingKey + "\",\"_blank\");'";

            var isA = jQuery(valueHtml).is('a');

            // Add unit if needed        
            valueHtml = valueHtml + ((unit === null) ? "" : "<abbr class='unit'>" + unit + "</abbr>");
            var analyzeDataToAppend = jQuery("<li style='margin-right: 2px; cursor: pointer;' " + ((!isA) ? onClickHtmlBehaviour : '') + ">" +
                "<strong style='" + style + "'>" + valueHtml + "</strong>" +
                "<div class='label' " + ((isA) ? onClickHtmlBehaviour : '') + ">" + title + "</div>" +
                "</li>");

            // Add to current panel
            this.activityPanel_.append(analyzeDataToAppend);

            // Insert after root stat panel
            this.statAnchor.append(this.activityPanel_);
        },
        */
    }
});


// // Display Various related data
// this.handleVariousData_();

// // Display speed related data
// this.handleSpeedRelatedData_();

// // Display power related data
// this.handlePowerRelatedData_();

// // Display pedaling related data
// this.handlePedalingRelatedData_();

// // Display heartrate related data
// this.handleHeartrateRelatedData_();

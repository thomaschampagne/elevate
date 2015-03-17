var AbstractExtendedActivityDataModifier = Fiber.extend(function(base) {

    return {

        content: '',

        isAuthorOfViewedActivity: null,

        dataViews: [],

        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {

            this.analysisData_ = analysisData;
            this.appResources_ = appResources;
            this.userSettings_ = userSettings;
            this.athleteId_ = athleteId;
            this.athleteIdAuthorOfActivity_ = athleteIdAuthorOfActivity;

            this.isAuthorOfViewedActivity = (this.athleteIdAuthorOfActivity_ == this.athleteId_);

            this.setDataViewsNeeded();
        },


        modify: function() {

            // Temporary message for new extended stats
            if (!StorageManager.getCookie('hideTmpMessageExtendedStats')) {
                this.content += '<p id="tmpMessageExtendedStats" style="padding: 5px;background: #FFF0A0;font-size: 12px;color: rgb(103, 103, 103);">This extended stats panel is NEW ! ';
                this.content += 'So feel free to report problems <a target="_blank" href="https://chrome.google.com/webstore/detail/stravaplus/dhiaggccakkgdfcadnklkbljcgicpckn/support">HERE</a> (don\'t forget activities links in report).<br/>';
                this.content += 'Follow feature updates through <a target="_blank" href="https://twitter.com/champagnethomas">@champagnethomas</a>.<br/>This message will disappear when stravaplus users have acclaimed this new feature (approximately few days...)<br/><br/><a onclick="javascript:jQuery(\'#tmpMessageExtendedStats\').hide(); document.cookie=\'hideTmpMessageExtendedStats=true\';">Never show this again</a></p>';
            }

            _.each(this.dataViews, function(view) {
                // Append result of view.render() to this.content
                view.render();
                this.content += view.getContent();
            }.bind(this));

            // Add Show extended statistics to page
            this.placeExtendedStatsButton(function() {
                // Button has been placed...
            });

        },

        placeExtendedStatsButton: function(buttonAdded) {

            var htmlButton = '<section>';
            htmlButton += '<a class="button btn-block btn-primary" id="extendedStatsButton" href="#">';
            htmlButton += 'Show extended statistics';
            htmlButton += '</a>';
            htmlButton += '</section>';

            jQuery('.inline-stats.section').first().after(htmlButton).each(function() {

                jQuery('#extendedStatsButton').click(function() {

                    jQuery.fancybox({
                        'width': '100%',
                        'height': '100%',
                        'autoScale': true,
                        'transitionIn': 'fade',
                        'transitionOut': 'fade',
                        'type': 'iframe',
                        'content': '<div class="stravaPlusExtendedData">' + this.content + '</div>'
                    });

                    // For each view start making the assossiated graphs
                    _.each(this.dataViews, function(view) {
                        view.displayGraph();
                    }.bind(this));


                }.bind(this));

                if (buttonAdded) buttonAdded();

            }.bind(this));
        },

        /**
         * Affect default view needed
         */
        setDataViewsNeeded: function() {

            // By default we have... If data exist of course...

            // Featured view
            if (this.analysisData_) {
                var featuredDataView = new FeaturedDataView(this.analysisData_, this.userSettings_);
                featuredDataView.setAppResources(this.appResources_);
                featuredDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(featuredDataView);
            }

            // // Heart view
            if (this.analysisData_.heartRateData && this.userSettings_.displayAdvancedHrData) {
                var heartRateDataView = new HeartRateDataView(this.analysisData_.heartRateData, 'bpm');
                heartRateDataView.setAppResources(this.appResources_);
                heartRateDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(heartRateDataView);
            }
        }
    }
});

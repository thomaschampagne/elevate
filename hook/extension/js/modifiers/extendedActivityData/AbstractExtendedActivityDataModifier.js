var AbstractExtendedActivityDataModifier = Fiber.extend(function(base) {

    return {

        extendedActivityDataWidth: '800px',

        content: '',

        dataViews: [],

        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {
            console.log('AbstractExtendedActivityDataModifier::init');

            this.analysisData_ = analysisData;
            this.appResources_ = appResources;
            this.userSettings_ = userSettings;
            this.athleteId_ = athleteId;
            this.athleteIdAuthorOfActivity_ = athleteIdAuthorOfActivity;
        },

        modify: function() {

            this.setDataViewsNeeded();

            _.each(this.dataViews, function(view) {
                // Append result of view.render() to this.content
                view.render();
                this.content += view.getContent();

                // console.log(view);
                //this.content += view.render();
                // console.warn(view);

            }.bind(this));

            // Add Show extended statistics to page
            this.placeExtendedStatsButton(function() {

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

                    jQuery.fancybox('<div style="width: ' + this.extendedActivityDataWidth + ';">' + this.content + '</div>'); // Content is the html computed by implementations

                    // TODO get data value of view
                    // TODO get canvas element of assiciated view


                    this.dataViews[0].displayGraph();

                    /*
                    // TODO...
                    _.each(this.dataViews, function(view) {

                        view.displayGraph();

                    }.bind(this));
                    */

                }.bind(this));

                if (buttonAdded) buttonAdded();

            }.bind(this));
        },

        /**
         * Affect default view needed
         */
        setDataViewsNeeded: function() {

            // By default we have... If data exist of course...

            // Speed view
            if (this.analysisData_.speedData) {
                this.dataViews.push(new SpeedDataView(this.analysisData_.speedData));
            }

            // Heart view
            if (this.analysisData_.heartRateData) {
                this.dataViews.push(new HeartRateDataView());
            }

        }
    }
});

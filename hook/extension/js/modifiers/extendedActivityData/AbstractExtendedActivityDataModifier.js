var AbstractExtendedActivityDataModifier = Fiber.extend(function(base) {

    return {

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

            // Add Show extended statistics to page
            this.placeExtendedStatsButton();

            this.setDataViewsNeeded();

            _.each(this.dataViews, function(view) {
                // Append result of view.render() to this.content
                view.render();
                this.content += view.getContent();

                // console.log(view);
                //this.content += view.render();
                // console.warn(view);
            }.bind(this));

        },

        placeExtendedStatsButton: function(buttonAdded) {

            var htmlButton = '<section>';
            htmlButton += '<a class="button btn-block btn-primary" id="extendedStatsButton" href="#">';
            htmlButton += 'Show extended statistics';
            htmlButton += '</a>';
            htmlButton += '</section>';

            jQuery('.inline-stats.section').first().after(htmlButton).each(function() {

                jQuery('#extendedStatsButton').click(function() {

                    jQuery.fancybox(this.content); // Content is the html computed by implementations

                }.bind(this));

                if (buttonAdded) buttonAdded();

            }.bind(this));
        },

        setDataViewsNeeded: function() {

            // By default we have... If data exist of course...
            
            // Speed view
            if (this.analysisData_.speedData) {
                this.dataViews.push(new SpeedDataView());
            }

            // Heart view
            if (this.analysisData_.heartRateData) {
                this.dataViews.push(new HeartRateDataView());
            }

            console.warn(this.dataViews);
            
        }
    }
});

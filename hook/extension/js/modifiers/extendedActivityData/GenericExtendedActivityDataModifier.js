var GenericExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {

        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {
            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);
        },

        modify: function() {
            base.modify.call(this);  // Super call
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
                this.dataViews.push(speedDataView);
            }

            if (this.analysisData_.cadenceData && this.userSettings_.displayCadenceData) {
                var cyclingCadenceDataView = new CyclingCadenceDataView(this.analysisData_.cadenceData, 'rpm');
                cyclingCadenceDataView.setAppResources(this.appResources_);
                cyclingCadenceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(cyclingCadenceDataView);
            }
        }
    }
});

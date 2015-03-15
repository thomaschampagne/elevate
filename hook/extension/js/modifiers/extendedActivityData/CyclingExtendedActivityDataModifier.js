var CyclingExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {

        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {
            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);
        },

        modify: function() {
            base.modify.call(this); // Super call
        },

        setDataViewsNeeded: function() {

            base.setDataViewsNeeded.call(this);

            if (this.analysisData_.powerData && this.userSettings_.displayAdvancedPowerData) {
                var powerDataView = new PowerDataView(this.analysisData_.powerData, 'w');
                powerDataView.setAppResources(this.appResources_);
                powerDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(powerDataView);
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

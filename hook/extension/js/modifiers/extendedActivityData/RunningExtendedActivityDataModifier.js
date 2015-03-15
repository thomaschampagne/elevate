var RunningExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {


        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {
            console.log('RunningExtendedActivityDataModifier::init');

            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);
        },

        modify: function() {
            base.modify.call(this); // Super call
        },

        setDataViewsNeeded: function() {

            base.setDataViewsNeeded.call(this);

            if (this.analysisData_.cadenceData && this.userSettings_.displayCadenceData) {
                var runningCadenceDataView = new RunningCadenceDataView(this.analysisData_.cadenceData, 'spm');
                runningCadenceDataView.setAppResources(this.appResources_);
                runningCadenceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(runningCadenceDataView);
            }
        }
    }
});

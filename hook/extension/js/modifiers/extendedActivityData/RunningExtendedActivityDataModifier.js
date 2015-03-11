var RunningExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {


        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {
            console.log('RunningExtendedActivityDataModifier::init');

            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);

            this.setDataViewsNeeded();
        },

        modify: function() {
            base.modify.call(this); // Super call
        },

        setDataViewsNeeded: function() {

            base.setDataViewsNeeded.call(this);

            // TODO Give cadence units in spm for running
            
            if (this.analysisData_.cadenceData) {
                var cadenceDataView = new CadenceDataView(this.analysisData_.cadenceData);
                cadenceDataView.setAppResources(this.appResources_);
                this.dataViews.push(cadenceDataView);
            }
        }
    }
});

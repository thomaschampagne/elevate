var CyclingExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {

        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {

            console.log('CyclingExtendedActivityDataModifier::init');

            console.warn(AbstractExtendedActivityDataModifier);

            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);

            this.setDataViewsNeeded();
        },

        modify: function() {

            console.log('CyclingExtendedActivityDataModifier::modify');

            // Super call
            base.modify.call(this);
        },

        setDataViewsNeeded: function() {

            base.setDataViewsNeeded.call(this);

            if (this.analysisData_.powerData) {
                var powerDataView = new PowerDataView(this.analysisData_.powerData);
                powerDataView.setAppResources(this.appResources_);
                this.dataViews.push(powerDataView);
            }

            if (this.analysisData_.cadenceData) {
                var cadenceDataView = new CadenceDataView(this.analysisData_.cadenceData);
                cadenceDataView.setAppResources(this.appResources_);
                this.dataViews.push(cadenceDataView);
            }
        }
    }
});

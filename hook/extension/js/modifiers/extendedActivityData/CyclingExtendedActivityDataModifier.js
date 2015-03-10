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

            if (this.analysisData_.cadenceData) {
                var cadenceDataView = new CadenceDataView(this.analysisData_.cadenceData);
                cadenceDataView.setAppResources(this.appResources_);
                this.dataViews.push(cadenceDataView);
            }
        }
    }
});


// // Display Various related data
// this.handleVariousData_();

// // Display speed related data
// this.handleSpeedRelatedData_();

// // Display power related data
// this.handlePowerRelatedData_();

// // Display cadence related data
// this.handleCadenceRelatedData_();

// // Display heartrate related data
// this.handleHeartrateRelatedData_();

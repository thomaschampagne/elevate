var CyclingExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {

        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {

            console.log('CyclingExtendedActivityDataModifier::init');

            console.warn(AbstractExtendedActivityDataModifier);

            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);
        },

        modify: function() {

            console.log('CyclingExtendedActivityDataModifier::modify');

            // Super call
            base.modify.call(this);

            console.debug(this.content);

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

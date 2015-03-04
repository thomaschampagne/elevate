var RunningExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {


        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {
            console.log('RunningExtendedActivityDataModifier::init');

            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);

            this.setDataViewsNeeded();
        },

        modify: function() {
            base.modify.call(this);  // Super call
        }
    }
});

var RunningExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {


        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {
            console.log('RunningExtendedActivityDataModifier::init');
            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);
        },

        modify: function() {

            // Super call
            base.modify.call(this);

            // TODO this.content += mySpecificView.render();
        }
    }
});

var RunningExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {

        content: 'Run content',

        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {
            console.log('RunningExtendedActivityDataModifier::init');
            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);
        },

        modify: function() {
            // console.warn(this.analysisData_);
            this.content += " ahhhhh ahhhh";

        },
    }
});

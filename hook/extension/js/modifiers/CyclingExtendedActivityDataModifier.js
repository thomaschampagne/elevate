var CyclingExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {

        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {
          
            console.log('CyclingExtendedActivityDataModifier::init');

            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);
            // console.warn(this.data);
        },

        modify: function() {
            console.warn(this);
            // console.warn(this.data);
            // console.warn(this.myContainer);
            // console.warn(this.athleteId_);
        },


        // placeExtendedStatsButton: function() {
        //     console.log('CyclingExtendedActivityDataModifier::placeExtendedStatsButton');
        // }
    }
});

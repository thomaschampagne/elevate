var AbstractExtendedActivityDataModifier = Fiber.extend(function(base) {

    return {
        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {

            console.log('AbstractExtendedActivityDataModifier::init');
            base.analysisData_ = analysisData;
            base.appResources_ = appResources;
            base.userSettings_ = userSettings;
            base.athleteId_ = athleteId;
            base.athleteIdAuthorOfActivity_ = athleteIdAuthorOfActivity;
        }
    }
});

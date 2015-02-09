// Inheritance
RunningExtendedActivityDataModifier.prototype = new AbstractExtendedActivityDataModifier();
RunningExtendedActivityDataModifier.prototype.parent = AbstractExtendedActivityDataModifier.prototype;

function RunningExtendedActivityDataModifier(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {

    console.error('[Check] Call super constructor here !!');
    AbstractExtendedActivityDataModifier.prototype.constructor(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity); // super call

}

RunningExtendedActivityDataModifier.prototype = {

};

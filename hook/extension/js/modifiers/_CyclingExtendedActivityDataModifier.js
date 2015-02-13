// Inheritance
// CyclingExtendedActivityDataModifier.prototype = new AbstractExtendedActivityDataModifier(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);

CyclingExtendedActivityDataModifier.prototype = new AbstractExtendedActivityDataModifier();
CyclingExtendedActivityDataModifier.prototype = AbstractExtendedActivityDataModifier.prototype;

function CyclingExtendedActivityDataModifier(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {

    AbstractExtendedActivityDataModifier.prototype.constructor(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity); // super call
    console.log('CyclingExtendedActivityDataModifier child constructor');
}

CyclingExtendedActivityDataModifier.prototype = {

    modify: function modify() {

        AbstractExtendedActivityDataModifier.prototype.modify();

        console.log('CyclingExtendedActivityDataModifier modify child');
        // console.warn(CyclingExtendedActivityDataModifier.prototype);
        // console.warn(this.parent);
    }
};

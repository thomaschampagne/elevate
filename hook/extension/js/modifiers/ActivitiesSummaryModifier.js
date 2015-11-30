/**
 *   ActivitiesSummaryModifier is responsible of ...
 */
function ActivitiesSummaryModifier(appResources) {
}

/**
 * Define prototype
 */
ActivitiesSummaryModifier.prototype = {

    modify: function modify() {

        var self = this,
            activitiesCountElementId = "totals-activities-count",
            activitiesCount = $("#interval-rides .feed-entry").length,
            $totals = $("#totals");
        
        $totals.find("li").first().before("<li><strong>All</strong></li>").before("<li id='" + activitiesCountElementId + "'><strong>" + activitiesCount + "</strong></li>");
        
        
        
        var waitForTotalActivitiesCountRemove = function() {
            if ($("#" + activitiesCountElementId).length !== 0) {
                setTimeout(function() {
                    waitForTotalActivitiesCountRemove();
                }, 1000);
                return;
            }
            modify.call(self);
        };
        waitForTotalActivitiesCountRemove();
    }
};

/**
 *   ActivityStravaMapTypeModifier is responsible of ...
 */
function ActivityStravaMapTypeModifier(mapType) {
    this.mapType = mapType;
}

/**
 * Define prototype
 */
ActivityStravaMapTypeModifier.prototype = {

    modify: function modify() {

        if (this.mapType === 'terrain') {
            return;
        }

        var mapGoal = this.mapType;

        setInterval(function() {

            $('a.map-type-selector[data-map-type-id=' + mapGoal + ']')
                .not('.once-only')
                .addClass('once-only')
                .click()
                .parents('.drop-down-menu') // Close menu
                .click();
        }, 750);
    },
};

/**
 *   ActivityGoogleMapTypeModifier is responsible of ...
 */
function ActivityGoogleMapTypeModifier(mapType) {
    this.mapType = mapType;
}

/**
 * Define prototype
 */
ActivityGoogleMapTypeModifier.prototype = {

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

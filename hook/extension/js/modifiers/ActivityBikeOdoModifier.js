/**
 *   ActivityBikeOdoModifier is responsible of ...
 */
function ActivityBikeOdoModifier(bikeOdoArray, cacheAgingTimeCookieKey) {
    this.bikeOdoArray_ = bikeOdoArray;
    this.cacheAgingTimeCookieKey = cacheAgingTimeCookieKey;
}

/**
 * Define prototype
 */
ActivityBikeOdoModifier.prototype = {

    modify: function modify() {

        // Get bike name on Activity Page
        var bikeDisplayedOnActivityPage = jQuery('.gear-name').text().trim();

        // Get odo from map
        var activityBikeOdo = this.bikeOdoArray_[btoa(bikeDisplayedOnActivityPage)];

        var newBikeDisplayHTML = bikeDisplayedOnActivityPage + '<strong> / ' + activityBikeOdo + '</strong>';

        var forceRefreshActionHTML = '<a href="#" style="cursor: pointer;" title="Force odo refresh for this athlete\'s bike. Usually it refresh every 2 hours..." id="bikeOdoForceRefresh">Force refresh odo</a>';

        // Edit Activity Page
        jQuery('.gear-name').html(newBikeDisplayHTML + '<br />' + forceRefreshActionHTML).each(function() {

            jQuery('#bikeOdoForceRefresh').on('click', function() {
                this.handleUserBikeOdoForceRefresh_();
            }.bind(this));

        }.bind(this));
    },

    handleUserBikeOdoForceRefresh_: function handleUserBikeOdoForceRefresh_() {
    	// Force REMOVE cookie with 0 seconds
        StorageManager.setCookieSeconds(this.cacheAgingTimeCookieKey, null, 0);

        window.location.reload();
    },
};

/**
 *   ActivityBikeOdoModifier is responsible of ...
 */
function ActivityBikeOdoModifier(bikeOdoArray, cacheKey) {
    this.bikeOdoArray_ = bikeOdoArray;
    this.cacheKey = cacheKey;
}

/**
 * Define prototype
 */
ActivityBikeOdoModifier.prototype = {

    modify: function modify() {

        // Get bike name on Activity Page
        var bikeDisplayedOnActivityPage = $('.gear-name').text().trim();

        // Get odo from map
        var activityBikeOdo = 'No bike declared';
        try {
            activityBikeOdo = this.bikeOdoArray_[btoa(bikeDisplayedOnActivityPage)];
        } catch (err) {
            console.warn('Unable to find bike odo for this Activity');
        }

        var newBikeDisplayHTML = bikeDisplayedOnActivityPage + '<br>ODO: <strong>' + activityBikeOdo + '</strong>';

        var forceRefreshActionHTML = '<a href="#" style="cursor: pointer;" title="Force odo refresh for this athlete\'s bike. Usually it refresh every 2 hours..." id="bikeOdoForceRefresh">Force refresh odo</a>';

        // Edit Activity Page
        $('.gear-name').html(newBikeDisplayHTML + '&nbsp&nbsp' + forceRefreshActionHTML).each(function() {

            $('#bikeOdoForceRefresh').on('click', function() {
                this.handleUserBikeOdoForceRefresh_();
            }.bind(this));

        }.bind(this));
    },

    handleUserBikeOdoForceRefresh_: function handleUserBikeOdoForceRefresh_() {
        localStorage.removeItem(this.cacheKey);
        window.location.reload();
    },
};

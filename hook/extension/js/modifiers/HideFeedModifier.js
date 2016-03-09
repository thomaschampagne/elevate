/**
 *   HideFeedModifier is responsible of ...
 */
function HideFeedModifier(userSettings) {
    this.userSettings = userSettings;
}

/**
 * Define prototype
 */
HideFeedModifier.prototype = {

    modify: function modify() {

        var hideFeeds = function() {

            // If hide challenges
            if (this.userSettings.feedHideChallenges) {
                $('.feed-container').find('.challenge').remove();

            }

            // If hide created routes
            if (this.userSettings.feedHideCreatedRoutes) {
                $('div.feed>.min-view').each(function() {
                    if ($('div.feed').find('div.entry-container').has('a[href*=\'/routes\']').length > 0) $(this).remove();
                });
            }


            if (this.userSettings.feedHideRideActivitiesUnderDistance || this.userSettings.feedHideRunActivitiesUnderDistance) {

                var minRideDistanceToHide = this.userSettings.feedHideRideActivitiesUnderDistance;
                var minRunDistanceToHide = this.userSettings.feedHideRunActivitiesUnderDistance;

                $('div.feed>.activity').each(function() {
                    var type = $(this).find('div').first().attr('class').replace('icon-sm', '').replace('  ', ' ').split(' ')[1].replace('icon-sm', '').replace('icon-', '');

                    var distanceEl = _.filter($(this).find('ul.inline-stats').find('[class=unit]'), function (item) {
                    	return ($(item).html() == 'km' || $(item).html() == 'mi');
                    });

                    distance = $(distanceEl).parent().text().replace(',', '.');
                    
                    distance = parseFloat(distance);

                    // Remove Ride activities if distance lower than "minRideDistanceToHide", if minRideDistanceToHide equal 0, then keep all.
                    if ((minRideDistanceToHide > 0) && distance && (distance < minRideDistanceToHide) && (type == "ride" || type == "virtualride")) {
                        $(this).remove();
                    }

                    // Remove Run activities if distance lower than "minRunDistanceToHide", if minRunDistanceToHide equal 0, then keep all.
                    if ((minRunDistanceToHide > 0) && distance && (distance < minRunDistanceToHide) && type == "run") {
                        $(this).remove();
                    }
                });

            }

            // Cleaning time container with no activites
            $('div.feed>.time-header').each(function() {
                timeHeaderElement = $(this);
                if (timeHeaderElement.nextUntil('.time-header').not('script').length === 0) {
                    timeHeaderElement.remove();
                }
            });

        }.bind(this);

        setInterval(hideFeeds, 250);
    },
};

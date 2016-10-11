class HideFeedModifier implements IModifier {

    protected userSettings: IUserSettings;

    constructor(userSettings: IUserSettings) {
        this.userSettings = userSettings;
    }

    public modify(): void {

        const timeout = 250;

        setInterval(() => {

            // If hide challenges
            if (this.userSettings.feedHideChallenges) {
                $('.feed-container').find('.challenge').remove();

            }

            // If hide created routes
            if (this.userSettings.feedHideCreatedRoutes) {
                $('div.feed>.min-view').each((index: number, element: Element) => {
                    if ($('div.feed').find('div.entry-container').has('a[href*=\'/routes\']').length > 0) $(element).remove();
                });
            }

            if (this.userSettings.feedHideRideActivitiesUnderDistance || this.userSettings.feedHideRunActivitiesUnderDistance) {

                let minRideDistanceToHide: number = this.userSettings.feedHideRideActivitiesUnderDistance;
                let minRunDistanceToHide: number = this.userSettings.feedHideRunActivitiesUnderDistance;

                $('div.feed>.activity').each((index: number, element: Element) => {

                    let type: string = $(element).find('div').first().attr('class').replace('icon-sm', '').replace('  ', ' ').split(' ')[1].replace('icon-sm', '').replace('icon-', '');


                    let distanceEl = _.filter($(element).find('ul.inline-stats').find('[class=unit]'), function (item) {
                        return ($(item).html() == 'km' || $(item).html() == 'mi');
                    });

                    let distance: number = parseFloat($(distanceEl).parent().text().replace(',', '.'));

                    // Remove Ride activities if distance lower than "minRideDistanceToHide", if minRideDistanceToHide equal 0, then keep all.
                    if ((minRideDistanceToHide > 0) && distance && (distance < minRideDistanceToHide) && (type === "ride" || type === "virtualride")) {
                        $(element).remove();
                    }

                    // Remove Run activities if distance lower than "minRunDistanceToHide", if minRunDistanceToHide equal 0, then keep all.
                    if ((minRunDistanceToHide > 0) && distance && (distance < minRunDistanceToHide) && type === "run") {
                        $(element).remove();
                    }
                });

            }

            // Cleaning time container with no activites
            $('div.feed>.time-header').each((index: number, element: Element) => {
                let timeHeaderElement: JQuery = $(element);
                if (timeHeaderElement.nextUntil('.time-header').not('script').length === 0) {
                    timeHeaderElement.remove();
                }
            });

        }, timeout);
    }
}

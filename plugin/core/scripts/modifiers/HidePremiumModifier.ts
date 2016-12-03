class HidePremiumModifier implements IModifier {

    public modify(): void {

        // Premium left panel (Heart Rate, Est power curve, Est 25w Distribution)
        // Do not hide premium panel for non premium users watching a premium user activity
        if (!_.isUndefined(window.pageView)) {
            if (window.pageView.activityAthlete() && !window.pageView.activityAthlete().get('premium')) {
                $("#premium-views").hide();
            }
        }

        // Premium features in drop downs (in top header)
        $(".premium").hide();

        // All p elements with (P|p)remium text
        this.hideElementWithInterval("p:contains('remium')");

        // Premium links
        this.hideElementWithInterval("a[href*='premium']");

        // "Upcoming Goal" on dashboard
        $('#performance-goals').hide();

        // Activity of premium guy. Left panel > Premium > Heart rate
        // $('.upsell-others').hide();
        this.hideElementWithInterval(".upsell-others");

        // Filter by Age and Weight on segment view
        this.hideElementWithInterval("li[id*='premium']", '#premium-views');

        // Premium "Set goal" visible on Activity Segments zone
        this.hideElementWithInterval(".button.compact.set-goal");

        // Setting > My Account > "Go Premium Prove that no one loves pushing harder than you."
        $("div[id='upgrade-account-container']").children().first().hide();

        // Learn more about premium...
        $('.js-channel-dashboard-right-top.section').hide();

        // Hide improve your time
        this.hideElementWithInterval('.btn-xs.button.set-goal', null, 750);
        this.hideElementWithInterval('.btn-block.btn-xs.button.training-plans-btn', null, 750);

        // Up sell
        $('.upsell-sm').hide();


        // Setting > My Performance (Full premium tab)
        let element: JQuery = $("a[href='/settings/performance']");
        if (element.length > 0) {
            element.hide();
        }

    }

    protected hideElementWithInterval(selector: string, notSelector?: string, time?: number) {
        // Hide with interval
        setInterval(function () { // TODO Follow registered Elements to track their hide/remove and clearInterval of that function
            if (notSelector) {
                $(selector).not(notSelector).hide();
            } else {
                $(selector).hide();
            }
        }, (time) ? time : 750);
    }
}

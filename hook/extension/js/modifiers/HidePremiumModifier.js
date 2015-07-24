/*
 *   HidePremiumModifier is responsible of ...
 */
function HidePremiumModifier() {}

/**
 * Define prototype
 */
HidePremiumModifier.prototype = {

    /**
     *
     */
    modify: function modify() {

        // Premium left panel (Heart Rate, Est power curve, Est 25w Distribution)
        // Do not hide premium panel for non premium users watching a premium user activity
        if (!_.isUndefined(window.pageView)) {
            if (pageView.activityAthlete() && !pageView.activityAthlete().get('premium')) {
                $("#premium-views").hide();
            }
        }

        // Premium features in drop downs (in top header)
        $(".premium").hide();

        // Premium links
        this.hideElementWithInteval_("a[href*='premium']", null);

        // "Upcoming Goal" on dashboard
        $('#performance-goals').hide();

        // Activity of premium guy. Left panel > Premium > Heart rate
        // $('.upsell-others').hide();
        this.hideElementWithInteval_(".upsell-others", null);

        // Filter by Age and Weight on segment view
        this.hideElementWithInteval_("li[id*='premium']", '#premium-views');

        // Premium "Set goal" visible on Activity Segments zone
        this.hideElementWithInteval_(".button.compact.set-goal", null);

        // Setting > My Account > "Go Premium Prove that no one loves pushing harder than you."
        $("div[id='upgrade-account-container']").children().first().hide();

        // Learn more about premium...
        $('.js-channel-dashboard-right-top.section').hide();

        // Hide improve your time
        this.hideElementWithInteval_('.btn-xs.button.set-goal', null, 750);
        this.hideElementWithInteval_('.btn-block.btn-xs.button.training-plans-btn', null, 750);

        // Up sell
        $('.upsell-sm').hide();
        

        // Setting > My Performance (Full premium tab)
        var element = $("a[href='/settings/performance']");
        if (element.size() > 0) {
            element.hide();
        }

    },

    /**
     *
     */
    hideElementWithInteval_: function hideElementWithInteval_(selector, notSelector, time) {
        // Hide with interval
        setInterval(function() {
            if (notSelector) {
                $(selector).not(notSelector).hide();
            } else {
                $(selector).hide();
            }
        }, (time) ? time : 750);
    },

};

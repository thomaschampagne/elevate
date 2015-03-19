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
                jQuery("#premium-views").hide();
            }
        }

        // Premium features in drop downs (in top header)
        jQuery(".premium").hide();

        // Premium links
        this.hideElementWithInteval_("a[href*='premium']", null);

        // "Upcoming Goal" on dashboard
        jQuery('#performance-goals').hide();

        // Activity of premium guy. Left panel > Premium > Heart rate
        // jQuery('.upsell-others').hide();
        this.hideElementWithInteval_(".upsell-others", null);

        // Filter by Age and Weight on segment view
        this.hideElementWithInteval_("li[id*='premium']", '#premium-views');

        // Premium "Set goal" visible on Activity Segments zone
        this.hideElementWithInteval_(".button.compact.set-goal", null);

        // Setting > My Account > "Go Premium Prove that no one loves pushing harder than you."
        jQuery("div[id='upgrade-account-container']").children().first().hide();

        // Setting > My Performance (Full premium tab)
        var element = jQuery("a[href='/settings/performance']");
        if (element.size() > 0) {
            element.hide();
        }

    },

    /**
     *
     */
    hideElementWithInteval_: function hideElementWithInteval_(selector, notSelector) {
        // Hide with interval
        setInterval(function() {
            if (notSelector) {
                jQuery(selector).not(notSelector).hide();
            } else {
                jQuery(selector).hide();
            }
        }, 750);
    },

};

/**
 *   RunningHeartRateModifier is responsible of ...
 */
function RunningHeartRateModifier () {}

/**
 * Define prototype
 */
RunningHeartRateModifier.prototype = {

    modify: function modify() {

        var runningHeartRateModifier = function() {
            var element = $('#elevation-profile td[data-type=heartrate] .toggle-button')
                .not('.once-only')
                .addClass('once-only');
            element.click();
         }.bind(this);

        setInterval(runningHeartRateModifier, 750);
    },
};

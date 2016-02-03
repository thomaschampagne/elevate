/**
 *   RunningHeartRateModifier is responsible of ...
 */
function RunningHeartRateModifier() {}

/**
 * Define prototype
 */
RunningHeartRateModifier.prototype = {

    modify: function modify() {

        var dataWatch = 'heartrate';

        var runningHeartRateModifier = function() {

            var element = $('#elevation-profile td[data-type=' + dataWatch + '] .toggle-button')
                .not('.once-only')
                .addClass('once-only');
            element.click();

            if ($('#elevation-profile td[data-type=' + dataWatch + ']').find('.active').length) {
                clearInterval(modifierLoop);
            }

        }.bind(this);

        var modifierLoop = setInterval(runningHeartRateModifier, 750);
        
    },
};

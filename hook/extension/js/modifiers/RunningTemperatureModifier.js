/**
 *   RunningTemperatureModifier is responsible of ...
 */
function RunningTemperatureModifier() {}

/**
 * Define prototype
 */
RunningTemperatureModifier.prototype = {

    modify: function modify() {

        var dataWatch = 'temp';

        var runningTemperatureModifier = function() {

            var element = $('#elevation-profile td[data-type=' + dataWatch + '] .toggle-button')
                .not('.once-only')
                .addClass('once-only');
            element.click();

            if ($('#elevation-profile td[data-type=' + dataWatch + ']').find('.active').length) {
                clearInterval(modifierLoop);
            }

        }.bind(this);

        var modifierLoop = setInterval(runningTemperatureModifier, 750);
    },
};

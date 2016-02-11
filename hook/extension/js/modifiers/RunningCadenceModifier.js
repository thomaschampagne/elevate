/**
 *   RunningCadenceModifier is responsible of ...
 */
function RunningCadenceModifier() {}

/**
 * Define prototype
 */
RunningCadenceModifier.prototype = {

    modify: function modify() {

        var dataWatch = 'cadence';

        var runningCadenceModifier = function() {

            var element = $('#elevation-profile td[data-type=' + dataWatch + '] .toggle-button')
                .not('.once-only')
                .addClass('once-only');
            element.click();

            if ($('#elevation-profile td[data-type=' + dataWatch + ']').find('.active').length) {
                clearInterval(modifierLoop);
            }

        }.bind(this);

        var modifierLoop = setInterval(runningCadenceModifier, 750);
    },
};

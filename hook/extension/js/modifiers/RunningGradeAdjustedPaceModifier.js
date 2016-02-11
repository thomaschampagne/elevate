/**
 *   RunningGradeAdjustedPaceModifier is responsible of ...
 */
function RunningGradeAdjustedPaceModifier() {}

/**
 * Define prototype
 */
RunningGradeAdjustedPaceModifier.prototype = {

    modify: function modify() {

        var dataWatch = 'grade_adjusted_pace';

        var runningGradeAdjustedPaceModifier = function() {

            var element = $('#elevation-profile td[data-type=' + dataWatch + '] .toggle-button')
                .not('.once-only')
                .addClass('once-only');
            element.click();

            if ($('#elevation-profile td[data-type=' + dataWatch + ']').find('.active').length) {
                clearInterval(modifierLoop);
            }

        }.bind(this);

        var modifierLoop = setInterval(runningGradeAdjustedPaceModifier, 750);
    },
};

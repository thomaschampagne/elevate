/**
 *   RunningGradeAdjustedPaceModifier is responsible of ...
 */
function RunningGradeAdjustedPaceModifier () {}

/**
 * Define prototype
 */
RunningGradeAdjustedPaceModifier.prototype = {

    modify: function modify() {

        var runningGradeAdjustedPace = function() {
            var element = jQuery('#elevation-profile td[data-type=grade_adjusted_pace] .toggle-button')
                .not('.once-only')
                .addClass('once-only');
            element.click();
         }.bind(this);

        setInterval(runningGradeAdjustedPace, 750);
    },
};

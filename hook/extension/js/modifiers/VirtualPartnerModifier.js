/**
 *   VirtualPartnerModifier is responsible of ...
 */
function VirtualPartnerModifier(activityId) {
    this.activityId = activityId;
}

/**
 * Define prototype
 */
VirtualPartnerModifier.prototype = {

    modify: function modify() {

        var view = Strava.Labs.Activities.SegmentLeaderboardView;

        if (!view) {
            return;
        }

        console.debug('VirtualPartnerModifier on ' + this.activityId);
        // console.debug('VirtualPartnerModifier on effort ' + $('.analysis-link-js.btn-xs.button').attr( 'data-segment-effort-id'));

        var functionRender = view.prototype.render;

        var self = this;

        var exportButtonHtml = '<a class="btn-block btn-xs button raceshape-btn" id="stravistix_exportVpu">Export effort as Virtual Partner</a>';

        view.prototype.render = function() {

            var r = functionRender.apply(this, Array.prototype.slice.call(arguments));

            $('.raceshape-btn').after(exportButtonHtml).each(function() {

                $('#stravistix_exportVpu').click(function(evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    self.displayRaceShapePopup();
                });
            });
            return r;
        };
    },

    displayRaceShapePopup: function() {

        var effortId = $('.analysis-link-js.btn-xs.button').attr('data-segment-effort-id');

        var types = ['CRS', 'TCX', 'GPX'];

        var dlButton = '';

        _.each(types, function(t) {
            dlButton += '<a class="button btn-block btn-primary" style="margin-bottom: 15px;" href="http://raceshape.com/strava.export.php?effort=' + effortId + '|' + this.activityId + '&type=' + t + '">';
            dlButton += 'Download effort as .' + t;
            dlButton += '</a>';
        }.bind(this));

        var title = 'Export effort as Virtual Partner';
        var message = 'You are going to download a course file from raceshape.com.<br/><br/>If you are using a garmin device put downloaded file into <strong>NewFiles/*</strong> folder.<br/><br/>' + dlButton;

        $.fancybox('<h3>' + title + '</h3><h4>' + message + '</h4>');
    }
};

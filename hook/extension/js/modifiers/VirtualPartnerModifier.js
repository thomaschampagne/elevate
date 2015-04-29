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

        var dlButton = '<a class="button btn-block btn-primary" href="http://raceshape.com/strava.export.php?effort=' + $('.analysis-link-js.btn-xs.button').attr('data-segment-effort-id') + '|' + this.activityId + '&type=CRS">';
        dlButton += 'Download effort as Virtual Partner';
        dlButton += '</a>';

        var title = 'Export effort as Virtual Partner';
        var message = 'You are going to download a <strong>.crs</strong> file from raceshape.com. If you are using a garmin device put downloaded file into NewFiles/* folder.<br/><br/>' + dlButton;

        $.fancybox('<h2>' + title + '</h2><h3>' + message + '</h3>');
    }
};

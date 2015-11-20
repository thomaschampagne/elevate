/**
 *   DefaultLeaderboardFilterModifier is responsible of ...
 */
function DefaultLeaderboardFilterModifier(defaultLeaderboardFilter) {
	this.defaultLeaderboardFilter_ = defaultLeaderboardFilter;
}

/**
 * Define prototype
 */
DefaultLeaderboardFilterModifier.prototype = {

    modify: function modify() {

        if (this.defaultLeaderboardFilter_ === 'overall') {
            return;
        }
    
        var view = Strava.Labs.Activities.SegmentLeaderboardView;

        if (!view) {
            return;
        }

        var functionRender = view.prototype.render;

        var self = this;

        view.prototype.render = function() {
            var r = functionRender.apply(this, Array.prototype.slice.call(arguments));
            $(this.el).not('.once-only').addClass('once-only').find('.clickable[data-filter=' + self.defaultLeaderboardFilter_ + ']').click();
            return r;
        };
    },
};

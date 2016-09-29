class DefaultLeaderBoardFilterModifier implements IModifier {

    protected defaultLeaderBoardFilter: string;

    constructor(defaultLeaderBoardFilter: string) {
        this.defaultLeaderBoardFilter = defaultLeaderBoardFilter;
    }

    public modify(): void {

        if (this.defaultLeaderBoardFilter === 'overall') {
            return;
        }

        let view:any = Strava.Labs.Activities.SegmentLeaderboardView;

        if (!view) {
            return;
        }

        let functionRender = view.prototype.render;

        let that: any = this;

        view.prototype.render = function () {
            let r = functionRender.apply(this, Array.prototype.slice.call(arguments));
            $(this.el).not('.once-only').addClass('once-only').find('.clickable[data-filter=' + that.defaultLeaderBoardFilter + ']').click();
            return r;
        };
    }
}

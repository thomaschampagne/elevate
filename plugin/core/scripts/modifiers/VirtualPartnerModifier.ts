class VirtualPartnerModifier implements IModifier {

    protected activityId: number;

    constructor(activityId: number) {
        this.activityId = activityId;

    }

    modify(): void {

        if (!Strava.Labs) {
            return;
        }

        let view: any = Strava.Labs.Activities.SegmentLeaderboardView;

        if (!view) {
            return;
        }

        let functionRender: Function = view.prototype.render;

        let that = this;

        view.prototype.render = function () {

            let r: any = functionRender.apply(this, Array.prototype.slice.call(arguments));

            if ($('.stravistix_exportVpu').length < 1) {

                let exportButtonHtml: string = '<a class="btn-block btn-xs button raceshape-btn stravistix_exportVpu" id="stravistix_exportVpu">Export effort as Virtual Partner</a>';

                $('.raceshape-btn').first().after(exportButtonHtml).each(function () {

                    $('#stravistix_exportVpu').click(function (evt) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        that.displayRaceShapePopup();
                    });

                    return;
                });
            }
            /*
             // TODO Support Running VPU
             else {
             // Running export
             let exportButtonHtml = '<div class="spans8"><a href="/segments/6330649?filter=my_results">View My Efforts</a></div>';
             $('.bottomless.inset').after(exportButtonHtml);
             }*/
            return r;
        };
    }

    protected displayRaceShapePopup() {

        let effortId: number = parseInt(window.location.pathname.split('/')[4] || window.location.hash.replace('#', ''));

        let coursesTypesExport: Array<string> = ['CRS', 'TCX', 'GPX'];

        let dlButton: string = '';

        _.each(coursesTypesExport, (type: string) => {
            dlButton += '<a class="button btn-block btn-primary" style="margin-bottom: 15px;" href="http://raceshape.com/strava.export.php?effort=' + effortId + '|' + this.activityId + '&type=' + type + '">';
            dlButton += 'Download effort as .' + type;
            dlButton += '</a>';
        });

        let title: string = 'Export effort as Virtual Partner';
        let message: string = 'You are going to download a course file from raceshape.com.<br/><br/>If you are using a garmin device put downloaded file into <strong>NewFiles/*</strong> folder.<br/><br/>' + dlButton;

        $.fancybox('<h3>' + title + '</h3><h4>' + message + '</h4>');
    }
}

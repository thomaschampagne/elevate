/**
 *   RemoteLinksModifier is responsible of ...
 */
class RemoteLinksModifier implements IModifier {

    protected appResources: IAppResources;
    protected authorOfActivity: boolean;
    protected activityId: number;

    constructor(appResources: IAppResources, authorOfActivity: boolean, activityId: number) {
        this.appResources = appResources;
        this.authorOfActivity = authorOfActivity;
        this.activityId = activityId;
    }

    modify(): void {
        if (!_.isUndefined(window.pageView)) {
            this.modifyActivityPage();
        }
        // if segment page is matching url
        if (!_.isNull(window.location.pathname.match(/^\/segments\/(\d+)$/))) {
            this.modifySegmentPage();
        }
    }

    modifyActivityPage(): void {

        let remoteViewActivityLinksArray: Array<Array<string>> = [
            ["VeloViewer", 'http://veloviewer.com/activities/', '?referrer=stravistiX', ''],
            ["Surface", 'http://strava-tools.raceshape.com/erea/?url=', '', '']
        ];


        // Activity page
        // Adding remote view links on left panel
        let html: string = "<li class='group'>";
        html += "<div class='title' id='stravistix_remote_title' style='font-size: 14px; cursor: pointer;'>Remote Views</div>";
        html += "<ul style='display: none;' id='stravistix_remoteViews'>";
        _.each(remoteViewActivityLinksArray, (linkArray: Array<string>) => {
            html += "<li>";
            html += "<a data-menu='' " + linkArray[3] + " target='_blank' style='color: #333;' href='" + linkArray[1] + this.activityId + linkArray[2] + "'>" + linkArray[0] + "</a>";
        });
        html += "</ul>";
        html += "</li>";

        $("#pagenav").append($(html)).each(() => {

            $('[data-remote-views]').click((evt: Event) => {
                evt.preventDefault();
                evt.stopPropagation();
            });

            $('#stravistix_remote_title').click((evt: Event) => {

                evt.preventDefault();
                evt.stopPropagation();

                if ($('#stravistix_remoteViews').is(':visible')) {
                    $('#stravistix_remoteViews').slideUp();
                } else {
                    $('#stravistix_remoteViews').slideDown();
                }

            });

        });

        // Add tcx export
        if (this.authorOfActivity) {
            let htmlForTCXExport: string = "<li><a href='" + window.location.pathname + "/export_tcx'>Export TCX</a></li>";
            $(".actions-menu .slide-menu .options").append(htmlForTCXExport);
        }
    }

    modifySegmentPage(): void {

        // Segment external links
        let segmentData: Array<string> = window.location.pathname.match(/^\/segments\/(\d+)$/);

        if (_.isNull(segmentData)) {
            return;
        }

        // Getting segment id
        let segmentId: number = parseInt(segmentData[1]);

        let remoteViewSegmentLinksArray: Array<Array<string>> = [
            ["<img width='24px' style='vertical-align:middle' src='" + this.appResources.veloviewerIcon + "'/> <span>VeloViewer</span>", 'http://veloviewer.com/segment/', '?referrer=stravistiX'],
            ["<img width='24px' style='vertical-align:middle' src='" + this.appResources.pollIcon + "'/> <span>Segment details (Jonathan Okeeffe)</span>", 'http://www.jonathanokeeffe.com/strava/segmentDetails.php?segmentId=', '']
        ];
        let html: string = "<div class='dropdown' style='padding-bottom: 10px;'>";
        html += "<div class='drop-down-menu' style='width: 100%;' >";
        html += "<button class='btn btn-default dropdown-toggle'><img style='vertical-align:middle' src='" + this.appResources.remoteViewIcon + "'/> <span>Remote Segment View</span> <span class='app-icon-wrapper '><span class='app-icon icon-strong-caret-down icon-dark icon-xs'></span></span></button>";
        html += "<ul class='options' style='z-index: 999;'>";

        _.each(remoteViewSegmentLinksArray, (linkArray: Array<string>) => {
            html += "<li><a target='_blank' href='" + linkArray[1] + segmentId + linkArray[2] + "'>" + linkArray[0] + "</a></li>";
        });
        html += "</ul>";
        html += "</div>";
        html += "</div>";
        $(html).prependTo('.segment-activity-my-efforts');
    }

}

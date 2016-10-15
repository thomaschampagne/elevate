class ReliveCCModifier implements IModifier {

    private activityId: number;

    constructor(activityId: number) {
        this.activityId = activityId;
    }

    public modify(): void {

        let html: string = "<li class='group'>";
        html += "<div class='title' style='font-size: 14px; cursor: pointer;' id='stravistix_relivecc'>Relive Ride <sup style='color:#FC4C02; font-size:10px;'>NEW</sup></div>";

        $("#pagenav").append($(html)).each(() => {

            $('#stravistix_relivecc').click((evt: Event) => {

                evt.preventDefault();
                evt.stopPropagation();

                let url: string = 'https://www.relive.cc/view/' + this.activityId;

                let embedUrl: string = url + '/embed';

                let windowWidth: number = window.innerWidth * 0.50;

                $.fancybox({
                    fitToView: true,
                    autoSize: true,
                    closeClick: false,
                    openEffect: 'none',
                    closeEffect: 'none',
                    scrolling: 'no',
                    'type': 'iframe',
                    'content': '<div style="text-align:center;"><a href="' + url + '" target="_blank">View in relive.cc website</a></div><iframe src="' + embedUrl + '" width="' + windowWidth + '" height="' + windowWidth * 9 / 16 + '" frameborder="0"></iframe>'
                });
            });
        });
    }
}


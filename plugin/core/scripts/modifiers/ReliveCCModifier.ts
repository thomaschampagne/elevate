export class ReliveCCModifier implements IModifier {

    private activityId: number;

    constructor(activityId: number) {
        this.activityId = activityId;
    }

    public modify(): void {

        let html: string = "<li class='group'>";
        html += "<div class='title' style='cursor: pointer;' id='stravistix_relivecc'>Relive</div>";

        $("#pagenav").append($(html)).each(() => {

            $("#stravistix_relivecc").click((evt: JQuery.Event) => {

                evt.preventDefault();
                evt.stopPropagation();

                const url: string = "https://www.relive.cc/view/" + this.activityId + "?r=stravistix";

                const windowWidth: number = 800;
                const windowHeight: number = 600;

                $.fancybox({
                    fitToView: true,
                    autoSize: true,
                    closeClick: false,
                    openEffect: "none",
                    closeEffect: "none",
                    scrolling: "no",
                    type: "iframe",
					content: "<iframe src=\"" + url + "\" width=\"" + windowWidth + "\" height=\"" + windowHeight + "\" frameborder=\"0\"></iframe>",
                });
            });
        });
    }
}

import * as _ from "lodash";

export class ActivityScrollingModifier implements IModifier {

    public modify(): void {

        if (window.location.pathname.indexOf("/dashboard") === -1) {
            return;
        }

        const w: JQuery = $(window);
        const container: JQuery = $(".feed-container");

        w.scroll(function() {
            const elem: JQuery = container.find("a.load-feed");
            if (_.isEqual(elem.length, 0)) {
                return;
            }
            const offset: number = 50;
            const elem_top: number = elem.offset().top;
            const window_top: number = w.scrollTop();
            const window_bottom: number = w.height() + window_top;
            if ((elem_top >= window_top + offset) && (elem_top < window_bottom)) {
                elem.click().remove();
            }
        });
    }
}

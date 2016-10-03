class ActivityScrollingModifier implements IModifier {

    public modify(): void {

        if (window.location.pathname.indexOf('/dashboard') === -1) {
            return;
        }

        let w: JQuery = $(window);
        let container: JQuery = $('.feed-container');

        w.scroll(function () {
            let elem: JQuery = container.find('a.load-feed');
            if (_.isEqual(elem.length, 0)) {
                return;
            }
            let offset: number = 50;
            let elem_top: number = elem.offset().top;
            let window_top: number = w.scrollTop();
            let window_bottom: number = w.height() + window_top;
            if ((elem_top >= window_top + offset) && (elem_top < window_bottom)) {
                elem.click().remove();
            }
        });
    }
}

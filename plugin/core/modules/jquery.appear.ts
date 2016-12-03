/*
 * jQuery appear plugin
 *
 * Copyright (c) 2012 Andrey Sidorov
 * licensed under MIT license.
 *
 * https://github.com/morr/jquery.appear/
 *
 * Version: 0.3.6
 *
 * Converted to TypeScript By Thomas Champagne
 */

interface JQuery {
    appear: Function;
}

interface JQueryStatic {
    force_appear: Function;
}

(function ($: JQueryStatic) {
    let selectors: Array<JQuery> = [];

    let check_binded: boolean = false;
    let check_lock: boolean = false;
    let defaults: any = {
        interval: 250,
        force_process: false
    };

    let $window: JQuery = $(window);

    let $prior_appeared: Array<JQuery> = [];

    function process() {
        check_lock = false;
        for (let index: number = 0, selectorsLength = selectors.length; index < selectorsLength; index++) {
            let $appeared = $(selectors[index]).filter(function () {
                return $(this).is(':appeared');
            });

            $appeared.trigger('appear', [$appeared]);

            if ($prior_appeared[index]) {
                let $disappeared: JQuery = $prior_appeared[index].not($appeared);
                $disappeared.trigger('disappear', [$disappeared]);
            }
            $prior_appeared[index] = $appeared;
        }
    };

    function add_selector(selector: JQuery) {
        selectors.push(selector);
        $prior_appeared.push();
    }

    // "appeared" custom filter
    $.expr[':']['appeared'] = function (element: HTMLElement) {
        let $element: JQuery = $(element);
        if (!$element.is(':visible')) {
            return false;
        }

        let window_left: number = $window.scrollLeft();
        let window_top: number = $window.scrollTop();
        let offset: any = $element.offset();
        let left: number = offset.left;
        let top: number = offset.top;

        if (top + $element.height() >= window_top &&
            top - ($element.data('appear-top-offset') || 0) <= window_top + $window.height() &&
            left + $element.width() >= window_left &&
            left - ($element.data('appear-left-offset') || 0) <= window_left + $window.width()) {
            return true;
        } else {
            return false;
        }
    };

    $.fn.extend({
        // watching for element's appearance in browser viewport
        appear: function (options: any) {
            let opts: any = $.extend({}, defaults, options || {});
            let selector = this.selector || this;
            if (!check_binded) {
                let on_check = function () {
                    if (check_lock) {
                        return;
                    }
                    check_lock = true;

                    setTimeout(process, opts.interval);
                };

                $(window).scroll(on_check).resize(on_check);
                check_binded = true;
            }

            if (opts.force_process) {
                setTimeout(process, opts.interval);
            }
            add_selector(selector);
            return $(selector);
        }
    });

    $.extend({
        // force elements's appearance check
        force_appear: function () {
            if (check_binded) {
                process();
                return true;
            }
            return false;
        }
    });
})(function () {
    return jQuery;
}());

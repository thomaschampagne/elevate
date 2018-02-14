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
    expr: any;
}

(function ($: JQueryStatic) {
    const selectors: JQuery[] = [];

	let check_binded = false;
	let check_lock = false;
    const defaults: any = {
        interval: 250,
        force_process: false,
    };

    const $window: JQuery = $(window);

    const $prior_appeared: JQuery[] = [];

    function process() {
        check_lock = false;
		for (let index = 0, selectorsLength = selectors.length; index < selectorsLength; index++) {
			const $appeared = $(selectors[index]).filter(function () {
                return $(this).is(":appeared");
            });

            $appeared.trigger("appear", [$appeared]);

            if ($prior_appeared[index]) {
                const $disappeared: JQuery = $prior_appeared[index].not($appeared);
                $disappeared.trigger("disappear", [$disappeared]);
            }
            $prior_appeared[index] = $appeared;
        }
    }

    function add_selector(selector: JQuery) {
        selectors.push(selector);
        $prior_appeared.push();
    }

    // "appeared" custom filter
	$.expr[":"].appeared = function (element: HTMLElement) {
        const $element: JQuery = $(element);
        if (!$element.is(":visible")) {
            return false;
        }

        const window_left: number = $window.scrollLeft();
        const window_top: number = $window.scrollTop();
        const offset: any = $element.offset();
        const left: number = offset.left;
        const top: number = offset.top;

        if (top + $element.height() >= window_top &&
            top - ($element.data("appear-top-offset") || 0) <= window_top + $window.height() &&
            left + $element.width() >= window_left &&
            left - ($element.data("appear-left-offset") || 0) <= window_left + $window.width()) {
            return true;
        } else {
            return false;
        }
    };

    $.fn.extend({
        // watching for element's appearance in browser viewport
        appear(options: any) {
            const opts: any = $.extend({}, defaults, options || {});
            const selector = this.selector || this;
            if (!check_binded) {
				const on_check = function () {
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
        },
    });

    $.extend($, {
        // force elements's appearance check
        force_appear() {
            if (check_binded) {
                process();
                return true;
            }
            return false;
        },
    });
})(function () {
    return jQuery;
}());

/**
 *   OpenStreetMapModifier is responsible of ...
 */
function OpenStreetMapModifier() {}

/**
 * Define prototype
 */
OpenStreetMapModifier.prototype = {

    modify: function modify() {

        if (!_.isUndefined(window.pageView)) {
            this.modifyPage_();
        }
    },

    modifyPage_: function modifyPage_() {

        this.htmlOsmMapsStyle = 'background: #fc4c02; color: #333;';
        this.htmlRemoteViewTextStyle = 'color: white;';

        var remoteViewActivityLinksArray = [
            ['Cycle', 'cycle'],
            ['Landscape', 'landscape'],
            ['Street', 'street'],
            ['Os', 'os'],
            ['Outdoors', 'outdoors']
        ];

        var htmlOsmMaps = "<li class='group'>";
        htmlOsmMaps += "<div class='title'><span style='font-size: 14px;'>OpenStreetMap</span></div>";
        htmlOsmMaps += "<ul>";
        $.each(remoteViewActivityLinksArray, function() {
            htmlOsmMaps += "<li>";
            htmlOsmMaps += "<a data-osm-map-flip='" + this[1] + "' href='#'>" + this[0] + "</a>";
            htmlOsmMaps += "</li>";
        });
        htmlOsmMaps += "</ul>";
        htmlOsmMaps = $(htmlOsmMaps);

        var self = this;

        $("#pagenav").append(htmlOsmMaps).each(function() {

            $('[data-osm-map-flip]').click(function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                self.flipMap_(this.getAttribute('data-osm-map-flip'));
            });

        });
    },

    flipMap_: function(map) {

        // Ensure we are on satellite map first
        $('a.map-type-selector[data-map-type-id=\'satellite\']')
            .not('.once-only')
            .addClass('once-only')
            .click()
            .parents('.drop-down-menu') // Close menu
            .click();

        // Then flip to OSN map
        vv_flipMap(map);
    }
};

// select satellite view first: $('[data-map-type-id=satellite]').click()

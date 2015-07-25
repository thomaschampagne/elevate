/**
 *   ActivityBestSplitsModifier is responsible of ...
 */
function ActivityBestSplitsModifier() {}

/**
 * Define prototype
 */
ActivityBestSplitsModifier.prototype = {

    modify: function modify() {

        // wait for Segments section load
        if ($("#segments").length === 0) {
            setTimeout(function() {
                modify();
            }, 500);
            return;
        }

        var segments = $("#segments");
        
        var bestSplitsHeader = $("<h3 class=\"inset segments-header bestsplits-header-title\" style='cursor: pointer'>Best Splits</h3>");
        
        var segmentsHeader = segments.find("h3.segments-header")
                                .css("font-weight", "bold")
                                .css("text-decoration", "underline")
                                .css("cursor", "pointer")
                                .addClass("segments-header-title")
                                .before(bestSplitsHeader);
        
        var bestSplitsSection = $("<section id='bestsplits' class='pinnable-anchor' style='display: none;'></section>");
        bestSplitsSection.append(segments.find("div.row:first").clone()).appendTo($("#segments-container"));

        $(".bestsplits-header-title").click(function() {
            $(".bestsplits-header-title").css("font-weight", "bold").css("text-decoration", "underline");
            $(".segments-header-title").css("font-weight", "normal").css("text-decoration", "none");
            segments.hide();
            bestSplitsSection.show();
        });
        
        $(".segments-header-title").click(function() {
            $(".segments-header-title").css("font-weight", "bold").css("text-decoration", "underline");
            $(".bestsplits-header-title").css("font-weight", "normal").css("text-decoration", "none");            
            bestSplitsSection.hide();
            segments.show();            
        });
        
        // when a user clicks 'Analysis' #segments element is removed so we have to wait for it and re-run modifier function
        var waitForSegmentsSectionRemoved = function() {
            if ($("#segments").length !== 0) {
                setTimeout(function() {
                    waitForSegmentsSectionRemoved();
                }, 1000);
                return;
            }
            modify();
        };
        waitForSegmentsSectionRemoved();
    },
};

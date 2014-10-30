/**
 *   SegmentRankPercentageModifier is responsible of ...
 */
function SegmentRankPercentageModifier() {

}

/**
 * Define prototype
 */
SegmentRankPercentageModifier.prototype = {

    modify: function modify() {

        var self = this;
        setInterval(function() {
            self.addPercentageRanking_();
        }, 750);

    },

    addPercentageRanking_: function addPercentageRanking_() {

        this.standing = jQuery('.leaders').find("table").find(".standing");
        
        // Clean
        this.ranking = this.standing.children().last().text().trim().replace("\n", "").replace(/ /g, '').split('/');

        // Remove previous percentageRanking element if exist
        this.standing.parent().find('.percentageRanking').remove();

        // Rewrite percentage after ranking            
        this.standing.after('<td class="percentageRanking"><h3>Rank %</h3><strong>' + (this.ranking[0] / this.ranking[1] * 100).toFixed(2) + '%</strong></td>');
    }
};

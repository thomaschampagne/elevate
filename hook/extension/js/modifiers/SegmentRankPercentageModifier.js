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

        this.addPercentageRankingLoop = setInterval(function() {
            this.addPercentageRanking();
        }.bind(this), 750);

    },

    addPercentageRanking: function() {

        console.debug('Adding Percentage Ranking');

        var self = this;

        this.standing = $('.leaders').find("table").find(".standing");

        // Clean
        this.ranking = this.standing.children().last().text().trim().replace("\n", "").replace(/ /g, '').split('/');

        var percentage;

        if (_.isNaN(parseInt(this.ranking[0]))) {
            percentage = '-';
        } else {
            percentage = (this.ranking[0] / this.ranking[1] * 100).toFixed(2) + '%';
        }

        // Rewrite percentage after ranking
        this.standing.after('<td class="percentageRanking"><h3>Rank %</h3></br><strong>' + percentage + '</strong></td>');

        if ($('.percentageRanking').size()) {
            clearInterval(self.addPercentageRankingLoop);
        }
    }
};

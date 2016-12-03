class SegmentRankPercentageModifier implements IModifier {

    protected intervalId: number;

    constructor() { }

    modify(): void {
        this.intervalId = setInterval(() => this.addPercentageRanking(), 750);
    }

    addPercentageRanking(): void {

        console.debug('Adding Percentage Ranking');

        let standing: JQuery = $('.leaders').find("table").find(".standing");

        // Clean
        let ranking: Array<string> = standing.children().last().text().trim().replace("\n", "").replace(/ /g, '').split('/');

        let percentage: string;

        if (_.isNaN(parseInt(ranking[0]))) {
            percentage = '-';
        } else {
            percentage = (parseInt(ranking[0]) / parseInt(ranking[1]) * 100).toFixed(2) + '%';
        }
        // Rewrite percentage after ranking
        standing.after('<td class="percentageRanking"><h3>Rank %</h3><strong>' + percentage + '</strong></td>');

        if ($('.percentageRanking').length) {
            clearInterval(this.intervalId);
        }
    }
}

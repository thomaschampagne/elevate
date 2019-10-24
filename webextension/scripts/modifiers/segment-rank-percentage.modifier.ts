import * as _ from "lodash";
import { AbstractModifier } from "./abstract.modifier";

export class SegmentRankPercentageModifier extends AbstractModifier {

	protected intervalId: number;

	modify(): void {
		this.intervalId = window.setInterval(() => this.addPercentageRanking(), 750);
	}

	public addPercentageRanking(): void {

		console.debug("Adding Percentage Ranking");

		const standing: JQuery = $(".leaders").find("table").find(".standing");

		// Clean
		const ranking: string[] = standing.children().last().text().trim()
			.replace(/\\n/g, "").replace(/ /g, "").split("/");

		let percentage: string;

		if (_.isNaN(parseInt(ranking[0], 10))) {
			percentage = "-";
		} else {
			percentage = (parseInt(ranking[0], 10) / parseInt(ranking[1], 10) * 100).toFixed(2) + "%";
		}
		// Rewrite percentage after ranking
		standing.after("<td class=\"percentageRanking standing text-nowrap\">" +
			"<h5 class=\"topless text-uppercase\">Rank</h5><span class=\"text-title1\">" + percentage + "</span></td>");

		if ($(".percentageRanking").length) {
			clearInterval(this.intervalId);
		}
	}
}

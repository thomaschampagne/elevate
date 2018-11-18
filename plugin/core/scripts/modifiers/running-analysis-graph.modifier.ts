import { AbstractModifier } from "./abstract.modifier";

export class RunningAnalysisGraph extends AbstractModifier {
	public modify(): void {

		let html = "<li>";
        html += "<a data-menu='analysis/0/0' data-menu-alt='analysis' href='javascript:;'>Analysis Graph</a>";
        html += "</li>";

        $("[data-menu=\"segments\"]").parents("li").before($(html));
	}
}

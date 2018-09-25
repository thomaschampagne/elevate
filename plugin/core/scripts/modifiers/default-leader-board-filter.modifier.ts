import { AbstractModifier } from "./abstract.modifier";

export class DefaultLeaderBoardFilterModifier extends AbstractModifier {

	protected defaultLeaderBoardFilter: string;

	constructor(defaultLeaderBoardFilter: string) {
		super();
		this.defaultLeaderBoardFilter = defaultLeaderBoardFilter;
	}

	public modify(): void {

		if (this.defaultLeaderBoardFilter === "overall") {
			return;
		}

		const view: any = Strava.Labs.Activities.SegmentLeaderboardView;

		if (!view) {
			return;
		}

		const functionRender = view.prototype.render;

		const that: any = this;

		view.prototype.render = function () {
			const r = functionRender.apply(this, Array.prototype.slice.call(arguments));
			$(this.el).not(".once-only").addClass("once-only").find(".clickable[data-filter=" + that.defaultLeaderBoardFilter + "]").click();
			return r;
		};
	}
}

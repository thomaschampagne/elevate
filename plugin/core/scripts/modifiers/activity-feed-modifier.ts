import { AbstractModifier } from "./abstract.modifier";
import { UserSettingsModel } from "../shared/models/user-settings/user-settings.model";

export class ActivityFeedModifier extends AbstractModifier {
	protected userSettings: UserSettingsModel;

	constructor(userSettings: UserSettingsModel) {
		super();
		this.userSettings = userSettings;
	}

	public modify(): void {
		if (this.userSettings.feedChronologicalOrder) {
			this.orderFeedItems();

			const orderButtonDiv = d3.select(".container-nav-inner").insert("ul", ".user-nav").attr("class", "nav-group").style({
				margin: "0 0 0 20px",
				float: "left"
			}).append("li").style({
				float: "left",
				height: "55px"
			});

			orderButtonDiv.append("a").style({
				"padding-top": "12px"
			}).append("button").attr("class", "btn btn-sm btn-secondary").style({
				float: "left",
			})
				.on("click", () => {
					this.orderFeedItems();
				}).attr("title", "Click to sort currently listed activities chronologically by start time.")
				.html("Reorder Feed");
		}
	}

	public orderFeedItems(): void {

		const feedItems: any[] = [];
		d3.selectAll(".activity.feed-entry, .group-activity.feed-entry, .post.feed-entry").datum(function () {
			const m = (d3.select(this).select("time").attr("datetime")).match(/([0-9]{4})-([0-9]{2})-([0-9]{2})[ ]?[T]?([0-9]{2}):([0-9]{2}):([0-9]{2})/);
			const d = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
			feedItems.push(d);
			return d;
		});

		feedItems.sort(d3.descending);
		d3.selectAll(".activity.feed-entry, .group-activity.feed-entry, .post.feed-entry").data(feedItems, function (d) {
			return d;
		}).order();
	}
}

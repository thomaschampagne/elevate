import { AbstractModifier } from "./abstract.modifier";
import { UserSettingsModel } from "../../../shared/models/user-settings/user-settings.model";
import * as _ from "lodash";

export class ActivityFeedModifier extends AbstractModifier {

	private static readonly DEBOUNCE_ORDER_FEED_ITEMS_TIME: number = 1000;

	protected userSettings: UserSettingsModel;

	constructor(userSettings: UserSettingsModel) {
		super();
		this.userSettings = userSettings;
	}

	public modify(): void {

		if (this.userSettings.feedChronologicalOrder) {

			const debounceOrderFeedItems = _.debounce(this.orderFeedItems, ActivityFeedModifier.DEBOUNCE_ORDER_FEED_ITEMS_TIME);

			window.addEventListener("scroll", (e: UIEvent) => {
				debounceOrderFeedItems();
			});

			this.orderFeedItems();
		}
	}

	public orderFeedItems(): void {

		setTimeout(() => {

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

		});
	}
}

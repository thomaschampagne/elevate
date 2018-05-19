export class ActivityBikeOdoModifier implements IModifier {
	private bikeOdoArray: any;
	private cacheKey: string;

	constructor(bikeOdoArray: any, cacheKey: string) {
		this.bikeOdoArray = bikeOdoArray;
		this.cacheKey = cacheKey;
	}

	public modify(): void {

		// Get bike name on Activity Page
		const bikeDisplayedOnActivityPage: string = $(".gear-name").text().trim();

		// Get odo from map
		let activityBikeOdo = "No bike declared";
		try {
			activityBikeOdo = this.bikeOdoArray[btoa(window.unescape(encodeURIComponent(bikeDisplayedOnActivityPage)))] || activityBikeOdo;
		} catch (err) {
			console.warn("Unable to find bike odo for this Activity");
		}

		const newBikeDisplayHTML: string = bikeDisplayedOnActivityPage + "<strong> / " + activityBikeOdo + "</strong>";

		const forceRefreshActionHTML = "<a href=\"#\" style=\"cursor: pointer;\" title=\"Force odo refresh for this athlete's bike. Usually it refresh every 2 hours...\" id=\"bikeOdoForceRefresh\">Force refresh odo</a>";

		// Edit Activity Page
		$(".gear-name").html(newBikeDisplayHTML + "<br />" + forceRefreshActionHTML).each(() => {

			$("#bikeOdoForceRefresh").on("click", () => {
				this.handleUserBikeOdoForceRefresh();
			});

		});
	}

	protected handleUserBikeOdoForceRefresh(): void {
		localStorage.removeItem(this.cacheKey);
		window.location.reload();
	}
}

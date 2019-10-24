export class HerokuEndpointResolver {

	private static totalEndpoints = 2;
	private static patternId = "${id}";

	public static resolve(url: string): string {
		const now: Date = new Date();
		const endPointId: number = HerokuEndpointResolver.endPointID(HerokuEndpointResolver.totalEndpoints, now);
		return url.replace(HerokuEndpointResolver.patternId, ("0" + endPointId).slice(-2));
	}

	private static endPointID(serversInCluster: number, date: Date): number {
		const worldHour = date.getUTCHours();
		return Math.floor(worldHour / (24 / serversInCluster)) + 1;
	}
}

export class DistributedEndpointsResolver {

	private static totalEndpoints = 2;
	private static patternId = "${id}";

	public static resolve(url: string, totalEndpoints: number = DistributedEndpointsResolver.totalEndpoints): string {
		const now: Date = new Date();
		const endPointId: number = DistributedEndpointsResolver.endPointID(totalEndpoints, now);
		return url.replace(DistributedEndpointsResolver.patternId, ("0" + endPointId).slice(-2));
	}

	private static endPointID(serversInCluster: number, date: Date): number {
		const worldHour = date.getUTCHours();
		return Math.floor(worldHour / (24 / serversInCluster)) + 1;
	}
}

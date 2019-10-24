import { StravaAccount } from "./strava-account";

export class StravaApiCredentials {

	public static readonly DEFAULT_MODEL: StravaApiCredentials = new StravaApiCredentials(null, null);

	public clientId: number;
	public clientSecret: string;
	public accessToken: string;
	public refreshToken: string;
	public expiresAt: number;
	public stravaAccount: StravaAccount;

	constructor(clientId: number, clientSecret: string, accessToken: string = null, refreshToken: string = null,
				expiresAt: number = null, stravaAccount: StravaAccount = null) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiresAt = expiresAt;
		this.stravaAccount = stravaAccount;
	}
}

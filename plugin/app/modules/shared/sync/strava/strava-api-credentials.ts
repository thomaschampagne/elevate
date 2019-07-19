export class StravaApiCredentials {

	public static readonly DEFAULT_MODEL: StravaApiCredentials = new StravaApiCredentials(null, null);

	public clientId: number;
	public clientSecret: string;
	public accessToken: string;
	public refreshToken: string;
	public expiresAt: number;

	constructor(clientId: number, clientSecret: string, accessToken: string = null, refreshToken: string = null) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
	}
}
